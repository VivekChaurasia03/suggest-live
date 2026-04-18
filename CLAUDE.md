# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

TwinMind Live Suggestions — a real-time AI meeting copilot. The user pastes a Groq API key, starts recording, and sees:
- **Left panel**: live rolling transcript
- **Center panel**: 3 AI-generated contextual suggestions, refreshing every ~30 seconds automatically or on manual refresh
- **Right panel**: expandable chat for drilling into any suggestion

No auth, no persistence, no backend — sessions are ephemeral. The Groq API key is held only in React state for the duration of the session.

---

## Common commands

```bash
# Frontend (once initialized)
pnpm install          # Install deps
pnpm dev              # Dev server at http://localhost:5173
pnpm build            # Production build to dist/
pnpm preview          # Preview production build
pnpm tsc --noEmit     # Type check without emitting

# Run a single test file
pnpm vitest run src/hooks/useAudioCapture.test.ts

# Linting
pnpm lint             # ESLint
pnpm lint --fix       # ESLint with auto-fix
```

---

## Architecture

### Data flow

```
Microphone → Web Audio API → MediaRecorder (30s chunks)
                                    ↓
                          Groq Whisper Large V3
                                    ↓
                          Transcript accumulator (in-memory)
                                    ↓
                ┌──────────────────┴──────────────────┐
         Live transcript                    Groq GPT-OSS 120B
         (left panel)                  (every 30s or manual refresh → 3 suggestions)
                                                ↓
                                        Suggestions panel
                                   (click → longer-form detail request
                                    using full transcript context)
```

### Key hooks (once built)

- `useAudioCapture` — mic access, MediaRecorder, 30s chunking cadence
- `useTranscription` — sends audio blobs to Groq Whisper, appends to transcript
- `useSuggestions` — fires on transcript update, calls Groq chat completions, parses 3-item JSON response
- `useChat` — manages the sidebar chat thread, streams tokens from Groq

### Groq API usage

- **Transcription**: `groq.audio.transcriptions.create` with model `whisper-large-v3`
- **Suggestions**: `groq.chat.completions.create` with model `gpt-oss-120b` (GPT-OSS 120B), response_format `{ type: "json_object" }`, structured as `{ suggestions: [{ text, type }] }` — uses a rolling context window (last N seconds of transcript), not the full session
- **Detail answer** (suggestion click): same model, separate longer-form prompt, full transcript injected as context, streamed to chat panel
- **Chat**: same model, streaming enabled, full transcript as system context
- API key passed directly from React state — never logged, never written to disk

### State shape

All state lives in a single context provider (`AppContext`). Session export collects:
- `transcript: { timestamp, text }[]`
- `suggestionBatches: { timestamp, items: Suggestion[] }[]`
- `chatHistory: { role, content }[]`

### Project layout (once source exists)

```
frontend/
  src/
    hooks/       # useAudioCapture, useTranscription, useSuggestions, useChat
    components/  # TranscriptPanel, SuggestionsPanel, ChatPanel, SettingsModal
    services/    # groq.ts — all Groq API calls in one place
    context/     # AppContext.tsx — single state provider
    types/       # Shared TypeScript types
  vite.config.ts
  tsconfig.json
  package.json
```

### Prompt strategy

The suggestion prompt must deliberately mix types — not always the same kind. The right mix depends on context:

- **Fact-check**: use when a specific claim or number is stated ("this works 80% of the time")
- **Talking point**: use when the topic shifts or a new concept is introduced
- **Clarifying question**: use when the conversation is vague or one-sided

The system prompt must instruct the model to decide the mix dynamically based on what just happened in the transcript, not always return one of each. Evaluate the output by asking: are these 3 suggestions genuinely useful for someone in this conversation right now, or are they generic?

Detail answers (triggered by clicking a suggestion) use a separate, longer-form prompt and inject the **full** transcript — not just the rolling window used for live suggestions.

### Session tracking

- `STEPS.md` — build checklist, check off each step as it ships
- `INTERVIEW_PREP.md` — decision log; update after every feature with what was built, why, and what tradeoffs were made

### Key constraints

- Latency is a primary evaluation criterion — minimize round-trips, stream where possible
- Suggestions must be exactly 3 — enforce in prompt and parse defensively
- Export is a JSON download triggered client-side — no server needed
- No CSS frameworks without discussion (see `.claude/CLAUDE.md`)
