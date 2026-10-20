# Fix Cloudflare Pages 404 — Full-stack Next.js Portfolio

The screenshot of `https://mdsakibmollahportfolio.pages.dev/` showed HTTP 404 even though Cloudflare said the project was deployed. Pages requires an actual top-level `index.html` within the configured output directory, and deployment success does not prove it exists.

**The portfolio is not a static website:** Next.js App Router uses server-side API route handlers (`apps/web/src/app/api/backend/[...path]/route.ts`). Converting it to `next.config.ts -> output: "export"` would remove essential backend proxy capabilities. Do NOT do that as a "quick fix".

**Recommended path:** deploy frontend as **Cloudflare Workers** using OpenNext. Cloudflare Pages and Workers use different project types; the existing `*.pages.dev` link will not automatically become a Worker URL. A new Worker normally gets `*.workers.dev`.

## One-command setup (Windows PowerShell)

In an up-to-date clone of this repo (Node 22+; clean working tree recommended), run:

```powershell
cd C:\Code\MD-Sakib-Mollah-Portfolio
git pull origin main
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-cloudflare.ps1
```

The script installs pinned Cloudflare adapter packages, uses the official OpenNext migration to generate config, signs in to Cloudflare, builds the Next.js app for the Workers runtime, and deploys it.

**Important:** The script modifies `package.json`, `package-lock.json`, and may generate `wrangler.jsonc` / `open-next.config.ts`. Review changes before committing them; **never commit `.env` or secrets**. If you use a Cloudflare Workers Git connection instead of local Wrangler, commit these generated (non-secret) files and configure Workers Builds using the repo's `apps/web` root directory.

## Backend is separate

The currently configured backend is a Node.js Express/Mongoose application (`apps/api`) listening locally on 4000. Your public Cloudflare Worker **cannot** contact that localhost API. Deploy the backend separately on a suitable HTTPS Node host, then configure:

- `API_INTERNAL_URL=https://YOUR-BACKEND-HOST/api/v1` on the frontend Worker, as a secret/binding/environment variable
- `WEB_ORIGIN=https://YOUR-WORKER-DOMAIN` on the backend
- Rotate exposed Atlas/Firebase credentials before setting backend secrets. Configure `MONGODB_URI`, `FIREBASE_SERVICE_ACCOUNT_JSON_B64`, `FIREBASE_PROJECT_ID`, and `ADMIN_EMAILS` only in backend secrets.
- For the browser Firebase config, ensure the deployed hostname is added to Firebase Authentication **Authorized Domains**.
- For production SEO, set `NEXT_PUBLIC_SITE_URL` at build time to the final deployed frontend domain.

Without a reachable backend, your homepage can deploy, but Dashboard and saved Chatbot messages will **not** function. Do not mistake a successful static build for end-to-end functionality.

## Verification

1. New `https://*.workers.dev` URL returns the homepage (not 404).
2. Check `/api/backend/health` (503 means no reachable backend).
3. Backend `/api/v1/health` responds 200 and shows MongoDB connected.
4. Test Firebase Google sign-in, admin dashboard, client messages, owner replies, and contact form.
5. Only switch a custom domain to the new Worker after tests pass; the old `*.pages.dev` address is associated with the old Pages project.

## Troubleshooting

- If OpenNext migration reports unsupported runtime or missing binding, review `wrangler.jsonc` and use `npx opennextjs-cloudflare build` for detailed errors.
- If hostname unavailable, check Cloudflare Workers `workers.dev` subdomain settings.
- If Firebase says unauthorized domain, add the exact Worker hostname in Firebase Console.
- If API says `BACKEND_URL_MISSING`, configure the frontend's `API_INTERNAL_URL` to the HTTPS backend.
- Do not put your local Windows `GOOGLE_APPLICATION_CREDENTIALS` path into cloud settings.

References:
- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/framework-guides/nextjs/
- https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/
- https://opennext.js.org/cloudflare/get-started
