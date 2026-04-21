# TwinMind — Live Suggestions

A real-time AI meeting copilot that listens to your conversations and surfaces contextual suggestions every 30 seconds to keep you sharp in the room.

## What it does

- **Live transcription** — captures mic audio in 30-second chunks, transcribed via Groq Whisper Large V3
- **AI suggestions** — every 30 seconds (or on demand), generates 3 typed suggestions using GPT-OSS 120B: fact-checks, talking points, questions to ask, and action items
- **Conversation-phase awareness** — suggestion mix adapts based on where you are in the conversation (opening / middle / closing)
- **Proactive refresh** — detects uncertainty phrases ("I don't know", "could you clarify") and triggers an immediate suggestion refresh without waiting for the timer
- **Streamed detail answers** — click any suggestion to get a full answer streamed token-by-token with complete session context
- **Session export** — download the full session (transcript + suggestion batches + chat) as Markdown
- **Editable prompt** — tune the suggestion system prompt directly from the settings screen

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React + TypeScript |
| Styling | Tailwind CSS v4 |
| Transcription | Groq Whisper Large V3 |
| Suggestions + Chat | GPT-OSS 120B via Groq |
| Deployment | Vercel |

No backend. No auth. No persistence. Sessions are ephemeral — your API key and transcript live only in the browser tab.

## Running locally

```bash
cd frontend
pnpm install
pnpm dev
```

Open `http://localhost:5173`, click Settings, paste your [Groq API key](https://console.groq.com), and start recording.

## Architecture

```
Mic → MediaRecorder (30s chunks) → Groq Whisper → Transcript panel
                                                         ↓
                                          Rolling 90s context window
                                                         ↓
                                       GPT-OSS 120B → 3 suggestions
                                                         ↓
                                      Click suggestion → streamed detail answer
                                      (full session transcript as context)
```

**Key design decisions:**

- **Rolling context for suggestions, full context for detail answers** — live suggestions use the last 90s of transcript (configurable) so they stay relevant to right now. Detail answers inject the full session because the user is explicitly going deeper.
- **Phase-aware prompt** — the suggestion prompt adapts based on elapsed time. Opening (0–5 min): more fact-checks and talking points. Middle (5–20 min): more questions to ask. Closing (20+ min): action items introduced.
- **Proactive intent detection** — scans each Whisper response for uncertainty signals and fires suggestions immediately, before the 30s timer.
- **Suggestion decay** — older batches fade visually so the current batch has priority without deleting history.
- **Built-in mic preference** — automatically selects the laptop's built-in mic over external monitors or USB devices.
- **No backend** — Groq API key held only in React state, never stored or transmitted elsewhere.

## Deployment

Deployed on Vercel. The `vercel.json` at repo root handles build configuration. Every push to `main` triggers a redeploy.

---

## UX observations from using TwinMind

These are observations from using the TwinMind app directly — things that informed design decisions in this build.

**What works well in TwinMind:**
- The transcript panel updates in near real-time — latency between speaking and seeing text is noticeably lower than competitors like Otter.ai. This appears to come from shorter audio chunk intervals.
- The suggestion cards are scannable at a glance — short text, clear type labels. You don't need to read the full card to decide if it's relevant.
- The "Ask TwinMind" sidebar feels like a natural extension of the suggestions panel rather than a separate tool — the context handoff between clicking a suggestion and continuing in chat is smooth.

**What this build improves on:**
- **Suggestion staleness** — in TwinMind, older suggestion batches stack with equal visual weight. Batch 1 from 3 minutes ago competes visually with the current batch. This build applies opacity decay so older batches recede without being deleted.
- **Static suggestion mix** — TwinMind returns a similar type distribution on each refresh regardless of where the conversation is. This build uses phase detection and explicit type-selection criteria in the prompt so the mix reflects what's actually happening ("if a number was just stated, use FACT-CHECK — don't use it for vague statements").
- **No proactive triggers** — TwinMind refreshes on a fixed timer. This build also fires on detected uncertainty signals, which better matches their own brand promise of "answers before you ask."
