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
- Apply issuer-document and interpretation provenance rules throughout the product; see `docs/POLICY_SOURCE_AND_INSIGHT_PLAN.md`.
- Source tier, score, channel, domain, topic match, and story membership do not prove issuer identity, legal applicability, independent corroboration, or a new policy milestone.
- Keep verified issuer documents distinct from source articles and attributed interpretations. Only evidence-backed, explicitly reviewed links may appear as official documents or related insights; hide unsupported associations.
- Preserve original article attribution and dates. Interpretations, reposts, and deadline dates do not create policy progress; do not infer that a proposal or consultation is in force.
- Policy-to-interpretation and interpretation-to-policy links are reciprocal and independent of progress timelines. Exclude the current article from related insights; never require or invent a milestone to create an otherwise verified relation.

## Product optimization protocol

- Before implementing a new product idea, assess the user value, strategic fit, evidence, implementation and maintenance cost, risks, and simpler alternatives.
- Do not treat every idea as a requirement. Surface weak assumptions, unnecessary complexity, conflicts with existing priorities, and ideas that should be validated or deferred before implementation.
- When an idea is worth pursuing, state the expected outcome and success criteria before changing the product.
- After every implemented product optimization, update `docs/PRD.md` and `docs/ARCHITECTURE.md` in the same change so the product definition, technical design, and code remain aligned.
- If an optimization affects APIs, data contracts, integrations, or operating procedures, update the corresponding durable documentation as part of the same change.

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
