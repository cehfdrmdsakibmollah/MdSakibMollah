# MD Sakib Mollah — Modern Developer Portfolio

A premium **Next.js + Express + MongoDB + Firebase** developer portfolio with a cinematic hero, real GitHub work, animated UI, SEO pages, private verified chat, automated assistance, inquiry CRM and an owner dashboard.

> **Important:** This is real application source code, not a static HTML mockup. Publishing it to GitHub does **not** deploy the application. The web, API, database and Firebase Auth must be configured separately. Optional AI and email features require their own credentials. SEO is implemented, but **Google search ranking is never guaranteed**.

## What's included

- Responsive desktop/tablet/mobile UI, dark/light theme, Framer Motion transitions, reduced-motion support.
- Original photos supplied by the portfolio owner; social OG banner, interactive project filters, services, developer insights.
- Actual public GitHub project links; no invented testimonials, commercial projects or years of experience.
- Next.js App Router pages, per-page metadata, dynamic routes, structured data (Person/CreativeWork/BlogPosting), `sitemap.xml`, `robots.txt`, OG/Twitter images.
- Firebase Authentication: Google sign-in, email/password registration, email verification, forgot/reset password.
- Express 5 + TypeScript REST API, Mongoose models with validation/indexes, Zod input checks, Firebase Admin token validation, role-based admin check.
- Authenticated client messaging (MongoDB), immediate automated reply (OpenAI API if configured; helpful rule-based fallback otherwise), real-time Socket.IO updates.
- Admin dashboard to see inquiries, manage their status, browse private chats, and send personal replies.
- Verified client feedback: private 1–5-star rating and optional comment stored with the conversation; owner-only feedback panel and count.
- Rate limiting, CORS restriction, Helmet, max body sizes, owner/admin authorization, notification email via optional Resend integration.

## Folder architecture

```text
MdSakibMollah-Portfolio/
├── apps/
│   ├── web/                         Next.js 15.5.28+ (October 2026 security-patched), React 19.2.6+, Tailwind, Firebase browser SDK
│   │   ├── public/
│   │   │   ├── images/               Owner-supplied portrait/workspace photos
│   │   │   ├── og-image.jpg
│   │   │   └── icon.svg
│   │   ├── src/
│   │   │   ├── app/                  SEO routes, portfolio, insights, private dashboard
│   │   │   ├── components/           Hero, Auth, Contact, Chat, Projects, Reveal, Navbar
│   │   │   └── lib/                  GitHub project data, Firebase auth, API client
│   │   └── .env.example
│   └── api/                         Express REST API + Socket.IO
│       ├── src/
│       │   ├── assistant.ts          LLM response + rule fallback
│       │   ├── auth.ts               Firebase Admin ID-token verification
│       │   ├── config.ts             Server-side environment validation
│       │   ├── models.ts             Mongoose leads, conversations, messages
│       │   ├── notifications.ts      Optional Resend email notifications
│       │   ├── routes.ts             Contact, chat, admin endpoints
│       │   └── server.ts             Express + WebSockets + middleware
│       └── .env.example
├── docker-compose.yml               Local MongoDB
└── .github/workflows/ci.yml         Lint-free typecheck/build validation
```

## Configure Atlas + Firebase without exposing credentials

If you have an Atlas export (`atlas-credentials.env`) and Firebase service-account JSON, use the secure local setup tool:
`setup-private-config.ps1` on Windows or `setup-private-config.py` on Mac/Linux.
**Read `SETUP_MONGODB_FIREBASE.md` first. Rotate any credentials previously shared in a chat.**
Neither secret file is included in the ZIP or should be checked into GitHub.

## Quick start (Node.js 22 recommended)

