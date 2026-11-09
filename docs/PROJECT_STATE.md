# ESG Compass Project State

Last updated: 2026-11-09

## Current release

- Publication data: 1442 contents
- Curated contents: 21
- Publicly visible contents: 327
- Latest publication timestamp: 2026-11-09T14:23:47.000Z
- Latest publication: BBVA可持续金融活动跃升27%，达到1200亿欧元
- Local site: http://localhost:3001
- Production site: https://esg-compass-ai.vercel.app

## Data quality gates

- Public lists require a score of at least 30 and a usable third-person summary.
- Curated items require a score above 75 and a concise recommendation reason.
- Non-curated items must not carry recommendation reasons.
- Summaries must not repeat the title, use first-person editorial voice, or comment on source completeness.
- Public summaries must be complete and no longer than 300 Chinese characters.

## API

- Public read-only API: `/api/v1/public`
- Contents: `/api/v1/public/contents`
- Detail: `/api/v1/public/contents/{id}`
- Daily report: `/api/v1/public/daily`
- Knowledge zones: `/api/v1/public/zones`
- Status: `/api/v1/public/status`
- Private equivalents use `/api/v1/*` with `Authorization: Bearer` or `X-API-Key`.

## Source health

- Latest weekly report: `data/source-health.json`
- Current result: 78 total, 53 enabled, 41 healthy, 4 idle, 0 degraded, 8 pending configuration, 25 disabled.
- Pending sources require `SOGOU_COOKIE` or mailbox credentials. Do not enable or rewrite sources without user approval.

## Known limitations

- Some external publishers block automated article retrieval.
- Items without enough verified article content remain stored but are excluded from public lists.
- Finance for Biodiversity Foundation may time out while other sources continue normally.

## Context handoff template

When a conversation becomes long, retain only:

1. Current objective and completion criteria.
2. Confirmed product decisions and constraints.
3. Files, APIs, commands, and deployment state that changed.
4. Current counts, latest timestamp, tests, and failed sources.
5. Unresolved issues and exact next actions.

Discard repeated status messages, old command output, and superseded plans.
