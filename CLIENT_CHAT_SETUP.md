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

## Security boundaries

- Never post JSON private keys, Base64 service credentials, MongoDB URIs or Resend API keys to GitHub or ChatGPT.
- Firebase Admin private key exposed in past chats was rotated/revoked. Keep the new file outside GitHub repositories.
- Never turn on Atlas `0.0.0.0/0` for convenience.