1. Extract ZIP and open a terminal in the extracted **`MdSakibMollah-Portfolio`** folder.
2. Install [Node.js](https://nodejs.org/) and [Docker](https://www.docker.com/) (or use MongoDB Atlas).
3. Set up env files:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

**Windows PowerShell**:

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
Copy-Item apps/api/.env.example apps/api/.env
```

4. **Set up Firebase (required for private messaging):**
   - Open [Firebase Console](https://console.firebase.google.com/) → project **mdsakibmollahportfolio**.
   - Authentication → Sign-in method: enable **Google** and **Email/Password**.
   - Authentication → Settings → Authorized domains: add `localhost`, your Vercel hostname, and your actual custom domain as appropriate.
   - Firebase project settings → Service accounts → Generate a NEW private key **locally**. Base64-encode the JSON and set `FIREBASE_SERVICE_ACCOUNT_JSON_B64` in `apps/api/.env` or use Google Application Default Credentials. **Never commit it.**
   - `ADMIN_EMAILS` defaults to `ceh.fdr.mdsakibmollah@gmail.com` (change it if your intended owner login differs) (verified Google sign-in recommended).
5. **Set up MongoDB (required):** start `docker compose up -d`, or update `MONGODB_URI` in the API env with an Atlas connection URI.
6. **Run the application:**

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. API health: `http://localhost:4000/api/v1/health`.

**First check:** Sign in with your owner Google account; the configured `ADMIN_EMAILS` can access `/dashboard`. Ordinary visitors can sign in and message the owner from the blue floating chat button. The contact form is public and stores leads in MongoDB.

## Optional features

**AI replies:** add `OPENAI_API_KEY` to `apps/api/.env`; set `OPENAI_MODEL` if desired. Without a key, the bot remains functional using transparent rule-based replies. AI requests execute **only on the backend**. Never add this key to `NEXT_PUBLIC_*` env vars.

**Email alerts:** use [Resend](https://resend.com/) and a verified sending domain; set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `OWNER_NOTIFICATION_EMAIL` in the **API env**. If not configured, all chat/contact submissions are still saved in MongoDB and visible in the dashboard, but **email notifications are skipped**.

**Analytics:** Firebase Analytics uses the public measurement ID. A small opt-in banner is included; Firebase Analytics initializes only after a user chooses Allow analytics. Review regional requirements before launch.

## Deploy to production

### Backend: Render (Node Web Service)

- Repository: your GitHub repo, Root Directory: **repository root**.
- Build Command: `npm install && npm run build -w apps/api`.
- Start Command: `npm run start -w apps/api`.
- Add API env variables from `apps/api/.env.example` in Render environment settings.
- Use MongoDB Atlas instead of local Docker (production databases must be persistent).
- Set `WEB_ORIGIN=https://your-site.vercel.app` (comma-separate any legitimate additional origins).
- Set `NODE_ENV=production`. Confirm `https://YOUR-API.onrender.com/api/v1/health` returns `{"status":"ok"}`.
- Hosting free tiers may sleep; always test waking and Socket.IO connections on your chosen host.

### Frontend: Vercel (Next.js project)

- Import the same GitHub repository to Vercel.
- Root Directory: **`apps/web`** (Vercel detects the Next.js app). Monorepo workspaces are present.
- Framework: Next.js; use default build command (`next build`).
- Set `NEXT_PUBLIC_SITE_URL=https://your-real-domain.example` (the public HTTPS address), `NEXT_PUBLIC_API_URL=https://YOUR-API.onrender.com/api/v1` and the Firebase browser config in Vercel Environment Variables.
- Redeploy after changing `NEXT_PUBLIC_*` env vars; those are compiled into the browser bundle.
- Add the production domain to Firebase Authentication → Authorized domains.

### SEO launch checklist

1. Set the final canonical domain in `NEXT_PUBLIC_SITE_URL` and redeploy (do not leave `localhost`).
2. Ensure `https://your-domain/sitemap.xml` and `/robots.txt` load.
3. Verify ownership in [Google Search Console](https://search.google.com/search-console); submit the sitemap.
4. Add real project screenshots, real contact information, the Google link you supplied (verify its destination first), case studies and project outcomes when available.
5. Check page speed, accessibility and structured data; link your domain from GitHub and LinkedIn.
6. Google indexing and rankings are independent decisions made by search engines; metadata alone never guarantees placement.

## API endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/v1/health` | Public | API health check |
| POST | `/api/v1/contact` | Public, rate-limited | Create a project inquiry |
| GET | `/api/v1/me` | Verified Firebase user | Identity/admin status |
| POST | `/api/v1/conversations/start` | Verified Firebase user | Create/reuse private conversation |
| GET | `/api/v1/conversations/:id/messages` | Participant or owner | View saved private messages |
| POST | `/api/v1/conversations/:id/messages` | Participant | Send message and receive bot response |
| POST | `/api/v1/conversations/:id/feedback` | Verified participant | Submit/update private chat feedback |
| GET | `/api/v1/admin/feedback` | Admin only | Read private feedback |
| GET | `/api/v1/admin/overview` | Admin only | Inquiry/chat counts |
| GET | `/api/v1/admin/leads` | Admin only | Contact inquiries |
| PATCH | `/api/v1/admin/leads/:id` | Admin only | Update lead status |
| GET | `/api/v1/admin/conversations` | Admin only | List private chats |
| POST | `/api/v1/admin/conversations/:id/reply` | Admin only | Send human reply |

### Data model

- **Lead**: name, verified format email, company, service, budget, inquiry body, CRM status, timestamps. Indexed by status/email/date.
- **Conversation**: unique Firebase UID, participant email/name, open/closed status, last-message date.
- **Message**: conversation ObjectId, sender (client/assistant/owner), content, AI/rule/person attribution, timestamps.
- **Feedback**: one private rating per verified conversation, conversation/UID references, optional comment and timestamps (not shown publicly).

All privileged API endpoints verify Firebase ID tokens on the server. MongoDB is never directly accessible from the browser. The Firebase config supplied in the request is **public app configuration**, not a service-account secret. Firebase Admin private credentials remain exclusively on the API host.

## Publish the ZIP contents to your repository

The repo already has a tiny README. **Clone first** to preserve Git history; do not run a blind force push.

```bash
git clone https://github.com/cehfdrmdsakibmollah/MdSakibMollah.git
# Copy ALL extracted project contents into the cloned MdSakibMollah folder
cd MdSakibMollah
npm install
git add .
git commit -m "Build premium full-stack portfolio"
git push origin main
```

If you're on Windows, the included `publish-to-github.ps1` can clone and copy the project safely (it does not run unless you choose to execute it).

## Security and privacy notes

**Dependency security (20 October 2026):** The web package sets `next` to at least `15.5.28`, the October 14 security-patched Next.js 15 release. Use `npm audit` and keep dependencies current before deploying. `react` / `react-dom` use at least 19.2.6.


- **NEVER COMMIT** `apps/api/.env`, `apps/web/.env.local`, Firebase Admin service account JSON, MongoDB passwords, Resend keys, or OpenAI keys.
- Public visitors cannot view other clients' messages: server authorization checks UID on every request and Socket.IO join.
- Configure a consent banner/privacy policy for analytics and message processing before using the site commercially in jurisdictions that require them.
- Before real production client traffic, add automated integration/security tests, abuse monitoring, database backups, a data retention/deletion policy and professional hosting observability.
- No deployment, end-to-end user testing or OAuth credential provisioning was done as part of this generated source bundle. Configure and test them with your accounts after downloading.

## Built-in design references

The main hero and about images use the supplied owner photos; the `og-image.jpg` uses the previously generated cinematic banner, ideal for social previews. Replace imagery only with photos you have the right to use.

## Owner account for this copy

The configured owner email is **ceh.fdr.mdsakibmollah@gmail.com**. Both setup helpers default to it and populate `ADMIN_EMAILS` and `OWNER_NOTIFICATION_EMAIL` in the local private API `.env`. You must still enable Google sign-in in Firebase, authenticate with that email, and configure a trusted Firebase Admin credential on the backend. The email alone does not bypass authentication.


## October 2026: Same-origin chat / VS Code Remote Tunnel

- Chat requests now use `/api/backend` (Next.js Node route), forwarding internally to `API_INTERNAL_URL` (default `http://127.0.0.1:4000/api/v1`).
- Browser no longer needs direct access to localhost port 4000. Forward **only port 3000** to your browser in the VS Code Ports panel; treat forwarded links as development, not permanent hosting.
- `Failed to fetch` now yields a clear 503 response, backend status indicator, and transparent **offline FAQ** replies. Offline questions are **not delivered or stored**; start MongoDB/backend to enable saved private chat and contact forms.
- Authenticated client messages use MongoDB via Express; Firebase is used for authentication. Chat is refreshed by polling every nine seconds and works through same-origin tunnel.
- `NEXT_PUBLIC_API_URL` is no longer necessary; set `API_INTERNAL_URL` in `apps/web/.env.local`. If you run Express on a different host, change the server-side URL only.
- Modern Node ESM is already enabled (`apps/api/package.json` has `"type":"module"` and TypeScript NodeNext).
- The new `/contact` page adds WhatsApp, email, GitHub, LinkedIn, training certificate, payment instructions and a safe optional Google Maps iframe (`NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL`). Exact GMB map coordinates cannot be inferred from `share.google` shortened URL.
- Do not publish National ID, TIN, trade licence, private billing files, Firebase service-account JSON or MongoDB credentials. A training certificate is present only at the user's explicit request; it contains family details and should be privacy-reviewed before public publishing.
- bKash and Nagad wallets are **not guessed**; users must confirm the payee number privately and request invoice/payment confirmation. The contact phone is not assumed to be the wallet number.

### VS Code Remote Tunnel checks
```powershell
npm install
npm run dev
# In VS Code, open PORTS and forward port 3000 privately.
# Open http://localhost:3000/api/backend/health to verify Express
```
The vscode.dev tunnel editor URL does not grant an external assistant permission to access your local files. Changes in this ZIP are not automatically applied to your PC.

## Business contact + safe public payments

- The Google Maps iframe shown in `/contact` is the exact URL provided by the portfolio owner, not a derived private location.
- WhatsApp and public inquiry number: +8801407154481. This is **not verified** as the bKash or Nagad wallet number; the checkout panel only encourages private confirmation on invoice.
- Uploaded NID, tax certificate, agent cash receipt, bank credentials and service account credentials are intentionally **excluded** from `public/` and this ZIP.
- The course certificate PDF has the two parents’ names redacted in the public copy. Verify the original credential through the institute if needed.

## Troubleshooting through VS Code Remote Tunnel

1. Run the frontend and API in the **same Windows host** with `npm run dev` from project root.
2. Test `http://localhost:3000/api/backend/health` — the JSON should have `status: ok`. If HTTP 503, Express/MongoDB is offline.
3. In VS Code > PORTS, forward only TCP 3000, preferably with Private visibility. `vscode.dev/tunnel/...` is an editor address, **not** a public website URL.
4. Open the forwarded browser port URL; in Firebase Auth > Settings > Authorized Domains add the hostname only if Google OAuth reports unauthorized domain.
5. Chatbot supports **local offline FAQs** even if the backend fails. This is not saved or delivered. Saved client chats need authenticated Google/email user, running Express and MongoDB.
6. ESM is enabled on the API using `type: module`, TypeScript `NodeNext`, and `.js` module specifiers. Next.js frontend uses ES imports and route handlers.

## Tests

- Run `npm install`, then `npm run typecheck` and `npm run build`.
- Run `node scripts/check-portfolio.mjs` for offline structural checks.
- After deployment, manually test Google login, `/dashboard`, `/contact`, posting messages and owner replies with your actual credentials.

## One-command troubleshooting (PowerShell)

Run `./health-check.ps1` from a second terminal after `npm run dev`. Look for three OK results.
If Express is unreachable, confirm `.env` on your own PC, allowed MongoDB Atlas IP, and the API terminal.
If Express is OK but the proxied route fails, restart Next.js and inspect `API_INTERNAL_URL` in `apps/web/.env.local`.
