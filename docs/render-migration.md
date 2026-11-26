# LUM News — Render migration and compatibility report

Audit date: 26 November 2026.

## Assessment

**The application builds and starts independently of Replit, and the reported npm registry blocker is fixed. It has NOT been deployed to Render by this audit.**

**Do not treat this as an unconditional production sign-off.** Remaining requirements are secure environment configuration, Supabase URL/hook configuration, a hosting decision for Gmail SMTP and uninterrupted schedules, and triage/remediation of the dependency findings below.

No database was replaced, reset, exported or migrated. No user data was deleted. No UI redesign, AI-provider replacement or email-provider replacement was performed. No real email or paid AI request was sent by the validation tests.

## A. Replit-specific dependencies discovered

- Six package tarballs used `package-firewall.replit.internal`: `@stablelib/base64@1.0.1`, `@types/nodemailer@8.0.2`, `fast-sha256@1.3.0`, `nodemailer@10.6.0`, `standardwebhooks@1.0.0`, `svix@1.99.1`.
- Replit's runtime-error Vite plugin was imported unconditionally, including during builds. The cartographer and development-banner plugins were already conditional.
- Server startup always discovered Replit's OIDC issuer using `REPL_ID`, despite the current browser login using Supabase.
- `.replit` supplied the development port and public Supabase browser configuration. Render does not read this file.
- `.replit` and the three public `@replit/vite-plugin-*` development dependencies are retained for optional Replit development compatibility. They are NOT required by the production bundle. No mandatory Replit network service remains in the tested Render startup path.
- Legacy `replitId` database fields and authentication code remain to preserve accounts and compatibility; retaining a field name does not create an infrastructure dependency.

## B. Problems identified

- Render could not resolve private npm tarball hosts.
- Unconditional legacy OIDC discovery prevented standalone startup.
- Logging serialized API response bodies and one admin debug statement included email information.
- Some administrative endpoints trusted caller-supplied Supabase IDs rather than verified tokens.
- Unexpected request errors were returned verbatim and then rethrown, potentially exposing details and terminating the process.
- Unknown production API routes fell through to the SPA HTML response.
- PostgreSQL session-store TTL was supplied in milliseconds where seconds are expected.
- RSS refresh opened connections for all enabled feeds simultaneously.
- Dependency scanners reported pre-existing vulnerabilities; see security findings.
- Render Free blocks Gmail SMTP and suspends idle instances, so it cannot preserve all current email/scheduling behavior.

## C. Changes implemented

- Added a project `.npmrc` using the official public npm registry, corrected six tarball URLs, and regenerated lockfile metadata using npm. Verified with a fresh-cache `npm ci`, not just a text substitution.
- Preserved every locked dependency version and integrity hash.
- Standardized the runtime on Node.js 22: `.node-version`, bounded `package.json` engine range, and the optional Replit development module now agree. Validation ran on Node.js 22.23.5.
- Made all Replit-only Vite plugins conditional on non-production Replit development.
- Made legacy Replit login optional. `ENABLE_REPLIT_AUTH=false` uses existing Supabase login without contacting Replit OIDC. Legacy `/api/login` redirects to `/login`; disabled callbacks return an explicit error.
- Preserved PostgreSQL session storage, fixed TTL units, and made a missing session secret fail explicitly.
- Retained `PORT` and `0.0.0.0` listening, and added port validation and `/healthz`.
- Added safe HTTP headers, bounded body sizes, compressed-body rejection, same-origin checks on browser writes and bounded in-memory throttles for authentication and AI endpoints.
- Removed API response-body logging and admin email debug logging. Handled request errors no longer crash the process or expose raw internal messages.
- Administrative feed/provider/topic requests now use the same verified administrator middleware as AI Secrets, and the frontend sends existing Supabase bearer credentials. Supplied IDs alone cannot grant access.
- Production serves built assets, deep-linked SPA pages, and JSON 404s for unknown API endpoints.
- Added `RUN_BACKGROUND_JOBS=false` for controlled validation or replicas that must not run schedules. Default behavior remains enabled.
- Bounded RSS fetching to eight concurrent feeds; preserved existing deduplication, topic tagging, database updates, refresh overlap guard and feed error handling.
- Added a Render Blueprint, environment-name example, migration report and production smoke script.

## D. Files modified or added

