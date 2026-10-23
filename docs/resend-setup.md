# LUM News email setup

LUM News uses the official **Resend API SDK**, not Nodemailer or SMTP.
Supabase remains the authentication provider and generates/validates password
reset links. The existing PostgreSQL database stores notification preferences,
delivery IDs, safe error codes, duplicate-send claims and verified webhook events.
API keys, passwords and password-reset links are never stored in these records.

## Required environment settings

Configure the following for the environment in which the app runs:

| Name | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Secret, server-only Resend sending key (already supplied). |
| `RESEND_FROM_EMAIL` | A sender on a domain you own and verify in Resend, e.g. `LUM News <news@your-domain.example>`. |
| `APP_URL` | The app's real HTTPS origin, without a path. Use the published origin for live email. |
| `SUPPORT_EMAIL` | A valid support/reply-to address you monitor. |
| `SUPABASE_SEND_EMAIL_HOOK_SECRET` | Secret generated when configuring Supabase's HTTP Send Email hook. |
| `RESEND_WEBHOOK_SECRET` | Secret from the Resend webhook details page. |

The existing `SUPABASE_URL` and `SUPABASE_ANON_KEY` remain unchanged. The existing
stable `SESSION_SECRET` signs unsubscribe links; alternatively set a separate
`EMAIL_UNSUBSCRIBE_SECRET` (at least 32 characters). Do not rotate this signing
secret casually: doing so invalidates links already sent.

`EMAIL_FROM` and all `SMTP_*` settings are **unused**. They may be removed from the
workspace's secrets/configuration after migration. Do not paste keys into chat,
source files or browser storage.

No sender domain or published origin has been invented or configured automatically.
In the current workspace there was no published app at implementation time.
The existing Gmail sender was rejected by Resend; a Gmail address cannot be
verified as a sending domain you own. Use a domain you control.

## Resend dashboard

1. Add your sending domain in **Domains**, add the supplied DNS records at your
   DNS provider, and wait until Resend reports that domain as verified.
2. Set `RESEND_FROM_EMAIL` to an address on that verified domain. Set
   `SUPPORT_EMAIL` independently as the monitored reply-to.
3. Create a webhook for:
   `APP_URL/api/email/webhooks/resend`
4. Subscribe to `email.delivered`, `email.bounced`, `email.complained`, and
   `email.failed`. Save its signing secret as `RESEND_WEBHOOK_SECRET`.
5. Restart the app after environment changes. In **Settings → AI summaries &
   Secrets → Resend email delivery**, administrators can inspect missing settings,
   recent safe error codes, attempts and 30-day delivery totals. “Configured”
   means required environment values exist, not that DNS or hook setup is verified.

## Supabase dashboard — required for password resets

Do not replace Supabase or create a second authentication system.

1. Under **Authentication → Providers → Email**, keep the email provider enabled
   but **turn off Confirm email**. LUM News welcomes users after registration;
   it does not send signup verification messages or require verification.
2. Under authentication URL configuration, use your actual `APP_URL` as Site URL.
   Add `APP_URL/reset-password` and `APP_URL/home` to allowed redirect URLs.
3. Under **Authentication → Hooks**, enable an **HTTP Send Email hook**:
   `APP_URL/api/email/hooks/supabase`
4. Copy the hook signing secret into `SUPABASE_SEND_EMAIL_HOOK_SECRET`. Supported
   form: `v1,whsec_…` as supplied by Supabase. Never log or publish it.
5. Keep custom SMTP disabled. With the Send Email hook enabled, Supabase calls
   this app, and the app uses Resend's API to deliver recovery, magic-link,
   invitation and email-change messages. Configure this hook in Supabase itself;
   setting an environment variable alone does not activate it.

The existing Forgot Password and Reset Password screens remain in use. A reset
request uses `supabase.auth.resetPasswordForEmail`; the verified hook delivers the
provider-generated link. The browser does not request a reset until required app
email configuration is present. The reset link returns to `/reset-password`;
Supabase validates it and the existing page calls `updateUser` to save a password.
The server never invents reset credentials or returns reset tokens in an API.
Signup hook requests are rejected with configuration guidance, not turned into
verification messages: disable Confirm email before going live.

## User notification preferences

**Settings → Preferences**:

- **Login notifications**: on by default, can be turned off. New accounts receive
  a welcome message. Subsequent distinct Supabase sign-in sessions produce login
  notices, not repeated notices for token refreshes/page reloads. Suspicious-login
  classification is not invented; the current provider callback supplies normal
  sign-in events.
- **News Digests** is the master opt-out for all non-essential news emails.
- Choose **daily** or **weekly**, matching the saved topics/regions.
- Optionally filter **publisher countries**. This identifies where the publisher
  is based; it does not falsely claim the article's subject occurred there.
- Breaking alerts and reading-history recommendations are separately opt-in.
  Breaking alerts only consider headlines explicitly labelled “breaking” in the
  last hour, with at most three candidates per check. Reading-history
  recommendations also obey the selected regions/countries.
- Every news email has an unsubscribe link and one-click unsubscribe headers.
  Opening a link shows a confirmation form; POST records the opt-out. Security
  emails are unaffected. A deliberate authenticated opt-in can reverse an
  unsubscribe, but cannot remove bounce/complaint suppression.

Schedules use UTC:

- Daily digests: 09:00 each day.
- Weekly digests: Monday 09:00.
- Optional reading-history recommendations: Monday 10:00.
- Optional breaking alerts: checked every ten minutes.

The app process must be running at the scheduled time; there is no separate
managed job service or missed-schedule catch-up worker in this integration.
Avoid running extra duplicate app instances unnecessarily; durable claims guard
against multiple workers sending the same logical message.

## Reliability and Free-plan protection

- Same logical event uses a stable SHA-256 idempotency key in the database and
  Resend. Welcome: per recipient; login: per verified session; news digest: per
  recipient/period; breaking: per recipient/article; auth links: per provider hash.
- Accepted messages are not sent again. An empty digest is not a successful send.
- At most three immediate attempts for rate limits, transient provider failures
  and network failures; bounded exponential backoff. Permanent failures are
  recorded explicitly. A later invocation can retry a failed configuration after
  it is fixed. There is no indefinite automatic retry queue.
- An uncertain attempt older than 23 hours requires manual investigation instead
  of risking duplicate delivery beyond Resend's idempotency retention.
- Per-process spacing is 600 ms. Atomic PostgreSQL claims and budget checks apply
  across app workers. Signed webhooks are replay-safe; bounce/complaint events
  suppress further non-essential news email.
- Conservative app budgets default to **90 claimed messages/day** and
  **2,900/month**, configurable with `EMAIL_DAILY_LIMIT` and `EMAIL_MONTHLY_LIMIT`.
  Counts include failed claims. These are application safeguards, not a promise
  about the current Resend plan, other applications' usage, inbox delivery or
  remaining account quota. Review your Resend account limits before raising them.
- Missing configuration fails explicitly. There is **no SMTP or alternate-provider
  fallback**, no automatic plan upgrade and no real send during automated tests.

## Tests

`npm run test:email` uses synthetic keys, a mocked database, mocked Resend delivery
and a mocked Supabase identity. It checks welcome/login lifecycle selection,
default/opt-out login notifications, HTML escaping and plain text, duplicate
suppression, retries using the same key, safe permanent failures, signed recovery
hooks, hook tampering, verified-user settings, unsubscribe, signed delivery events,
replay safety, bounce status and missing configuration.

The existing Supabase password-change UI is preserved. A real inbox delivery and
an end-to-end live password reset require the external configuration above and a
user-authorised test recipient; neither is performed automatically.
