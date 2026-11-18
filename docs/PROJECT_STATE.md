# ESG Compass Project State

Last updated: 2026-11-18

## Current release

- Publication data: 1871 contents
- Curated contents: 19
- Publicly visible contents: 567
- Latest publication timestamp: 2026-11-17T05:00:00.000Z
- Latest publication: 揭晓：俄罗斯、沙特阿拉伯和澳大利亚是有史以来最大的二氧化碳出口国
- Local site: http://localhost:3001
- Production site: https://esg-compass-ai.vercel.app

## Climate risk lab

2026-11-18 release/research follow-up: commit 459ace5 pushed to origin/v2. Production main push was rejected by automatic approval review; explicit confirmation was requested. Browser inspection confirmed the production climate-lab still shows the old illustrative multiplier/value-index UI, so the new release is NOT live. No workaround deployment was attempted. New research covers 17 issuers across mainland China, Hong Kong, Taiwan, France, Germany, Netherlands, Denmark, UK, US, Singapore, Australia, Japan, Canada and Switzerland: 14 relevant-section/selected-page reviews and 3 indexed excerpts pending full-page verification. Italy Enel and Spain Iberdrola remain additional indexed leads, outside the 17 core samples. See docs/CLIMATE_DISCLOSURE_BENCHMARKS.md and docs/CLIMATE_DISCLOSURE_WORKPAPER_SPEC.md; structured reference data is data/research/climate-disclosure-benchmarks.json. No report-generation UI or model has been implemented in this research batch.

2026-11-18 case expansion: 19 curated cases (11 added), including EDF heat/drought, manufacturing floods, supply dependencies, storm recovery and SCE Eaton accounting effects. All-risk browsing is now the default; current-risk filtering and six-at-a-time loading remain lightweight. New cases include evidence locators, manual verification dates and date precision. Weekly Wednesday 10:00 Asia/Shanghai thread automation esg-compass-3 searches for additions and material revisions; this is not a deployed server-side monitoring pipeline. Market research and disclosure-workpaper design are in docs/CLIMATE_MARKET_AND_DISCLOSURE_REVIEW.md. Disclosure generation is planned, NOT implemented; existing model coverage limitations remain. Validation: typecheck and 107 tests passed; production build passed outside the sandbox after a sandbox subprocess startup failure (existing WeChat tracing warning remains). Browser verified 19 total / 6 initial / 12 after loading; current heat filter returns EDF; 390px viewport had no horizontal overflow. Local preview restarted with this build; no production push in this batch.

Stage B partial preview, 2026-11-18: NASA THREDDS NEX-GDDP-CMIP6 v2.0 / ACCESS-CM2 r1i1p1f1 tasmax has two fully validated Shanghai records (SSP126, SSP245; 1995–2014 versus 2041–2060). 81 raw CSV evidence files saved; independent threshold recount passes. The intended second grid and SSP585 windows are incomplete after NASA 503 responses and a subsequent health-check timeout. No missing year is treated as zero. Public read-only climate-risk API serves only complete windows; the UI defaults to heat, displays annual bars and explicit missing-coverage states. Full Stage B acceptance is NOT reached. Resume with climate:collect when upstream recovers; climate:verify --require-full gates the target six records. Climate pulse and corporate monitoring remain unimplemented.

2026-11-18: The current implementation supersedes the prototype notes below. The UI supports versioned IPCC AR6, IEA WEO2025 and NGFS Phase V scenario selection, with compatible risk types and explicit unavailable-data states. Conditional downtime and carbon-cost arithmetic lives in lib/climate-lab-model.ts. Arbitrary hazard multipliers, spatial heatmaps and valuation indices have been removed. Case selection now applies a rolling five-year window; wildfire and drought are separate categories, with 2026 Rio Tinto and BASF adaptation samples. See docs/CLIMATE_LAB_TECHNICAL_PLAN.md for staged delivery and acceptance gates.

Historical prototype notes (superseded where inconsistent with the above):

- Interactive prototype implemented as the independent `/climate-lab` tool with one fictional project, coordinate/map positioning, adjustable analysis radius, transparent model factors, and five physical/transition risks.
- The homepage exposes a flask-marked `进入实验室` shortcut at the right edge of the content-type filter row; no standalone promotional banner is used, and the knowledge-zone index remains regulation-only.
- `/zones/climate-risk` remains a regulation and event knowledge zone; `/zones/climate-lab` redirects to the new canonical route.
- Desktop and 390px mobile rendering validated with no horizontal overflow or console warnings.
- Physical SSP scenarios and NGFS transition scenarios are independently controlled; the prototype does not infer a one-to-one mapping.
- Baseline source values, user stress-test offsets, and asset exposure/vulnerability/protection assumptions are separated; the UI exposes intermediate hazard and operating-impact factors and supports reset.
- The initial rolling-five-year company case sample uses first-party disclosures and supports relevance, impact-level, and recency sorting. Event impact is not presented as climate attribution.
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
