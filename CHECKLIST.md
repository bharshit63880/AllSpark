# CHECKLIST

## Audit Findings
- [x] Microservices layout intact: `app/api`, `app/ui`, `services/*`, `config/*`
- [x] Event-driven flow present via Kafka topics + Redis pub/sub websocket responses
- [x] `CHECKLIST.md` was missing at root (created)
- [x] README startup steps were outdated and referenced missing JSON files
- [x] Judge consumer startup race observed (`UNKNOWN_TOPIC_OR_PARTITION` / leader election)
- [x] OTP smoke pickup could read stale mail and wrong 6-digit values from template CSS
- [x] Contest seed path previously produced invalid contest problem links (`null` IDs)
- [x] Admin websocket responses were double-encoded in admin-service Redis publisher
- [x] C++ submission mismatch found: UI sends `language_id=52` while seed used only `54`

## Security & Stability
- [x] Main config keeps JWT secret as placeholder and MailHog-safe SMTP defaults
- [x] No hardcoded SMTP credentials in tracked config
- [x] Judge startup resilience patched with retry/backoff in startup + consumer boot
- [x] OTP smoke flow hardened with inbox cleanup + timestamp filtering + strict OTP extraction
- [x] Contest seed run path switched to deterministic `docker cp + mongosh` execution

## Core Flow Verification
- [x] Full user E2E: signup/login/forgot-password/reset/problems/run/submit/contest/leaderboard/support/special
- [x] Admin E2E: login/dashboard/support update/special-access update/problem+contest admin listing
- [x] DB persistence verified for support-ticket + special-access (create + admin update)
- [x] Async request-response validated (HTTP accepted + websocket requestId-correlated result)
- [x] Submission language lookup hardened (`52 <-> 54` alias) to prevent missing-testcase pending path
- [x] Contest UI unified into single workspace flow: next/previous + run per problem + final contest submit
- [x] Signup email verification OTP flow wired via existing auth/users/email services with Redis pending-signup state + post-verify JWT issuance

## Docs & Open Source Readiness
- [x] `README.md` rewritten with clean setup/start/seed/test/admin instructions
- [x] Single docker compose start command documented
- [x] Seed command documented (plus required Redis flush after reseed)
- [x] Deploy pre-check notes added (secret/SMTP/Judge0/port exposure)

## Final Verification Summary
- [x] `tmp-full-e2e-smoke.mjs`: PASS (25/25)
- [x] `tmp-full-e2e-smoke.mjs` with `E2E_LANGUAGE_ID=52` (C++): PASS (25/25)
- [x] `tmp-admin-smoke.mjs`: PASS (13/13)
- [x] `tmp-contest-live-complete.mjs`: PASS (live contest 4/4 accepted + leaderboard rank/stars/penalty/completion updated)
- [x] Docker stack: all services up (`docker compose -f compose.dev.yaml ps`)
- [x] Support ticket record: `69b995ea730d321e5f785a9e` persisted + admin updated
- [x] Special access record: `69b995eb1ab75ad2f2494e28` persisted + admin approved
- [x] Frontend build after contest workspace + leaderboard changes (`app/ui` -> `npm run build`)

## Support + Special Access Audit (2026-03-18)
- [x] Support ticket schema lacked `issue_type/contest_id/problem_id/verified_by/eligible_for_special_access`
- [x] Special access schema lacked strict `ticket_id/user_id/contest_id/access_type/starts_at/expires_at` contract
- [x] No strict ticket ownership/context check on special-access create
- [x] Contest register/start had no special-access enforcement post contest end
- [x] Contest submission create had no contest-window/special-access enforcement
- [x] SUPPORT role had overly broad admin-level privilege scope

## Support + Special Access Tasks
- [x] Upgrade support-ticket model + validation + status transitions (OPEN/IN_REVIEW/VERIFIED/RESOLVED/CLOSED)
- [x] Upgrade special-access model + lifecycle (PENDING/APPROVED/REJECTED/REVOKED/EXPIRED)
- [x] Enforce strict linking: ticket exists, same owner, verified+eligible, contest/problem scope match
- [x] Enforce runtime special-access in contest register/start after contest end
- [x] Enforce runtime special-access in contest submission create after contest/participant window end
- [x] Harden role boundaries: support-only routes separated from full admin routes
- [x] Align support/special frontend forms with new backend payload contracts
- [x] Add focused unit tests for ticket/special-access rule logic

