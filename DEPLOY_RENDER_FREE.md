# Free portfolio backend: Render + Atlas allowlist

**Frontend stays on Vercel Hobby:** https://mdsakibmollah.vercel.app  
**Backend moves to Render Free:** service defined in the repository root `render.yaml`.  
**Database stays on MongoDB Atlas Free:** existing `Portfolio` cluster, `sakib_portfolio` database.

This is a zero-monthly-compute-cost **portfolio/demo** architecture, not a highly available production setup. Render's free Node web services may spin down after 15 idle minutes, take ~1 minute to wake, and are subject to 750 shared hours/month and bandwidth/build limits. Don't use keep-alive cron jobs to evade Free idle policies. Consult https://render.com/docs/free.

## 1. Provision from GitHub

1. Open https://dashboard.render.com/ and log in/connect the GitHub account `cehfdrmdsakibmollah`.
2. Choose **New → Blueprint**, select `cehfdrmdsakibmollah/MdSakibMollah`, main branch, root `render.yaml`.
3. Review the service: `sakib-portfolio-api-free`, **Free**, **Singapore**, Node 22, Build: `npm ci && npm run build -w apps/api`, Start: `npm run start -w apps/api`.
4. Enter the two private values prompted by Render (**never commit or share them**):
   - `MONGODB_URI`: MongoDB Atlas SRV URI for **`sakib_portfolio`**, using a fresh dedicated application database user with **readWrite only for `sakib_portfolio`**. Keep password URL-encoded where needed; do not use the existing `atlasAdmin` user in the deployed application.
   - `FIREBASE_SERVICE_ACCOUNT_JSON_B64`: Base64 string of **new, not previously shared** Firebase Admin service-account JSON. Revoke the old key exposed in chat; never commit its JSON/B64.
5. Confirm public settings `WEB_ORIGIN=https://mdsakibmollah.vercel.app`, `ADMIN_EMAILS`, and `FIREBASE_PROJECT_ID`; then deploy.

**Important:** In Render, build and service startup can complete before DB network access is granted. `/api/v1/health` will return HTTP 503 until Atlas accepts Render's outbound IP ranges. This is deliberate and does not mean Render itself is broken.

## 2. Atlas: allowlist Render's shared outbound ranges (NOT everyone)

1. In Render Dashboard, open the new **service** (not workspace).
2. Upper-right **Connect → Outbound**; copy *every* CIDR range shown for this specific service in the **Singapore** region. Render documents these as shared region outbound IP ranges (not dedicated/exclusive static IPs): https://render.com/docs/outbound-ip-addresses.
3. In https://cloud.mongodb.com/ → project **Project 0** → **Network Access → IP Access List**, add exactly those IPv4 CIDR ranges with comment `Render Free Singapore — portfolio API`.
4. Preserve your local IP entries only if you still need them. Do **not** add `0.0.0.0/0` as a permanent workaround. Shared Render ranges still include other tenants; Atlas database credentials and least-privilege roles remain essential. If ranges are unusually broad or unacceptable for your security requirements, free/shared infrastructure cannot meet a dedicated-egress requirement; reconsider hosting before opening Atlas.
5. Test `https://<your-service>.onrender.com/api/v1/health`. Expected JSON:
   `{"status":"ok","service":"sakib-portfolio-api","database":"connected"}`.
   If HTTP 503 persists, use Render **Logs** to find `[API] MongoDB connection failed {kind:...}` (category only). `NETWORK` often indicates allowlist; `AUTH` indicates username/password; `DNS` DNS resolution. Keep passwords and URI out of screenshots.

The Atlas connector in ChatGPT can inspect and add supplied, exact CIDR ranges after a Render service is created and the user has reviewed the ranges. Do not invent an egress IP or add `0.0.0.0/0`.

## 3. Point Vercel frontend at Render

Once Render backend returns HTTP 200 (not before):

1. Vercel dashboard → project **`mdsakibmollah`** (frontend) → Settings → Environment Variables:
   - Update **`API_INTERNAL_URL`** (Production) to **`https://<your-service>.onrender.com/api/v1`**.
   - Confirm **`NEXT_PUBLIC_SITE_URL=https://mdsakibmollah.vercel.app`**.
   - **Delete** from *frontend* `MONGODB_URI` and `FIREBASE_SERVICE_ACCOUNT_JSON_B64`. These are server secrets and **must exist on Render only**, not on the Vercel frontend project. Note deleting these from the frontend does not affect existing Render secrets.
2. Redeploy **frontend** (needed for updated environment variables).
3. After successful end-to-end testing, retire the old Vercel **`md-sakib-mollah`** backend project and its MongoDB/Firebase secrets to reduce attack surface; do **not** remove the frontend project.
4. Firebase Console → Authentication → Settings → Authorized Domains → add **`mdsakibmollah.vercel.app`**, then test Google login.

The Next.js proxy uses a longer timeout to tolerate Free cold starts. It cannot guarantee instant chat after Render idles; first user requests may wait ~60 seconds. Messages are **only confirmed delivered** after the API receives and stores them.

## 4. Test full stack

- Direct Render `/api/v1/health`: status `ok` and database `connected`.
- Frontend `/api/backend/health`: same healthy JSON.
- Frontend `/api/backend-health`: `{"online":true}`.
- Sign in as a test non-admin client. Dashboard should show the client view; send a chat message. Reopen page to ensure MongoDB persisted it.
- Sign in as owner and check Dashboard → Inbox. Reply. Verify client sees response on refresh.
- Check contact form saves an inquiry. Optional AI requires an additional paid API key; offline FAQ does not.
- Check MongoDB Atlas Access List and account roles after setup. Rotate/revoke credentials previously exposed in chat and remove any unused newly created DB accounts.

## Troubleshooting & limits

- **App starts, /health 503**: add all Render outbound CIDR blocks in Atlas; inspect Render safe error category; verify connection URI target DB and user role.
- **404/502**: confirm render.yaml was deployed as a **Web Service**, not static site. App listens on the injected PORT at 0.0.0.0.
- **Frontend 503**: check `API_INTERNAL_URL`, ensure HTTPS and a healthy Render service, then redeploy frontend.
- **First message times out**: Free spin-up can take about one minute, combined with MongoDB connection; retry after wake. No fake success indicator.
- **Render Free quotas**: idle sleep 15 minutes, 750 free service hours/month, and service-initiated outbound traffic limits, per Render docs; not suitable for high traffic or always-on client support.
- **No SMTP** on 25/465/587 outbound from Render Free; use the existing HTTPS Resend API for optional notifications.
- **Security**: avoid globally allowlisting Atlas and avoid `atlasAdmin` for app runtime; scoped `readWrite` user, TLS SRV URI, minimal CIDR ranges, rotated credentials, no public private keys.

References:
- https://render.com/docs/free
- https://render.com/docs/outbound-ip-addresses
- https://render.com/docs/blueprint-spec
- https://render.com/docs/environment-variables
- https://www.mongodb.com/docs/atlas/security/ip-access-list/
- https://vercel.com/docs/functions/configuring-functions/duration
