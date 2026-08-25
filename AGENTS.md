# Codex Harness

This repository contains multiple independent n8n automation projects.

Projects live under `projects/<project-name>/`. Each project owns its workflow exports, context, fixtures, and implementation notes.

Startup order for future sessions:
1. Read this file.
2. Read `STATE.md`.
3. Read only the active project's `CONTEXT.md`.
4. Open only implementation files relevant to the current task.

Keep the global harness stable and small. Project-specific business rules belong in `projects/<project-name>/CONTEXT.md`.

Do not rebuild completed work listed in `STATE.md` unless the user asks.

Do not modify unrelated projects or shared files without a direct reason.

Never hardcode secrets, tokens, credentials, webhook URLs, or private customer data. Use n8n credentials or documented environment variables.

Prefer simple, maintainable workflows and concise project notes. Avoid copying generic n8n documentation into this repo.

When creating or materially changing an n8n workflow, include:
- Clear workflow documentation through node names, sticky notes/comments, or nearby project notes so each major step is understandable.
- A separate setup/run checklist in the active project notes covering required credentials, environment variables, placeholder IDs, webhook URLs, test data, activation steps, and operational things to watch for.
- Any known assumptions, limits, or failure points that someone should verify before making the workflow live.

After meaningful work, update `STATE.md` as a checkpoint, not an activity log.
