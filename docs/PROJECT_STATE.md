# ESG Compass Project State

Last updated: 2026-11-17

## Current release

- Publication data: 1871 contents
- Curated contents: 19
- Publicly visible contents: 567
- Latest publication timestamp: 2026-11-17T05:00:00.000Z
- Latest publication: 揭晓：俄罗斯、沙特阿拉伯和澳大利亚是有史以来最大的二氧化碳出口国
- Local site: http://localhost:3001
- Production site: https://esg-compass-ai.vercel.app

## Climate risk lab

- Interactive prototype implemented in `/zones/climate-risk` with three sample sites and five physical/transition risks.
- Desktop and 390px mobile rendering validated with no horizontal overflow or console warnings.
- Physical SSP scenarios and NGFS transition scenarios are independently controlled; the prototype does not infer a one-to-one mapping.
- All current spatial values and valuation bridges are explicitly illustrative and are not predictions, engineering assessments, insurance prices, or statutory valuations.
- Next implementation slice: one live physical-risk adapter plus NGFS transition data, normalized provenance, uncertainty intervals, and versioned caching.

## Data quality gates

- Public lists require a score of at least 30 and a usable third-person summary.
- Curated items require a score above 75 and a concise recommendation reason.
- Non-curated items must not carry recommendation reasons.
- Summaries must not repeat the title, use first-person editorial voice, or comment on source completeness.
- Public summaries must be complete and no longer than 300 Chinese characters.
- Periodic multi-event roundups such as weekly reviews are excluded from the event timeline; individual facts should be collected from their original sources.

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
- Current source configuration: 79 total, 54 enabled.
- Latest live pipeline result (2026-11-17): 53 source runs succeeded, 0 failed, 26 skipped (including 25 disabled sources); 7 credential-gated sources successfully used configured RSS fallbacks.
- Deloitte's climate insights source was migrated from `www2.deloitte.com` to the current `www.deloitte.com` page and passed a focused collection check.
- Latest full health result: 78 total, 53 enabled, 41 healthy, 4 idle, 0 degraded, 8 pending configuration, 25 disabled (generated 2026-11-16 before the new source was added).
- The IMAP newsletter source still requires `MAILBOX_HOST`, `MAILBOX_USER`, and `MAILBOX_PASSWORD`; no credentials are stored in the repository.

## Known limitations

- Some external publishers block automated article retrieval.
- Items without enough verified article content remain stored but are excluded from public lists.
- Finance for Biodiversity Foundation may time out while other sources continue normally.
- Eight legacy snapshot source names still use stable temporary source IDs because no exact configured source identity exists; this does not indicate a live collector failure, but should be resolved during source catalog cleanup.

## Context handoff template

When a conversation becomes long, retain only:

1. Current objective and completion criteria.
2. Confirmed product decisions and constraints.
3. Files, APIs, commands, and deployment state that changed.
4. Current counts, latest timestamp, tests, and failed sources.
5. Unresolved issues and exact next actions.

Discard repeated status messages, old command output, and superseded plans.
