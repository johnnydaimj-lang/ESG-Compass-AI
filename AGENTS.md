# ESG Compass AI

## Repository scope

- Work only in `ESG Compass_v2`.
- Treat legacy `esg-radar-mvp`, `esg-radar-ui`, and other sibling projects as read-only.
- Use `docs/PROJECT_STATE.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, and `docs/api-integration.md` as durable project references.
- Never commit secrets or values from `.env.local`.

## Core commands

- Type check: `npm run typecheck`
- Tests: `npm test`
- Production build: `npm run build`
- Local service: `npm run local:start`
- Local health: `npm run local:status`
- Source health: `npm run source:health`

## Data update sequence

Run these commands in order:

1. `npm run pipeline -- --mode=llm`
2. `npm run trace:upstream`
3. `npm run backfill:zh`
4. `npm run fix:summaries`
5. Validate summaries and public visibility.
6. Commit only `data/publication/` and push to both `main` and `v2`.

Do not revert an update because one source fails. Preserve the last valid data and report the failed source.

## Product invariants

- Public content must pass `isFeedEligible`.
- Only curated items may have `recommendReason`; clear it for non-curated items.
- Summaries and recommendation reasons use third-person editorial voice.
- Reject summaries that repeat the title, expose editorial voice, or comment on their own completeness.
- Do not automatically enable candidate sources or change `data/sources.json` without user approval.
- Keep published summaries complete, accurate, and at most 300 Chinese characters.

## Git and deployment

- Do not stage unrelated files under `data/content-ops/`, weekly previews, scans, or generated drafts.
- Publish data changes to both `origin/main` and `origin/v2`.
- Verify the commit status and the production page after pushing.
- Local site: `http://localhost:3001`
- Production site: `https://esg-compass-ai.vercel.app`

## Context protocol

When compacting or handing off context, preserve:

- Current goal and completed work
- Confirmed product rules and constraints
- Files and endpoints changed
- Current publication counts, latest timestamp, tests, and deployment state
- Failed sources or unresolved issues
- Exact next actions

Discard repeated progress messages, transient command output, and superseded implementation details.
