# Interview Prep — TwinMind Live Suggestions

This document logs every significant decision made while building this project: what we chose, what we rejected, and why. Update it after every feature ships.

---

## Project understanding

**What the assignment is actually asking**
Build a web app that listens to live audio, transcribes it in real-time, and surfaces 3 contextual AI suggestions every ~30 seconds. TwinMind already has this feature in their product — the assignment is to demonstrate you can build a version of it and improve on it. Evaluation is heavily weighted on prompt quality, latency, and whether the suggestions are actually useful in context.

**The red flag TwinMind calls out explicitly**
Submissions from candidates who haven't used the real TwinMind product. This means your README and your answers in the interview need to reference specific UX observations from using their app, not just the spec document.

---

## Architectural decisions

### Decision: No backend — frontend-only app

**What we chose:** Pure Vite + React app. Groq API called directly from the browser using the user's own API key.

**What we rejected:** FastAPI backend to proxy Groq calls.

**Why:**
- The assignment says "no persistence required, no auth required" — a backend adds zero user value here
- Removing a network hop reduces suggestion latency
- Simpler deployment (static site on Vercel/Cloudflare Pages)
- The API key never leaves the user's browser session — actually more private this way

**Tradeoff to acknowledge:** In production you'd want a backend to avoid exposing API keys in client-side code and to add rate limiting. For this assignment scope, frontend-only is the right call.

---

### Decision: GPT-OSS 120B for suggestions and chat, Whisper Large V3 for transcription

**What we chose:** Exactly what the assignment specifies.

**Why this matters:** TwinMind standardized the model to evaluate candidates on prompt quality, not model selection. Using a different model — even a better one — signals you didn't read the spec carefully.

---

### Decision: Rolling context window for suggestions, full transcript for detail answers

**What we chose:**
- Live suggestions → last ~90–120 seconds of transcript
- Detail answers (click on suggestion) → full session transcript

**What we rejected:** Using full transcript for both.

**Why:**
- Suggestions need to be relevant to *right now*, not to something said 20 minutes ago
- Full transcript in every suggestion call gets expensive and slow as the session grows
- Detail answers are explicitly a "go deeper" action — the user wants full context there
- This also maps to how humans think: you want help with the current thread, not a recap of everything

**Tradeoff:** Rolling window might miss important earlier context if someone refers back to something. Mitigated by making the window configurable in settings.

---

### Decision: Streaming for detail answers

**What we chose:** Stream tokens from Groq directly to the chat panel — first token visible in <500ms.

**What we rejected:** Wait for full completion then render.

**Why:** Latency is an explicit eval criterion. Streaming makes a 4-second response feel fast because the user sees progress immediately. Groq's API supports streaming natively — it's a one-line change.

---

### Decision: Suggestion relevance decay (visual staleness)

**What we chose:** Previous suggestion batches visually fade as newer ones arrive. Current batch = full opacity. One batch old = 60%. Two batches old = collapsed/archived.

**What we rejected:** All batches equally visible (the reference mockup behavior).

**Why:** In the reference mockup, 11 batches are stacked with equal visual weight. Batch 1 from 3 minutes ago competes with the current batch for attention. In a real meeting, old suggestions aren't actionable — they just add noise. Decay solves this without deleting history.

---

### Decision: Proactive re-trigger on intent signals

**What we chose:** If the live transcript contains phrases like "I don't know", "what was the", "could you clarify", "I'm not sure" — immediately fire a suggestion refresh, skipping the 30s wait.

**What we rejected:** Strictly timer-based refresh only.

**Why:** TwinMind's own brand promise is "gave me answers before I asked." A purely reactive 30s timer contradicts this. When someone expresses uncertainty, that's the exact moment a suggestion is most useful. This is a 10-line addition to the transcription hook.

---

### Decision: Speaker labels in transcript and suggestions

**What we chose:** Use Whisper's speaker diarization output to label turns (Speaker A / Speaker B) in the transcript, and pass those labels to the suggestion prompt.

**What we rejected:** Raw undifferentiated transcript text (reference mockup behavior).

**Why:** "The client mentioned X" is a much better suggestion hook than "someone mentioned X." Speaker-aware context lets the model give you suggestions specifically for your role in the conversation. TwinMind's own transcription page advertises 3.8% Diarization Error Rate — this is a capability they're proud of, and the reference mockup doesn't use it.

---

### Decision: Conversation phase adaptation

**What we chose:** The suggestion prompt includes the current conversation phase (opening / middle / closing), derived from elapsed time and keyword detection. The phase influences the suggestion type mix:
- Opening (0–5 min): more TALKING POINT and FACT-CHECK
- Middle (5–20 min): more QUESTION TO ASK
- Closing (20+ min, or "let's wrap up" detected): introduce ACTION ITEM as a 4th type

**What we rejected:** Same fixed prompt every 30 seconds regardless of where the conversation is.

**Why:** The assignment asks you to decide "what makes sense when." A flat prompt that always returns one of each type is the lazy answer. Conversations have structure — the useful suggestions at minute 2 are different from the useful ones at minute 25.

---

### Decision: Editable system prompt in settings

**What we chose:** Settings screen includes a textarea with the suggestion system prompt, pre-filled with our engineered default. User can modify it.

**Why:** The assignment explicitly asks for this. It also signals that you designed the system for iteration — you're not hiding the prompt, you're inviting the user to tune it. In an interview, this is a good hook to explain your prompt engineering choices.

---

## Prompt engineering decisions

### Suggestion prompt strategy

