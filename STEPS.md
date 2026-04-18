# Build Steps — TwinMind Live Suggestions

Each step is self-contained and runnable before moving to the next. Check off as completed.

---

## Phase 1 — Skeleton (get something on screen)

- [ ] **1.1** Scaffold Vite + React + TypeScript project (`pnpm create vite`)
- [ ] **1.2** Install deps: `groq-sdk`, `react`, `typescript`
- [ ] **1.3** Build 3-column layout — static, no logic, just structure and labels
- [ ] **1.4** Settings screen / modal — API key input, stored in React state only
- [ ] **1.5** Verify layout renders correctly, API key persists in state across re-renders

---

## Phase 2 — Audio + Transcription (left panel alive)

- [ ] **2.1** `useAudioCapture` hook — mic access, MediaRecorder, 30s chunking
- [ ] **2.2** `useTranscription` hook — sends audio blobs to Groq Whisper Large V3
- [ ] **2.3** Append transcript chunks to left panel with timestamps
- [ ] **2.4** Speaker label parsing from Whisper response → show "Speaker A / Speaker B"
- [ ] **2.5** Test: speak for 60s, confirm two transcript chunks appear with timestamps

---

## Phase 3 — Live Suggestions (center panel alive)

- [ ] **3.1** `useSuggestions` hook — fires every 30s, calls GPT-OSS 120B with rolling 90s context
- [ ] **3.2** Suggestion prompt v1 — phase-aware, type-conditional (see INTERVIEW_PREP.md)
- [ ] **3.3** Parse JSON response defensively — fallback re-prompt on malformed output
- [ ] **3.4** Render suggestion batch with typed badges (FACT-CHECK / TALKING POINT / QUESTION / ACTION ITEM)
- [ ] **3.5** Manual "Reload" button — triggers refresh outside the 30s cadence
- [ ] **3.6** Auto-refresh countdown timer display
- [ ] **3.7** Proactive re-trigger — detect intent signals in transcript, skip the timer
- [ ] **3.8** Suggestion relevance decay — current batch full opacity, older batches fade
- [ ] **3.9** Test: run a 3-minute mock conversation, check suggestion quality and timing

---

## Phase 4 — Chat / Detail Answers (right panel alive)

- [ ] **4.1** `useChat` hook — manages conversation thread
- [ ] **4.2** Click suggestion → populate chat with that suggestion as user message
- [ ] **4.3** Detail answer prompt — full transcript context, longer-form response
- [ ] **4.4** Stream tokens from Groq to chat panel — first token visible < 500ms
- [ ] **4.5** Free-text input in chat panel — user can ask anything
- [ ] **4.6** Test: click each suggestion type, verify answer quality and streaming

---

## Phase 5 — Settings + Polish

- [ ] **5.1** Settings screen: API key, context window size (slider), suggestion prompt textarea
- [ ] **5.2** Editable system prompt — pre-filled with engineered default, user can override
- [ ] **5.3** Conversation phase indicator — show current phase (Opening / Middle / Closing)
- [ ] **5.4** Visual polish — consistent spacing, readable transcript, badge colors
- [ ] **5.5** Error states — mic denied, API key invalid, Groq rate limit hit
- [ ] **5.6** Loading states — spinner while suggestion batch is generating

---

## Phase 6 — Export + Deploy

- [ ] **6.1** Export button — generates Markdown file (transcript + suggestion batches + chat)
- [ ] **6.2** Test export output — readable as standalone meeting notes
- [ ] **6.3** Production build — `pnpm build`, verify no TypeScript errors
- [ ] **6.4** Deploy to Vercel — `vercel --prod`, confirm public URL works
- [ ] **6.5** Test deployed version end-to-end on a real conversation

---

## Phase 7 — README + Interview prep

- [ ] **7.1** Write README.md — what it does, how to run locally, architecture overview, deployment
- [ ] **7.2** Add "UX observations from TwinMind product" section to README
- [ ] **7.3** Final pass on INTERVIEW_PREP.md — fill in "things that didn't work" and "performance observations"
- [ ] **7.4** Record a short demo video if required by submission
