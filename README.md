# TwinMind — Live Suggestions

A real-time AI meeting copilot that listens to your conversations and surfaces contextual suggestions every 30 seconds to keep you sharp in the room.

## What it does

- **Live transcription** — captures mic audio in 30-second chunks, transcribes via Groq Whisper Large V3
- **AI suggestions** — every 30 seconds (or on demand), generates 3 typed suggestions using GPT-OSS 120B: fact-checks, talking points, questions to ask, and action items
- **Conversation-phase awareness** — suggestion mix adapts based on where you are in the conversation (opening, middle, closing)
- **Proactive refresh** — detects uncertainty phrases ("I don't know", "could you clarify") and triggers a suggestion refresh immediately without waiting for the timer
- **Detailed answers** — click any suggestion to get a full, streamed answer with complete session context
- **Session export** — download the full session (transcript + suggestion batches + chat) as Markdown
- **Editable prompt** — tune the suggestion system prompt directly from the settings screen

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React + TypeScript |
| Styling | Tailwind CSS v4 |
| Transcription | Groq Whisper Large V3 |
| AI suggestions | GPT-OSS 120B via Groq |
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
```

**Key design decisions:**

- **Rolling context for suggestions, full context for detail answers** — live suggestions use the last 90s of transcript (configurable) so they stay relevant to right now. Detail answers use the full session for complete context.
- **Built-in mic preference** — automatically selects the laptop's built-in microphone over external monitors or USB devices.
- **Suggestion decay** — older suggestion batches fade visually so the current batch always has priority without deleting history.
- **No backend** — the Groq API key is held only in React state, never stored or transmitted anywhere else.

## Deployment

Deployed on Vercel. The `vercel.json` at the root handles build configuration. Every push to `main` triggers a redeploy automatically.
