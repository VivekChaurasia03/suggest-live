---
name: chunk
description: Jump directly to a specific step in STEPS.md by step number.
---

The user wants to work on Step $ARGUMENTS.

Read `CLAUDE.md` and `STEPS.md`. Find the matching step. Then:

1. State what the step produces in one sentence
2. Build it — one sub-task at a time, wait for confirmation before the next
3. If something fails, diagnose and fix it before moving on
4. Ask one check question when the step is done

Each sub-task ends with: "Run that and tell me what you see."

Do not move to the next step until the current one is confirmed working.