## Support + Special Access Verification
- [x] `services/support-ticket` tests pass (`node --test src/v1/ticketRules.test.mjs`)
- [x] `services/special-access` tests pass (`node --test src/v1/accessRules.test.mjs`)
- [x] Syntax checks pass for modified backend files (`node --check ...`)
- [x] Frontend build pass (`app/ui` -> `npm run build`)
- [x] Full multi-service integration rerun on live stack (Kafka/Redis/Mongo/Judge0 contest flow)
- [x] Full role E2E (USER/SUPPORT/ADMIN) via running stack pass with support/admin approval flow

## Support + Special Access Final Notes
- [x] Event-driven architecture preserved (API -> permission -> service topics -> redis/ws response)
- [x] No direct service-to-service sync shortcut introduced for runtime enforcement
- [x] Legacy fields retained for backward compatibility where possible

## Support UX Merge + Live Proof (2026-03-23)
- [x] User-facing support page merged into single ticket workflow; special-access request now appears inline only when ticket is eligible
- [x] FAQ section now reads resolved ticket answers from live support-ticket service
- [x] Live smoke `tmp-support-special-faq-smoke.mjs`: PASS (19/19)
- [x] Platform-side ticket persisted: `69c11447e83dbe46a1612964` -> `RESOLVED` + `eligible_for_special_access=true`
- [x] Approved special access persisted: `69c11447fc405d1f3f5142c2` -> `APPROVED` + scoped to archived contest
- [x] User-side error ticket persisted: `69c11449e83dbe46a161296c` -> resolved without special access

## Contest Data + Leaderboard Fixes (2026-03-23)
- [x] Live contest seed had ambiguous/wrong hidden testcase expectations for `two-sum-return-indices`
- [x] Live contest seed had wrong hidden expected output for `number-of-islands-grid`
- [x] Redis problem cache served stale testcase snapshots after DB patch; cache invalidated
- [x] Leaderboard `solvedCount` was undercounted because it was derived from penalized score
- [x] Source seed file updated and live DB patched for corrected contest testcases

## Admin UI Polish (2026-03-23)
- [x] Control panel submissions split into separate contest/practice sections with verdict, mode, testcase, user, problem, contest, and timestamp details
- [x] Control panel users split into cleaner grouped sections with staff/active/banned summaries and per-user detail cards
- [x] Control panel contests/problems/support tickets/special access refreshed to match clean card-based style used in users/submissions
- [x] Frontend build re-verified after control panel submissions UI cleanup
- [x] User dashboard/profile refreshed with real account metadata, attempted problems, contest participation, support tickets, and special-access history
- [x] Email service startup hardened with retry/backoff so OTP email consumption recovers when Kafka is late
- [x] Admin dashboard now includes live support-ticket totals and status breakdown; control panel refreshes dashboard after support updates
- [x] Problem detail page now shows public sample testcases from existing problem payload instead of hiding them

## Signup Email Verification (2026-03-23)
- [x] Signup now prechecks duplicates before creating user and sends email OTP before activation
- [x] Pending signup payload + signup OTP stored in Redis with expiry, attempts, and resend cooldown
- [x] New API routes added for resend-signup-otp and verify-signup-otp
- [x] Frontend signup now routes to dedicated email verification page and auto-signs-in only after OTP verification
- [x] Login now blocks non-active accounts with clearer activation/banned messages
- [x] Syntax checks passed for auth/users/api/permissions files and frontend build passed
- [ ] Real inbox delivery still depends on valid SMTP auth and live stack restart

## Frontend Cleanup For Deploy (2026-03-24)
- [x] Frontend source tree audited for safe unused files before Vercel deploy
- [x] Removed Vite starter leftovers and unreferenced frontend assets/components only
- [x] Removed old favicon `public/vite.svg` after switching to AllSpark favicon
- [x] Removed empty frontend folders left after cleanup
- [x] Frontend build re-verified after cleanup (`app/ui` -> `npm run build`)
- [ ] Full microservice backend is not Vercel-suitable as a single deployment target; Vercel is suitable for `app/ui` frontend only
