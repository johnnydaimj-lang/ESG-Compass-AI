# ESG Compass Project State

Last updated: 2026-11-20

2026-11-20 production release requested: user explicitly requires progress on interpretation pages as well as policy pages. Event detail now renders every available, explicitly reviewed progress overview directly, including a single node; removed the interpretation-only collapsed/hidden branches and the duplicate standalone self-check block. Existing newest-three/expand-earlier behavior remains. Zone matter links again use #event-progress consistently, while reciprocal policy/interpretation lookup remains independent of milestone availability. No invented progress, new cases, source enablement, homepage changes or content re-scoring. PRD, ARCHITECTURE, source/insight technical plan and API link documentation synchronized. Typecheck, 121 tests and production build passed (existing WeChat tracing warning remains). Release includes the prior local-only issuer-source, reciprocal-link and unified-source-rule commits, with no unrelated content-ops/weekly files. Production deployment and live-page verification follow the authorized push.

2026-11-20 reciprocal policy/interpretation refinement (LOCAL ONLY): policyRelationsForEvent now resolves verified policy associations independently of progress validity; optional policy.eventIds separates policy events from interpretation membership, with legacy explicit-entry compatibility and exact verified-document URL matching. Interpretation pages show “政策解读” and “解读对应的政策／法规”; policy pages retain issuer originals and linked interpretations. The current article is excluded from related-insight lists. Multiple explicitly linked policies can be retained (first three visible, more expandable). Progress is optional: policy pages retain current reviewed progress; interpretation pages show multiple known milestones collapsed, omit single-node progress UI and retain enterprise self-checks. Zone links targeting interpretations use #policy-context, avoiding missing anchors. No news classification rewrite, new source, automatic relation inference or new real-world case. Validation: typecheck, 121 tests and production build passed (existing WeChat tracing warning remains); local browser verified reverse policy link, no self-recommendation, no forced single-node timeline, retained self-checks, correct zone anchor, issuer policy view, 390px no overflow and no page errors. PRD 9.3, ARCHITECTURE 10.4, API documentation and technical plan aligned. Local preview restarted. Not pushed; production remains 86e82ff.

2026-11-19 user confirmed product-wide provenance standard: PRD 1.5, ARCHITECTURE 10.3, AGENTS and POLICY_SOURCE_AND_INSIGHT_PLAN.md now require issuer documents, source articles and attributed interpretations to remain distinct across new content and historical enrichment. Added shared prompts/source-evidence.md to understanding/scoring/recommendation, rewrite, structure, story-digest and clustering templates. Removed deterministic inference of principal/observer from source tier or academic category; unknown authorship conservatively falls back to relayer without changing category, score weights or thresholds. Existing runner still uses deterministic understanding/structure; template updates do not replace it with LLM verification, and heuristic facts/clusters cannot establish policy-context evidence. Validation: typecheck, 119 tests, expansion of all 15 prompt templates and production build passed (existing WeChat tracing warning remains). Combined content prompt version now content-understanding+structure+selection-score+recommend-reason@672d31be17ce. No full pipeline execution, publication rewrite, source enablement, bulk backfill or deployment this batch. Official policy-context coverage remains TWO curated matters; this is a unified standard, not a claim of completed historical provenance. Local-only changes follow 5890a8f; production remains 86e82ff.

2026-11-19 policy-source/insight refinement (LOCAL ONLY): optional matter.policy now links explicitly verified issuer documents and eligible existing interpretation content. UK HRDD links official HCWS454 statement (2026-11-04) to the existing Skadden interpretation (2026-11-09), with four verified authors and an evidence locator; EU limited-assurance links the official consultation page, with no invented interpretation. Existing article titles, dates, classification and source attribution remain. Detail highlights issuer document, then shows up to three explicit interpretations near the bottom; no topic-only matching. Unknown sources use “阅读来源文章”; sourceRefs remain unverified supplemental links, are deduplicated and their legacy dates are not displayed as document dates. Upstream extraction now permits PDFs, preserves functional URL queries, and stops assigning report timestamps to new linked documents. Existing snapshot rows and source enablement are unchanged. This is curated document-level provenance, NOT an automatic regulator monitoring service or full historical backfill. Validation: typecheck, 118 tests and production build passed (existing WeChat tracing warning remains); local browser verified UK official/source/author/insight presentation, EU no-empty-insight state, unverified fallback, 390px no overflow and no page errors. PRD, ARCHITECTURE, api-integration, product map and POLICY_SOURCE_AND_INSIGHT_PLAN.md aligned. Prior release 86e82ff was pushed to main/v2 and verified in Production (deployment 7917894167); this new refinement is not yet pushed.