- Configuration: `.npmrc`, `.node-version`, `.env.example`, `.gitignore`, `.replitignore`, `.replit`, `package.json`, `package-lock.json`, `vite.config.ts`, `render.yaml`.
- Server: `server/app.ts`, `server/index-prod.ts`, `server/replitAuth.ts`, `server/routes.ts`, `server/articleStore.ts`, `server/requestGuards.ts`, `server/requestGuards.test.ts`, `server/services/digestService.ts`.
- Existing admin client: `client/src/hooks/useAdmin.ts`, `client/src/lib/queryClient.ts`, `client/src/pages/FeedManagement.tsx`.
- Validation and documentation: `scripts/render-smoke.mjs`, `docs/render-migration.md`, `replit.md`.
- Generated clean-install files and logs are under ignored `generated-artifacts/`; they are not deployment inputs.

## E. Dependencies removed, replaced or updated

- **No npm package version was changed.** Programmatic comparison of old/new lockfiles confirmed zero package-version changes.
- No authentication, database, AI or email provider was replaced.
- Node.js development runtime changed from 20 to 22 to match the supported Render runtime target.
- Optional Replit development packages remain installable from public npm and are not activated for production.
- Deprecated transitive `@esbuild-kit/esm-loader` and `@esbuild-kit/core-utils` warnings remain; neither blocked install/build.

## F. Executed validation results

| Check | Result |
| --- | --- |
| Clean public-registry install | PASS: `npm ci --prefix generated-artifacts/render-validation --registry=https://registry.npmjs.org/ --cache /tmp/lum-render-clean-npm-cache --no-audit --no-fund`; 557 packages installed from an empty cache |
| Installed dependency tree | PASS: `npm ls --prefix generated-artifacts/render-validation --depth=0` |
| Lockfile package versions | PASS: zero version changes |
| Registry audit | PASS: zero non-public tarball URLs remain |
| TypeScript | PASS: `npm run check` |
| Production build | PASS: `npm run build` |
| Real production bundle startup | PASS: `node scripts/render-smoke.mjs`, with `REPL_ID`/`REPLIT_*` removed, jobs disabled, custom port 5101 |
| SPA/assets | PASS: homepage, login deep link and built JavaScript asset returned 200 |
| Existing database access | PASS: production `/api/articles?page=1&pageSize=1` returned database-backed article data |
| Authentication protection | PASS: no-session current-user and forged-ID admin requests returned 401 |
| Legacy login disabled | PASS: `/api/login` redirected locally to `/login` without OIDC |
| Missing API route | PASS: JSON 404, not SPA HTML |
| Malformed JSON | PASS: 400 and process remained healthy |
| Email integration tests | PASS: existing mocked Gmail lifecycle/reset/preferences/retry/deduplication integration test |
| AI integration tests | PASS: five tests covering formatting, encrypted credentials, provider request parameters, safe failures and admin settings |
| Request guards | PASS: foreign-origin writes rejected, same-origin/server calls accepted, excess requests returned 429 with Retry-After |
| Live RSS reads | PASS: BBC Football 74 items and Guardian Art and Design 23 items parsed over HTTPS; no database writes |
| Security scans | Completed dependency, static-code and privacy scans; unresolved findings below |
| Real Render service | NOT TESTED: no Render deployment or account changes performed |
| Real login/registration/reset on Render | NOT TESTED: requires deployed origin and user interaction; no credentials supplied to a browser test |
| Real outbound email on Render | NOT TESTED; blocked by Free-instance SMTP restriction |
| Live paid AI/provider requests | NOT TESTED; existing tests mock network calls to avoid charges |

Build warnings remain for Browserslist data age, a PostCSS source option and a large JS chunk. They did not fail the build; the existing landing video is about 40 MB. These are performance/maintenance issues, not evidence of a successful Render deployment.

### Security findings

The dependency scanner reported **1 critical, 24 high, 33 moderate and 7 low advisory findings**. These are advisory counts, not distinct exploitable endpoints. Package versions were deliberately preserved; the counts remain unresolved.

Priority examples:

- Critical: `proxy-addr@2.0.7` IP-spoofing advisory. Exploitability depends on trust-proxy configuration; review and patch its Express dependency chain.
- High: `body-parser@1.20.3` compressed-body denial of service. Compressed request inflation is now disabled as a mitigation, but the dependency advisory remains.
- High: `drizzle-orm@0.39.1`, `ws@8.18.3`, `zod@3.24.2` and several build-tool/transitive packages. Review compatible fixed releases and regression-test; do not run an unreviewed `npm audit fix --force`.
- Some Vite/Zod fixes require major-version changes. No such broad upgrade was made during this compatibility work.

