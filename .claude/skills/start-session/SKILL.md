---
name: start-session
description: Start a working session. Reads project context and current state, then asks what we're building today.
---

Read the following in order before saying anything:

1. `CLAUDE.md` — project overview, stack, schema, roadmap
2. `.claude/CLAUDE.md` — how to work in this repo, rules, phase discipline
3. `STEPS.md` — the build sequence and Phase 1 checklist
4. `notes/` folder — one file per completed step. Any step with a file here is DONE.

Then open with exactly this:

"What are we building today, and which step are we on?"

If the user isn't sure which step they're on, scan the codebase to determine what already exists, cross-reference against the Phase 1 checklist in `STEPS.md`, and suggest the next logical step.

Once the user confirms a step:
- State what the step produces in one sentence
- Build it — no preamble, no theory unless there's a non-obvious gotcha worth flagging first
- Ask one check question when the step is done before moving on