2026-11-19 event relevance refinement (supersedes the collapsed topic-regulation list described below): removed event-detail topic-based regulation recommendations and getRegulationsForEvent. The prior rule unioned zone keyword matches and sorted newest first, without evidence of direct applicability. Knowledge-zone policy aggregation and event-to-zone navigation remain. No replacement relation engine, new data schema or automatic legal-applicability inference added. Future direct citations require original rule evidence and an explicit relation explanation; see PRD 9.1, ARCHITECTURE 10.1 and EVENT_PROGRESS_TECHNICAL_PLAN.md. Product map synchronized. Validation: typecheck, 112 tests and production build passed (existing WeChat tracing warning remains); local headless browser checked src-i1nh0e and src-fu90e2: unrelated module absent, topic links retained, progress retained, 390px no overflow, no page errors; knowledge-zone map retained. Local preview restarted with final build. Not pushed to production.

2026-11-19 event-progress implementation: ESG quick-feed home code, layout, filters, card behavior, scoring and ordering remain unchanged. Event detail now reads explicit matter associations, displays collected stage/change/evidence/self-checks, and supports newest-three timelines with native expansion. Source reports, heat and topic-related regulations collapse by default. Topic zones link to the same latest eligible detail anchor through a shared snapshot/query. Two initial matters (UK HRDD commitment and EU sustainability-assurance consultation) each have ONE node based on existing published summaries; original legislative documents were not re-verified in this batch. No complete-history, automated progress detection or real-time legal-status claim. Optional data/publication/event-progress.json is editorially maintained, not auto-generated from story clusters. Public detail and metadata now enforce isFeedEligible. Validation: typecheck and 112 tests passed; production build passed outside the restricted environment (existing WeChat tracing warning remains). Local browser smoke verified source title retained, zone-to-detail anchor, 390px no overflow, no page errors, and low-quality detail 404. In-app browser could not connect; a local headless browser completed these checks. Local preview started through local:start; no production push in this batch. See EVENT_PROGRESS_TECHNICAL_PLAN.md; PRD, ARCHITECTURE and api-integration updated together.

## Current release

2026-11-19 lean-refactor research (no implementation): user prioritizes quick identification of important events plus ongoing industry/topic tracking, with transferable lessons for the user's own business; UI hierarchy and source quality/deduplication come first. docs/ESG_COMPASS_REFACTOR_REVIEW.md and data/research/refactor-reference-snapshot.json compare AIHOT, Miniflux, TrendRadar and RSSHub. Existing Compass architecture already borrows AIHOT patterns. Read-only audit identified channel-based source tiers, missing-date fallback to current time, oldest-story representative selection, lexical clustering and all-record client payload as candidates for focused improvement; no production impact count or error rate is claimed. Local snapshot: 1,998 records, 499 eligible, 426 collapsed stories, 26 eligible curated records with explicit reasons. Source and product code remain unchanged; future implementation should update PRD/architecture with acceptance checks.

- Publication data: 1871 contents
- Curated contents: 19
- Publicly visible contents: 567
- Latest publication timestamp: 2026-11-17T05:00:00.000Z
- Latest publication: 揭晓：俄罗斯、沙特阿拉伯和澳大利亚是有史以来最大的二氧化碳出口国
- Local site: http://localhost:3001
- Production site: https://esg-compass-ai.vercel.app

## Climate risk lab

2026-11-19 production release: after the user's explicit confirmation, commit 459ace58ae8d7b3395c75bb189534cc285447892 was fast-forward pushed to origin/main; origin/v2 points to the same release. GitHub deployment 7914979405 reports success for Production. The canonical https://esg-compass-ai.vercel.app/climate-lab returns HTTP 200, shows the new case-scope filter and 19 cases, includes NASA data, and no longer contains the old illustrative value-index bridge. The earlier approval block below is resolved. Research commit f33c551 remains local and was not included in this production release. Existing uncommitted content-ops/weekly/source-health changes were excluded.

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
