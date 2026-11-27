# LUM News — Supabase connectivity on Render

Date: 27 November 2026.

## Status

**Latest retest after the secret update:** The supplied `SUPABASE_DATABASE_URL`
is now a Supabase **direct** endpoint on port 5432, not the shared Session
Pooler. DNS returned IPv6 only (no IPv4), and the read-only connection attempt
failed with `ENOTFOUND` before authentication. The updated password has therefore
not been validated. Replace this value with the exact **Session pooler** URL
from the same project's Connect dialog. The results below describe the earlier
saved pooler credentials, not the newly submitted direct URL.

**The driver/protocol defect has been corrected. An authenticated connection to
the existing Supabase database is NOT yet confirmed.** The saved Supabase
credentials are rejected with PostgreSQL error `28P01`, on both the saved
transaction-pooler port 6543 and a one-off session-pooler test on port 5432.
Both tests reached Supabase over IPv4 with certificate-verified TLS. No
Supabase data query could run after the authentication rejection.

The development database is a separate endpoint. Standard PostgreSQL queries,
the real Drizzle article query, application startup and the articles API all
passed there. This is not evidence that the Render/Supabase configuration works.

## Root cause

`server/db.ts` imported `Pool` from `@neondatabase/serverless`, configured `ws`,
and used `drizzle-orm/neon-serverless`. That client routes PostgreSQL traffic
through Neon's WebSocket proxy protocol. Given a Supabase hostname, it attempted
`wss://db.…supabase.co/v2` on port 443, as shown in the supplied logs.

Supabase's PostgreSQL endpoint is not a Neon WebSocket proxy. Separately, its
default direct endpoint is IPv6-only; the reported `ENETUNREACH` shows that
address was not reachable from the deployed runtime. Merely preferring IPv4 in
DNS cannot create an IPv4 record for an IPv6-only direct endpoint.

## Current and recommended driver

The application now uses **`pg` and `drizzle-orm/node-postgres`**, over PostgreSQL
TCP. This is the recommended driver for this persistent Express backend.
Drizzle's schema, tables, queries and stored data are unchanged.

One application-scoped pool is shared with `connect-pg-simple` for session
storage, so sessions do not create a second pool with different TLS settings.
The pool allows five connections per process, a 10-second connection timeout,
30-second idle timeout and TCP keepalive. Idle connection errors are handled
without logging credentials or terminating the process.

There is no fallback from `DATABASE_URL` to another database secret. Supabase
authentication, OpenAI summaries, Gmail delivery and the UI were not replaced.
No database was created, migrated, reset, dropped or copied.

## TLS

Production always uses `rejectUnauthorized: true`; URL SSL switches cannot
silently override it. Supabase hosts trust its published Root 2021 CA, downloaded
over authenticated HTTPS from its official download endpoint. The included
certificate was compared byte-for-byte with the official download.

CA SHA-256 fingerprint:

```
80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA
```

The CA expires on 26 April 2031. `DATABASE_SSL_CA` accepts a replacement trusted
PEM certificate, including PEM supplied with literal `\n` escapes, if the
provider rotates its CA. Other PostgreSQL hosts use system trust by default.
Never work around CA errors with `rejectUnauthorized: false` or
`NODE_TLS_REJECT_UNAUTHORIZED=0`.

The private development database explicitly uses `sslmode=disable` and does not
support production-verified TLS. That explicit mode remains usable outside
production, but is rejected in production. Do not copy this development URL
into Render.

## Required Render configuration

1. Open the **existing** Supabase project and click **Connect**.
2. Select **Session pooler**, not Direct connection or Transaction pooler.
3. Copy the complete PostgreSQL URL displayed there. Use its exact host and
   username. Do not derive the pooler hostname from the project region.
4. Replace the password placeholder with the actual **database password**, not
   an anon key, service-role key, OpenAI key or Supabase account password.
   Percent-encode reserved characters in the password.
5. In the Render service's **Environment** settings, save that URL as the
   server-only **`DATABASE_URL`**. Do not put it in a `VITE_*` variable, source
   code, screenshots or chat. Do not include `sslmode=disable`.
6. Session mode normally uses port **5432** and a username shaped like
   `postgres.[PROJECT-REF]`. Copy the actual values from Connect.
7. Keep `NODE_ENV=production`, `ENABLE_REPLIT_AUTH=false` and the existing
   `SESSION_SECRET`. Preserve the existing Supabase browser/backend settings,
   AI encryption/signing secrets and other service settings from the migration
   guide. This database fix does not replace any of them.