Static scan after changes: one medium MD5 finding in RSS article ID generation. MD5 here is a legacy deterministic database identity, not password or session protection. Changing it naively would duplicate existing news records; a coordinated ID-compatibility change is needed if replaced.

Privacy scan after changes: one low finding for a randomly generated guest username in browser local storage. It is not the Supabase session or an API key. The logged-admin-email finding was removed.

The review is a deployment-focused baseline, not a penetration test or assurance of absence of vulnerabilities. In-memory rate limits are per-process and reset on restart; use a shared limiter before multi-instance scaling. Raw logs in untouched upstream feed/provider exception paths still deserve a dedicated redaction review before adding credential-bearing feed URLs.

## G. Environment variables to configure in Render

Set values in Render's secure environment settings. Do not commit populated `.env` files. `.env.example` contains names only.

### Required for existing application features

| Name | Purpose / migration requirement |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | Render supplies this; app respects it. Do not hardcode 5000 on Render. |
| `DATABASE_URL` | The SAME existing database connection. Current application uses the Neon WebSocket PostgreSQL driver; a different arbitrary PostgreSQL host is not a drop-in replacement. No new Render database is required. |
| `SESSION_SECRET` | Copy the existing stable secret securely. Do not regenerate if it is also the AI-key encryption fallback or unsubscribe signing key. |
| `SUPABASE_URL` | Existing Supabase project URL, backend |
| `SUPABASE_ANON_KEY` | Existing Supabase public/anon key used by backend to verify access tokens; never substitute a service-role key |
| `VITE_SUPABASE_URL` | Existing public Supabase URL at BUILD time |
| `VITE_SUPABASE_ANON_KEY` | Existing browser-safe public/anon key at BUILD time; not a service-role key |
| `ADMIN_EMAILS` | Explicit comma-separated authorized administrator addresses; do not rely on historical defaults |
| `APP_URL` | Your actual HTTPS Render/custom-domain origin, no path or trailing slash |
| `ENABLE_REPLIT_AUTH` | `false` on Render to avoid Replit infrastructure |
| `RUN_BACKGROUND_JOBS` | `true` on the one instance responsible for schedules; `false` on non-scheduler replicas or smoke tests |

### AI, email and optional providers

| Name | When required |
| --- | --- |
| `OPENAI_API_KEY` | If summaries use the environment key instead of an encrypted admin-saved key |
| `AI_SECRET_ENCRYPTION_KEY` | If previously configured, copy the SAME value. Otherwise existing encrypted keys use the SAME `SESSION_SECRET`; adding a new encryption key without re-saving the stored API key prevents decryption. |
| `SMTP_USER` | Existing Gmail sending address |
| `SMTP_PASS` | Existing Google App Password, server only |
| `SUPPORT_EMAIL` | Optional reply/support address; defaults to sender |
| `SUPABASE_SEND_EMAIL_HOOK_SECRET` | Required for the existing signed password-reset email hook |
| `EMAIL_UNSUBSCRIBE_SECRET` | Optional separate signing secret; otherwise preserve the same `SESSION_SECRET` |
| `EMAIL_DAILY_LIMIT` | Optional, default 90 app-level email delivery claims/day |
| `EMAIL_MONTHLY_LIMIT` | Optional, default 2900/month; these are app budgets, not Gmail quota guarantees |
| `NEWSAPI_ORG_KEY`, `NEWSDATA_IO_KEY`, `MEDIASTACK_KEY` | When their existing configured news providers are enabled |
| Other configured provider key names | Database provider records use `apiKeyEnvVar`; copy any additional enabled provider's named secret. Do not copy secret values into the report. |