**The core challenge:** Don't return one of each type every time. The model should read the transcript and decide what's actually useful right now.

**What we instruct the model:**
- You are a live meeting copilot. Read the last [N seconds] of transcript.
- Decide which 3 suggestions are most useful *right now* for the person receiving them.
- Use FACT-CHECK when a specific claim, number, or assertion was just made.
- Use TALKING POINT when a new topic or concept was just introduced.
- Use QUESTION TO ASK when the conversation is one-sided, vague, or needs to go deeper.
- Use ACTION ITEM when commitments or next steps are being discussed (closing phase only).
- Return JSON: `{ "suggestions": [{ "text": "...", "type": "..." }] }`
- Never return generic suggestions. If the transcript doesn't support a specific type, pick a different type instead.

**Why this prompt works:** It gives the model decision criteria, not just categories. "If X, use Y" is more reliable than "return a mix."

---

### Detail answer prompt strategy

**What we instruct the model:**
- You have the full transcript of a conversation.
- The user clicked on this suggestion: [suggestion text]
- Give a detailed, useful answer. Be specific — reference what was actually said.
- If this was a fact-check, verify the claim and give sources if you have them.
- If this was a question, answer it fully and suggest follow-up angles.
- If this was a talking point, expand it with context and supporting evidence.

**Why full transcript here:** The user is explicitly going deeper. They want full context, not just the last 90 seconds.

---

## Phase 1 — Scaffold decisions

### Tailwind CSS over a custom stylesheet

**What we chose:** Tailwind v4 (via `@tailwindcss/vite` plugin — no config file needed).

**What we rejected:** A single `App.css` file with custom classes.

**Why:** Tailwind keeps styles co-located with the component. No context switching between files, no class naming decisions, no dead CSS accumulating. For a single-developer assignment with a tight deadline this is faster to write and easier to read in a code review.

**Tradeoff:** Tailwind classes can get verbose on complex components. Acceptable here since components are small.

---

### Groq SDK in the browser (no backend proxy)

**What we chose:** `groq-sdk` installed directly in the Vite frontend. API key held in React state.

**Why this is safe for an assignment:** The key never touches a server or gets committed. It lives only in the browser tab for the session duration.

**What to say if asked:** "In production I'd proxy through a backend to avoid exposing the key in client-side code and to add rate limiting. For this assignment scope, frontend-only removes a network hop and keeps deployment simple."

---

### Single `AppContext` for all state

**What we chose:** One context provider with all session state (transcript, suggestions, chat, settings).

**What we rejected:** Multiple contexts or a state management library (Zustand, Redux).

**Why:** The app has one screen and one session. There's no cross-route state, no complex derived state, no performance issue with a single context at this scale. Adding Zustand would be over-engineering.

---

## Phase 2 — Audio + Transcription decisions

### MediaRecorder stop/restart pattern (not timeslice)

**What we chose:** Start MediaRecorder, set a 30s `setInterval` that calls `.stop()`. On `onstop`, emit the blob then immediately restart the recorder.

**What we rejected:** `mediaRecorder.start(30000)` with a timeslice — this fires `ondataavailable` every 30s with partial chunks but keeps the recorder open, which produces fragmented WebM that Whisper can handle less reliably.

**Why:** Stop/restart gives us one complete, well-formed audio file per chunk. Whisper transcribes complete files more accurately than partial streams.

### Skipping near-empty blobs (< 1KB)

If the user pauses recording or there's silence, the blob is tiny. We skip anything under 1000 bytes to avoid burning API quota on empty transcriptions.

### Speaker diarization — intentionally not implemented

Whisper Large V3 on Groq does not return speaker labels. Real diarization needs a separate service (pyannote, AssemblyAI, etc.). We include the `speaker` field in `TranscriptChunk` so it's wired up when diarization is added, but for now it's unpopulated.

**What to say in interview:** "TwinMind advertises 3.8% DER — that's from a dedicated diarization model running on their backend, not from Whisper. For this assignment scope I left the field in the type but didn't add a second API dependency."

### Proactive intent detection in the transcription hook

After every Whisper response, we scan the transcript text for uncertainty phrases ("I don't know", "could you clarify", etc.). If matched, we call `onIntentDetected()` which will skip the 30s timer and fire suggestions immediately. This lives in the transcription hook because that's where we have the fresh text — no extra API call, no polling.

---

## Things that didn't work / were changed

*(Update this section as we build)*

---

## Performance observations

*(Update this section after testing)*

---

## What to say in the interview

**"Why did you build it frontend-only?"**
No persistence required, no auth required — a backend adds zero user value for this scope. Removing the proxy hop also reduces suggestion latency. In production I'd add a backend for rate limiting and to avoid client-side API key exposure.

**"How did you decide what kind of suggestions to surface?"**
I read TwinMind's product positioning — their brand promise is "answers before you ask." A flat prompt returning one of each type every 30 seconds doesn't deliver that. I built phase detection so the prompt adapts: more fact-checks early when claims are being made, more questions mid-conversation, action items at the close. The suggestion prompt explicitly tells the model to justify the type based on what just happened, not to fill a quota.

**"What would you improve if you had more time?"**
Past meeting context injection via TwinMind's MCP API — if the user has connected their account, surface relevant decisions from previous meetings when the same topic comes up. This is their key differentiator vs competitors and the live suggestions panel is the right place to surface it.

**"What was the hardest part?"**
Prompt reliability — getting the model to return exactly 3 suggestions in valid JSON every time without hallucinating types or being generic. Added defensive parsing and a fallback re-prompt on malformed output.
