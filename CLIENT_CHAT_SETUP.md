# Client messaging, Google sign-in and Gmail alerts

## 1. Fix Google sign-in on the Vercel production domain

The current screenshot shows **auth/unauthorized-domain**, not a bad Firebase password or Atlas connection.

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

## 4. Gentle optional intro music

An owner-uploaded 9-second fade-in/fade-out WebM audio intro is supplied separately in the artifact `MD-Sakib-Mollah-Music-Asset.zip`. It comes from the uploaded `funk power.mpeg` clip. Place **`funk-power-intro.webm`** inside `apps/web/public/audio/` in GitHub, then redeploy Vercel. The component `apps/web/src/components/ambient-music.tsx` enables the player only when the hosted asset exists.

Music **does not start on page load**; browsers normally block audible autoplay and visitors should not be surprised. The visitor can press Play, adjust only between 10% and 20%, pause, or leave the tab to pause automatically. No repeat loop.

## Security boundaries

- Never post JSON private keys, Base64 service credentials, MongoDB URIs or Resend API keys to GitHub or ChatGPT.
- Firebase Admin private key exposed in past chats was rotated/revoked. Keep the new file outside GitHub repositories.
- Never turn on Atlas `0.0.0.0/0` for convenience.