Existing stored workspace keys such as `CURRENTSAPI_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `RESEND_API_KEY`, `NEON_DATABASE_URL` and `SUPABASE_DATABASE_URL` are **not hardcoded requirements of the active code paths audited**. Only copy them if an actual enabled database-configured provider uses that exact name. The active summary integration is OpenAI and the active mail transport is Gmail, not Resend.

`REPL_ID`, `REPLIT_DOMAINS`, `REPLIT_DEV_DOMAIN`, `REPLIT_DB`, Replit filesystem paths and Replit build settings are not required on Render.

Environment presence audit found the current development `APP_URL` points to the development preview and the signed Supabase hook secret is absent. Do not reuse the development origin for production email links. No secret values are included here.

## H. External service settings and persistence

1. **Supabase Auth:** update Site URL to the actual deployed origin and allow the real login/reset redirect URLs, including `/reset-password`. Set both backend and frontend environment pairs to the SAME existing project.
2. **Password reset:** configure Supabase's signed Send Email Hook to `https://YOUR_ACTUAL_ORIGIN/api/email/hooks/supabase` and install its signing secret securely. Placeholder is illustrative, not a provisioned hostname. Keep the current no-signup-verification experience; do not enable email confirmation as part of this migration. Do not configure duplicate custom-SMTP and hook delivery.
3. **Google OAuth:** current Login/Signup/AuthContext source implements email/password, not a Google OAuth button or `signInWithOAuth` call. No Google login flow was added or claimed tested. If the existing Supabase project separately uses Google OAuth, preserve its Supabase callback in Google Cloud and update Supabase's application redirect allowlist. Inspect dashboard settings manually before changing them.
4. **Gmail:** preserve the configured account/App Password; it requires outbound TLS port 465. Render Free web instances block ports 25, 465 and 587. Continuing Gmail on Render therefore requires a user-approved SMTP-capable hosting plan/service, or a separately approved provider change. No paid resource was created and Gmail was NOT silently replaced with Resend.
5. **Database:** reconnect to the same existing Neon-compatible database, preserving schemas, users, articles, bookmarks, preferences and AI cache. Existing startup email setup uses additive `CREATE TABLE IF NOT EXISTS`/indexes. No destructive migration or `db:push` was run. The deployment role must be able to run those already-existing initialization statements.
6. **AI encrypted storage:** keys/settings and generated summaries remain in the existing database. Stable encryption/signing secrets must follow the app.
7. **Filesystem:** no runtime application upload/database/file-write persistence path was found. App assets are checked into the repository and copied by the build. Runtime logs and generated validation outputs are disposable. Future uploads must use an external durable object store rather than Render's ephemeral filesystem; no new paid store is needed for current behavior.
8. **Networking:** frontend/backend remain same-origin; no permissive CORS wildcard was added. The server trusts one reverse-proxy hop. Reassess trusted proxy handling if adding another CDN/proxy.

## I. Background processing and remaining manual work

- RSS uses HTTPS plus the existing parser and database; no Replit feed service is involved.
- RSS refresh runs every ten minutes while the process is alive; one process prevents overlap and database upserts/deduplication preserve identity. A daily topic snapshot and UTC notification schedules remain.
- A free Render instance sleeps on idle. RSS/digest/snapshot schedules do not execute while asleep and there is no durable catch-up queue. Free hosting is suitable only for limited testing, not the stated uninterrupted full-feature behavior.
- Run a single scheduling instance initially. Multiple enabled instances can duplicate feed API requests, consume provider quotas and race snapshots. Email delivery has durable duplicate claims, but that does not make every other scheduled job distributed-safe.
- Separate always-on workers or managed scheduled services are recommended only when continuity or scaling requires them. They may have costs; approve costs/design before provisioning. Do not create a second scheduler without shared ownership/locking.
- Existing provider daily-limit fields/delays are not a globally distributed quota enforcement system. Upstream 422/429 errors and broken RSS sources remain external configuration/source issues; two healthy feeds do not prove every feed works.
- Configure all environment names, redeploy after changing `VITE_*`, verify Supabase URLs/hook, decide Gmail/scheduling hosting, and resolve/accept security findings before calling this a production release.
- After an actual deployment, manually verify login, registration, welcome email receipt, reset email/link, admin access, article/AI summaries and a scheduled refresh. Do not send test messages or invoke paid APIs without authorization.

## J. Exact Render settings

- Service: Node web service, repository root as root directory.
- Build: `npm ci && npm run build`
- Start: `npm start`
- Node: `22.23.5` from `.node-version` (bounded engine range also provided).
- Health check: `/healthz` (process liveness; not a guarantee all external providers are healthy).
- Static files: generated `dist/public`; backend bundle `dist/index.js`.
- `render.yaml` provides a **Free testing blueprint**, not an all-features production hosting recommendation. It creates no database or paid resource. Configure optional feature secrets manually in addition to its required fields.
- No build/start command runs database migrations or resets data.
- Optional local smoke test after building: `node scripts/render-smoke.mjs`.

## K. Final readiness assessment

**Install/build/standalone startup: verified. Actual Render deployment: not performed. Full production release: conditional, not approved by this report.**

The immediate registry failure and mandatory Replit login dependency are resolved. Existing application features and providers remain. The user must still configure Render/Supabase secrets and real URLs, choose hosting compatible with Gmail and schedules, and address dependency security risks.

References checked: [Render Free service limitations](https://render.com/docs/free), [Node version selection](https://render.com/docs/node-version), [Web services and port binding](https://render.com/docs/web-services).
