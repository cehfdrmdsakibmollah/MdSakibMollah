# Client messaging, Google sign-in and Gmail alerts

## 1. Fix Google sign-in on the Vercel production domain

**As checked on 21 October 2026**, Firebase Authorized domains already includes `mdsakibmollah.vercel.app`. The original `auth/unauthorized-domain` blocker was addressed; completion of a real Google OAuth popup remains unverified.

1. Open [Firebase Authentication](https://console.firebase.google.com/project/mdsakibmollahportfolio/authentication).
2. Under **Sign-in method**, verify Google provider is **Enabled**. Choose support email if the console requests one.
3. Go to **Settings → Authorized domains → Add domain**.
4. Add **`mdsakibmollah.vercel.app`** (hostname only, no https://, no trailing /). Keep the Firebase default `mdsakibmollahportfolio.firebaseapp.com`.
5. Open `https://mdsakibmollah.vercel.app/dashboard` in an incognito window; click **Client sign-in → Continue with Google** and complete the account chooser.
6. For the owner inbox, sign in using the account matching `ADMIN_EMAILS` on Render, currently `ceh.fdr.mdsakibmollah@gmail.com`. Signing in with any other account correctly shows a **client** dashboard; admin is never granted because a visitor claims to be the owner.
7. Test with a *different* verified email account: open the blue assistant, type an explicit `test: ...` private message and confirm it shows **You · sent** and an assistant reply. Sign into the owner account in another browser profile and open Dashboard → Live chat inbox → reply. Confirm the client receives Sakib's reply on refresh.

Google OAuth **popups** require user interaction; they can't be used to silently sign a user in. No one should provide a Google password to this assistant.

## 2. Public assistant vs private conversation

- The **public FAQ** on `POST /api/v1/assistant/faq` answers a limited, curated set of verified portfolio facts. It never saves or forwards visitor queries, and explicitly says so.
- The **verified Firebase private chat** uses `POST /api/v1/conversations/start` and `POST /api/v1/conversations/:id/messages` to save messages to MongoDB before showing delivery status.
- The **owner-only inbox** at `/dashboard` requires a Firebase token that maps to the owner address in Render `ADMIN_EMAILS`.
- If `OPENAI_API_KEY` is absent, the signed-in bot uses knowledge-base answers and clearly acknowledges unknown questions; it does not pretend to possess universal knowledge.
- If you enable OpenAI AI answers later, do not put its secret in Vercel frontend or public GitHub; keep it on Render only. API use can incur charges.

## 3. Turn on automatic inquiry emails to Gmail

**Code path already exists** in `apps/api/src/notifications.ts`: sends HTTPS to Resend. `OWNER_NOTIFICATION_EMAIL` on Render is set to `ceh.fdr.mdsakibmollah@gmail.com`. However, email **is NOT actually delivered** until a verified transactional sender and Resend API key are configured.

1. Create/login to a Resend account: https://resend.com
2. Add a domain you own under **Domains**. Configure the DNS verification records (SPF/DKIM) at the domain registrar. Vercel's `vercel.app` hostname is not a sender domain you own. Do not send mail using someone else's domain.
3. Generate a Send permission API key on Resend.
4. In **Render** service `sakib-portfolio-api-free` → Environment, add:
   - `RESEND_API_KEY`: **private secret**, never post in chat.
   - `RESEND_FROM_EMAIL`: e.g. `Portfolio <notifications@your-verified-domain.example>`, using your *actually verified* sending domain.
   - `OWNER_NOTIFICATION_EMAIL`: `ceh.fdr.mdsakibmollah@gmail.com` (already set).
5. Redeploy Render. In authenticated Owner Dashboard, the email setup warning disappears when these keys are present. That only indicates configuration, not inbox delivery.
6. Submit one test Contact inquiry (with clear `TEST` prefix) and one private test message. Confirm receipt in Gmail and check Render logs/Resend dashboard if missing.

The free Render instance blocks direct SMTP connections on common mail ports. The existing **Resend HTTPS API** avoids SMTP port dependencies. Resend free tier has usage limits; consult current https://resend.com/pricing.

If a custom sender domain is unavailable, continue using the **Dashboard inbox and Contact page** for messages. Do not display false email-delivery claims.

## 4. Very quiet chat-open sound (replaces music)

Background music was removed at the owner's request. The site does **not** mount an AmbientMusic component, display a Music control, or serve `/audio/funk-power-intro.webm`.

Opening the floating assistant with a **user click** triggers a single, very soft Web Audio chime (sine wave, 170ms, peak gain 0.012). No autoplay on page load, no looping background sound, and no sound when closing chat. Unsupported or blocked browser audio silently falls back to normal chat.

Implementation: `apps/web/src/lib/chat-open-chime.ts` called from `apps/web/src/components/chat-widget.tsx`. GitHub Actions `Live production smoke` verifies behavior against the deployed main branch. On PRs, the smoke suite deliberately checks the *currently deployed* version to avoid confusing preview code with production.

## Live verification record — 21 October 2026

- GitHub main and current production were checked before this test. The Next.js frontend lives at `https://mdsakibmollah.vercel.app`, and the Render backend at `https://sakib-portfolio-api-free.onrender.com`.
- On 21 October, the GitHub Actions **Contact inquiry end-to-end** workflow posted a single clearly marked synthetic inquiry to `/api/backend/contact`; production returned **HTTP 201** and the expected MongoDB document reference. Its presence was checked in Atlas `sakib_portfolio.leads`, then the exact synthetic record was deleted (one deletion; real customer records were untouched). This verifies the public Contact form's backend persistence, not authenticated private messaging.
- The owner Gmail account and synthetic sender Gmail inbox did **not** show an automated transactional email for that inquiry when checked. The signed-in owner dashboard displayed **Email alerts need setup**. Do not claim website-to-Gmail delivery until verified Resend credentials, a verified sending domain, and a received test email exist.
- The authenticated **owner dashboard** was visible in a previously open connected browser session. That supports owner session/admin access, but does not identify whether the original sign-in came through Google OAuth vs email/password, and does not prove a client-to-owner reply round trip.
- Live public music was removed; a short, low-gain chat-opening chime passed headless Chromium verification. The background-music button is absent.
- The E2E workflow is **manual-only** after the initial test to avoid generating test leads on ordinary pushes or PRs. It writes one identifiable test record when explicitly run. Delete such records after inspection.

## Owner-only notification diagnostics

The owner dashboard includes **Send test notification to owner Gmail**. It is available only to a verified Firebase account matching `ADMIN_EMAILS`, and only when the backend reports a configured Resend sender. The button calls `POST /api/v1/admin/notifications/test` through the existing same-origin Next.js API proxy.

- The backend **never** accepts an email address from this endpoint: the recipient is the `OWNER_NOTIFICATION_EMAIL` already saved on Render.
- It allows at most **two requests per hour** per rate-limit client and uses a **12-second** timeout for the provider.
- `503 EMAIL_NOT_CONFIGURED`: set a valid Resend API key and **verified** sender domain in Render environment variables.
- `502 EMAIL_PROVIDER_FAILED`: provider rejected the send. Inspect Render logs and the Resend dashboard. Do not report success.
- `202 providerAccepted:true`: Resend accepted the request. **This does not prove delivery to Gmail.** Check owner Inbox and Spam and Resend delivery status. No recipient secrets/API keys are returned.
- A browser-side or API test without a Firebase owner token is **not** an end-to-end Google OAuth/login test, so the client → owner → client private-message round trip still requires a second legitimately signed-in client account.

## Transactional email reliability hardening (21 October 2026)

The Contact API, verified client private-message API, and owner reply API now **await Resend provider acceptance or its bounded timeout** before responding, instead of launching a fire-and-forget email task that could be terminated after a serverless response. This does not make a saved inquiry dependent on sending email: MongoDB data is stored first, and a configured provider failure is logged without leaking keys or customer content. A successful API `201` indicates database write success, **not that Gmail received an email**.

For improved privacy, client-message and owner-reply notification emails now contain only a private conversation reference and a link to the portfolio. Full private messages are visible **only after sign-in** to the authorized client chat or owner dashboard. The existing Resend transport escapes HTML, limits provider HTTP wait to 12 seconds and returns provider acceptance only.

No additional credentials are needed in GitHub. Production requires Render's configured `RESEND_API_KEY`, `RESEND_FROM_EMAIL` for an actually verified sender domain, and `OWNER_NOTIFICATION_EMAIL`. The remaining live test is: after new backend deployment, submit an authorized test client message, check owner inbox, and send an owner reply through the dashboard; confirm receipt with a distinct logged-in client. Never claim a live send occurred based on unit tests.

## Deployment revision checks (no credentials)

To prevent a successful GitHub build from being mistaken for a live deployment:

- Render `GET /api/v1/health` now includes a `revision` field derived only from `RENDER_GIT_COMMIT` if present and valid.
- Vercel `GET /api/release` returns the deployed `VERCEL_GIT_COMMIT_SHA`, its environment, and no secrets. Vercel project settings must have **Automatically expose System Environment Variables** enabled for the revision field; it can be `null` until configured.
- On pushes to `main`, GitHub Actions runs `scripts/check-deployed-revisions.mjs` after public smoke tests. It reports missing or older deployments as **warnings**, because a passing code build cannot force a production deployment. It never uses credentials or writes live data.
- If `/api/release` returns 404, the new frontend version still has not deployed. A Render backend with the correct revision does **not** mean Vercel has caught up.
- Release checks do not verify actual Google account sign-in, owner/client read receipts, or Resend email delivery.

## Mobile, accessibility, SEO and contact quality audit (21 October 2026)

Added read-only GitHub Actions `Production quality audit` to test the **currently live** Vercel site using Chromium at 375px, 768px and 1440px widths. It checks the Home, Contact, Projects and Insights routes for horizontal overflow, page headings, accessible button/input names, image alt attributes, and metadata. It verifies the mobile menu opens and Contact navigation works, and intentionally submits an **empty** Contact form to check required-field validation **without sending a request or writing to MongoDB**. Timing measurements (FCP) are indicative browser-lab observations, not field Core Web Vitals or Lighthouse scoring.

Source fixes: add an accessible `Skip to main content` keyboard link, include `/contact` in sitemap, and default the public metadata base to the actual Vercel production URL if no explicit `NEXT_PUBLIC_SITE_URL` was supplied. Existing valid per-page canonical links remain unchanged.

Tests audit the **deployed** site; source updates will not appear there until Vercel deploys the latest main. The audit warns separately for the missing skip link and sitemap Contact URL in an older live deployment; do not claim they are live solely from green GitHub CI. Google OAuth popup completion, Resend delivery and authenticated private-chat read receipts still require separate authorized end-to-end checks.

## Security boundaries

- Never post JSON private keys, Base64 service credentials, MongoDB URIs or Resend API keys to GitHub or ChatGPT.
- Firebase Admin private key exposed in past chats was rotated/revoked. Keep the new file outside GitHub repositories.
- Never turn on Atlas `0.0.0.0/0` for convenience.
