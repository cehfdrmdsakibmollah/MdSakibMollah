# Vercel production deployment — MD Sakib Mollah

This monorepo is deployed as **two separate Vercel projects** linked to the same GitHub repository. Neither deployment requires exposing Firebase Admin or Atlas credentials in Git.

## Before you deploy

1. Rotate every MongoDB password and Firebase service-account private key previously shared or exposed. Configure only new values in Vercel's encrypted environment variables.
2. Review and merge the tested GitHub Pull Request after its CI is green.
3. In Vercel connect both projects to `cehfdrmdsakibmollah/MdSakibMollah`, Production Branch `main`.

### Project 1 — Backend API

- Name: `md-sakib-mollah-api`
- Root directory: `apps/api`
- Framework preset: **Express** (auto-detected from `src/server.ts`)
- Node: **22.x** (or supported patched LTS)
- Install command: default / npm workspace auto-detection
- Build command: use framework defaults; do not run `npm run dev`
- Atlas region: Mumbai; deploy functions nearby if project configuration allows.

Configure encrypted environment variables:

| Name | Value |
|---|---|
| `MONGODB_URI` | Your newly rotated MongoDB Atlas connection string (database name included) |
| `ADMIN_EMAILS` | `ceh.fdr.mdsakibmollah@gmail.com` |
| `FIREBASE_PROJECT_ID` | `mdsakibmollahportfolio` |
| `FIREBASE_SERVICE_ACCOUNT_JSON_B64` | Base64 of the **new** Firebase Admin JSON, configured only in Vercel Secrets |
| `WEB_ORIGIN` | Actual HTTPS frontend domain; may list comma-separated origins |
| `NODE_ENV` | `production` |
| `OPENAI_API_KEY` | Optional, secret; enables AI replies |
| `RESEND_API_KEY` | Optional, secret; enables notification emails |
| `RESEND_FROM_EMAIL` | Optional, from verified email domain |
| `OWNER_NOTIFICATION_EMAIL` | Owner's chosen receiving email |

**Do not set** `GOOGLE_APPLICATION_CREDENTIALS` to your Windows path in Vercel. Vercel cannot read `C:\\Users\\...` paths. Use the service account as a secret environment value.

Verify `https://<API_DOMAIN>/api/v1/health`: should return JSON with `status:ok`, `service:sakib-portfolio-api`, `database:connected`. If database is unavailable, the health route responds 503.

The API uses Socket.IO for optional realtime hints. Chat/dashboard **also poll through HTTP**, so cross-instance realtime state is not required for essential messages. Vercel WebSocket support is available, but for durable cross-instance events use a shared broker rather than assuming an in-memory Socket.IO room is global.

### Project 2 — Frontend

- Name: `md-sakib-mollah-portfolio`
- Root directory: `apps/web`
- Framework preset: **Next.js**
- Node: **22.x**.
- Connect GitHub repository and use default build settings.

Configure:

| Name | Value |
|---|---|
| `API_INTERNAL_URL` | `https://<API_DOMAIN>/api/v1` (mandatory; no production localhost fallback) |
| `NEXT_PUBLIC_SITE_URL` | Actual live HTTPS frontend URL (SEO canonical, sitemap) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase browser apiKey (public client setting) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `mdsakibmollahportfolio.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `mdsakibmollahportfolio` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `mdsakibmollahportfolio.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `230140501094` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:230140501094:web:2fd471c65cc2849286a1a7` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Optional public GA measurement ID |

Firebase client API keys are public identifiers, not Admin credentials. Secure backend requests verify Firebase ID tokens.

### Firebase domain setup

Go to Firebase Console → Authentication → Settings → Authorized Domains.
Add the **exact deployed frontend hostname** without `https://`. For preview URLs requiring Google login, add only those test hostnames you trust or test on production/custom domain instead.

### Secure release and smoke test

1. API `/api/v1/health` returns HTTP 200 with database connected.
2. Web `/api/backend/health` returns HTTP 200.
3. Test Google sign-in using a non-admin client first, then the configured admin account.
4. Admin `/dashboard` loads the owner inbox; non-admin cannot access admin API endpoints.
5. A verified client sends chat; client sees a bot response and owner sees stored conversation.
6. Owner replies; client reads it. Contact inquiry creates lead.
7. Test responsive menu and light/dark mode, feedback, links, certificate, map.
8. Verify `/robots.txt`, `/sitemap.xml`, social previews, canonical URL. Submit sitemap to Google Search Console.
9. Monitor Vercel build and runtime logs. Never paste tokens, database URLs, or private keys into GitHub Issues or screenshots.

### What to do if requests fail

- **503 `BACKEND_URL_MISSING`**: frontend Vercel project's `API_INTERNAL_URL` is missing or not HTTPS.
- **503 `AUTH_SERVICE_UNAVAILABLE`**: backend Firebase service account environment/permissions need checking.
- **401 `AUTH_TOKEN_INVALID`**: sign out and log in again; verify the Firebase project matches web and backend.
- **403 `ADMIN_REQUIRED`**: signed-in email does not match the admin allowlist.
- **503 Database**: verify MongoDB IP access rules, connection string and region/network access; no blanket public allowlist without a deliberate risk decision.

### Current deployment limitations

GitHub Actions typecheck/build checks are not a substitute for a live database/Firebase integration test. Vercel setup requires an authorized Vercel scope; linking the GitHub account by itself does not grant a missing Vercel team grant.

**Sources:** https://vercel.com/docs/frameworks/backend/express, https://vercel.com/docs/monorepos and https://vercel.com/changelog/websocket-support-is-now-in-public-beta.