8. Redeploy the corrected code and configuration. The Render build/start
   commands remain `npm ci && npm run build` and `npm start`.
9. Run `npm run db:check` in the Render shell, if available. Require a PASS
   for the read-only query, active TLS and existing articles-table query.
   Then check `/healthz`, the articles API, login and saved items.
   `/healthz` alone is process liveness, not database readiness.

`DATABASE_SSL_CA` is optional because the Supabase public CA is included. Use it
only with a trusted replacement CA if the project's current certificate chain
requires one. No new paid database or IPv4 add-on is required to use the shared
Session Pooler.

If the current database password is unknown, a password reset in Supabase
requires care: it can break other applications still using the old password.
Update all affected consumers; do not reset it just to troubleshoot DNS.

## Files modified or added

- `server/db.ts`: standard PostgreSQL pool and Drizzle adapter.
- `server/databaseConfig.ts`: shared configuration, strict TLS and bounded pool.
- `server/supabaseCertificate.ts`: published public CA, not a secret.
- `server/replitAuth.ts`: reuse that pool for the existing session store.
- `drizzle.config.ts`: use the same URL/TLS configuration for explicit CLI use.
- `server/databaseConfig.test.ts`: five configuration/TLS regression tests.
- `scripts/check-database.ts`: safe read-only connectivity and ORM diagnostic.
- `package.json`, `package-lock.json`: driver dependencies and test commands.
- `.env.example`, `render.yaml`: document the Session Pooler and optional CA.
- `replit.md`, `docs/render-migration.md`: correct the earlier driver guidance.
- This report.

`server/database.ts` does not exist in this project. The shared schema remains
in `shared/schema.ts` and was inspected but not modified.

## Dependencies

- Added direct `pg@8.23.1` and `@types/pg@8.23.1` dependencies, with their required
  PostgreSQL support packages. These were previously only transitive packages.
- Removed the direct `@neondatabase/serverless` dependency and all application
  imports of it. It remains installed as an optional Drizzle peer dependency;
  its presence in the lockfile does not mean application queries use it.
- Kept `ws` because removing unrelated dependencies is outside this fix.
- The package installation reintroduced internal registry tarball URLs.
  Corrected those lockfile URLs back to the public npm registry and verified
  zero non-public resolved tarballs, then ran a fresh-cache clean install.
- No unrelated framework upgrade or forced vulnerability fix was performed.
  Existing dependency security findings still need separate review.

## Validation results

| Check | Result |
| --- | --- |
| npm install via package manager | PASS |
| Fresh-cache `npm ci`, isolated directory, public registry | PASS: 558 packages |
| `npm run check` | PASS |
| `npm run build` | PASS; existing bundle/Browserslist/PostCSS warnings remain |
| `npm run test:database` | PASS: five tests |
| `npm run test:ai` | PASS: five mocked tests |
| `npm run test:email` | PASS: mocked email integration |
| Published Supabase CA comparison | PASS: exact match |
| Development `SELECT 1` and Drizzle article query | PASS, explicit read-only transaction |
| Development server restart | PASS |
| Development `/healthz` and articles API | PASS |
| Public homepage screenshot | PASS; signed-in UI not visually verified |
| Saved Supabase URL, transaction port 6543 | IPv4/TLS reached; authentication FAILED (`28P01`) |
| Same saved pooler host, session port 5432 | IPv4/TLS reached; authentication FAILED (`28P01`) |
| Authenticated Supabase query | BLOCKED by rejected credentials |
| Actual Render startup after deployment | NOT TESTED; no Render account access/configuration changes |

Connection tests did not print URLs, credentials or raw provider errors. Their
data queries run inside `BEGIN READ ONLY` and roll back. Normal existing
background ingestion resumed when the development workflow restarted; it was
not a schema/data migration. Existing upstream feed failures and API quotas
remain separate from this database connection change.

The runtime database path now requires standard PostgreSQL networking, not
Neon's WebSocket proxy or Replit database infrastructure. Supabase login still
requires its existing configuration. Optional legacy Replit login must remain
disabled on Render. Full production behavior cannot be signed off until the
correct Supabase credentials are supplied and the real Render deployment passes.

## References

- https://supabase.com/docs/guides/database/connecting-to-postgres
- https://supabase.com/docs/guides/platform/ssl-enforcement
- https://node-postgres.com/features/ssl
- https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt
