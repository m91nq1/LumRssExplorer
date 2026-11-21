# Gmail App Password email delivery

LUM News sends successful registration/login notifications, news digests and signed
Supabase auth-hook emails through Nodemailer and Gmail SMTP over TLS
(`smtp.gmail.com`, port 465). Resend is no longer used.
The existing database, Supabase authentication, email preferences, unsubscribes,
delivery history and application sending budgets are preserved.

Account-security notifications are always enabled, including for accounts with
legacy login notifications disabled. Each verified session receives one message;
page refreshes and duplicate synchronization do not send additional messages.
Registration's authenticated session receives a successful registration/login
message instead of a separate welcome message. Signup email verification remains
disabled as requested.

## Required settings

Store these server-side in Replit Secrets, never in frontend code:

| Setting | Purpose |
| --- | --- |
| `SMTP_USER` | Your full Google account email address. |
| `SMTP_PASS` | A Google **App Password**, NOT your normal Google password. |
| `APP_URL` | The HTTPS origin users open, without a path. |
| `SUPPORT_EMAIL` | Optional monitored reply-to address; defaults to `SMTP_USER`. |
| `SUPABASE_SEND_EMAIL_HOOK_SECRET` | Needed for Supabase password-reset emails through the existing signed hook. |
| `EMAIL_UNSUBSCRIBE_SECRET` | Optional separate signing secret; otherwise existing stable `SESSION_SECRET` (at least 32 characters). |

Sender is `LUM News <SMTP_USER>` to avoid unverified From aliases.
No custom domain or Resend domain verification is needed. Old `RESEND_*`,
`EMAIL_FROM`, `SMTP_HOST` and `SMTP_PORT` settings are unused.

## Create a Google App Password

1. Open your Google Account → Security and turn on **2-Step Verification**.
2. Open https://myaccount.google.com/apppasswords.
3. Create an App Password named LUM News.
4. Enter it only in the secure `SMTP_PASS` field. Spaces in Google's displayed
   password are removed by the server.

Google may not offer App Passwords on managed/restricted accounts or some
security configurations. Do not turn off two-step verification or enable
less-secure access. Consult your account administrator if necessary.

## Supabase password resets

Supabase still creates and verifies secure reset tokens. To have LUM News deliver
those messages using Gmail:

1. Keep the email provider enabled and **Confirm email off** (no signup verification).
2. Keep **custom SMTP off** when using this hook.
3. Enable the **Send Email HTTP hook** pointing to
   `APP_URL/api/email/hooks/supabase`.
4. Save its signing secret as `SUPABASE_SEND_EMAIL_HOOK_SECRET`.
5. Set Supabase Site URL to `APP_URL` and allow redirects to
   `APP_URL/reset-password` and `APP_URL/home`.

Secrets alone do not enable the hook. Without this external setup the app cannot
deliver Supabase password resets through Gmail. Do not configure both the hook
and a second independent SMTP delivery path.

## Limits and delivery status

- Gmail imposes sending/account limits and can restrict bulk or automated mail.
  Suitable for low-volume testing, not unrestricted mass-newsletter sending.
- Application budgets remain 90 claims/day and 2,900/month by default
  (`EMAIL_DAILY_LIMIT`, `EMAIL_MONTHLY_LIMIT`). These are not Gmail quota readings.
- SMTP acceptance is recorded as `sent`, not confirmed inbox delivery. Gmail
  provides no delivery/bounce webhook in this implementation; monitor the sender
  inbox for bounces. Historical suppressions are retained.
- Database claims prevent repeated logical sends. SMTP has no API idempotency:
  a connection failure after sending can leave delivery uncertain.
  Uncertain/crashed sends are marked `delivery_unknown` or left `pending` and
  blocked from automatic resend; manual investigation is required.
- Only explicit SMTP temporary refusals (4xx) are retried, at most three attempts.
  Auth/permanent failures are recorded safely; raw SMTP responses, addresses,
  passwords and reset links are never logged.
- Existing schedules remain daily 09:00 UTC, weekly Monday 09:00 UTC,
  opt-in recommendations Monday 10:00 UTC, opt-in breaking checks every 10 minutes.
- Admin Settings → AI summaries & Secrets shows Gmail configuration and records.

## Verification

`npm run test:email` mocks SMTP and database operations; it never sends real mail.
Use `npm run check` for TypeScript checks.
Do not email real recipients during testing without explicit authorization.
