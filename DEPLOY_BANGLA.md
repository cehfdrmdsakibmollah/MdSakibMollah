# MD Sakib Mollah Portfolio — বাংলায় চালু করার গাইড

## কী তৈরি হয়েছে?

এটি Next.js (App Router) + TypeScript + Tailwind CSS frontend এবং Node.js/Express + MongoDB backend-সহ একটি সম্পূর্ণ source-code project। Firebase Authentication দিয়ে Google sign-in, email/password, verification, password reset; client private messaging, live notifications, rule-based AI fallback, optional OpenAI responses, optional Resend email alerts, protected admin inbox, feedback এবং SEO pages তৈরি করা আছে। এটি একটি live hosted website নয়; চালাতে ও deploy করতে নিজের account/configuration লাগবে।

## তোমার MongoDB Atlas + Firebase credential files সংযুক্ত করতে

`SETUP_MONGODB_FIREBASE.md` পড়ো এবং `setup-private-config.ps1` চালাও। এখানে আগে শেয়ার করা credential files-এর পরিবর্তে rotated/new credentials ব্যবহার করবে। Script নিজে থেকে `.env` তৈরি করে, কিন্তু ZIP বা GitHub-এ password বা Firebase Admin key রাখে না।

## কম্পিউটারে প্রথমবার চালাতে

1. [Node.js 22 LTS](https://nodejs.org/) এবং Git ইনস্টল করো। লোকাল MongoDB চালাতে Docker Desktop অথবা [MongoDB Atlas](https://www.mongodb.com/atlas) account লাগবে।
2. ZIP Extract করে `MD-Sakib-Mollah-Portfolio-Production` folder খুলে VS Code Terminal খুলবে।
3. PowerShell-এ নিচের command চালাও:

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
Copy-Item apps/api/.env.example apps/api/.env
npm install
```

4. `apps/api/.env`-তে `MONGODB_URI`, `ADMIN_EMAILS` এবং Firebase Admin credentials ঠিক করো। `apps/web/.env.local`-তে browser Firebase configuration দেওয়া আছে—প্রয়োজনে নিজের project থেকে মিলিয়ে নেবে।
5. Docker থাকলে `docker compose up -d`, তারপর `npm run dev`।
6. Website: `http://localhost:3000`, API health check: `http://localhost:4000/api/v1/health`।

## Firebase Google login এবং password reset চালু করতে

1. [Firebase Console](https://console.firebase.google.com/) → `mdsakibmollahportfolio` project select করো।
2. Authentication → Sign-in method → **Google** ও **Email/Password** enable করো।
3. Authentication → Settings → Authorized domains → `localhost` এবং live domain যুক্ত করো।
4. Project settings → Service accounts → **Generate new private key**। JSON ফাইল একান্ত গোপন রাখবে; base64 এনকোড করা value `FIREBASE_SERVICE_ACCOUNT_JSON_B64`-এ দেবে অথবা supported host-এ Application Default Credentials ব্যবহার করবে।
5. `ADMIN_EMAILS`-এ owner-এর **আসল Google email** বসাবে। ওই account থেকেই login করে `/dashboard` খুলবে।
6. Password reset Firebase-এর email template দিয়ে পাঠানো হয়। চাইলে Firebase Authentication → Templates থেকে sender ও email branding ঠিক করো।

**গুরুত্বপূর্ণ:** এখানে দেওয়া Firebase web config public app identifier; কিন্তু Firebase Admin private key, OpenAI key, MongoDB URI ও Resend key কখনো GitHub-এ দেবে না।

## Client message কীভাবে কাজ করে?

- Visitor website-এর **contact form** দিয়ে project inquiry জমা দিতে পারে; MongoDB-তে সংরক্ষণ হয়।
- Private chat ব্যবহার করতে Google অথবা verified email দিয়ে login করতে হবে।
- নতুন chat/message MongoDB-তে save হয়; automated assistant উত্তর দেয় (OpenAI key দেওয়া থাকলে AI, না থাকলে predefined fallback)।
- Owner তার verified allowlisted email দিয়ে `/dashboard` খুলে message পড়ে personally reply দিতে পারে।
- Client chat experience ১–৫ তারকা rating দিয়ে private feedback দিতে পারে; owner dashboard ছাড়া কেউ দেখতে পায় না।
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` ও `OWNER_NOTIFICATION_EMAIL` দেওয়া থাকলে email notification পাঠানোর চেষ্টা করা হয়।

## AI চালু করতে (optional)

`apps/api/.env`-এ `OPENAI_API_KEY` এবং `OPENAI_MODEL` বসাও। Key server environment ছাড়া কোথাও থাকবে না। Assistant prompt-এ fake experience, fake clients বা guaranteed price বলা নিষেধ করা হয়েছে।

## GitHub-এ upload

এখানে target repository: <https://github.com/cehfdrmdsakibmollah/MdSakibMollah>

নিজের project folder থেকে `publish-to-github.ps1` চালালে original repo clone করবে এবং project files copy করবে, **কিন্তু নিজে commit/push করবে না**। Changes review করে তারপর:

```powershell
git status
git add .
git commit -m "Add full-stack developer portfolio"
git push origin main
```

যদি ZIP folder-এর ভেতরেই থাকো, প্রথমে `publish-to-github.ps1`-এ দেখানো temporary cloned folder-এ যাও। Existing repository README/changes review না করে overwrite কোরো না।

## Public website deploy

- **MongoDB Atlas:** production database create করো এবং host-এর access/IP rules ঠিক করো।
- **Render / Node host:** `apps/api` build, env keys, MongoDB URI, Firebase Admin credentials set করো। API health endpoint live পরীক্ষা করো।
- **Vercel:** Next.js web project, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, browser Firebase values set করো। Production domain Firebase Authorized domains-এ দাও।
- **Google Search Console:** নিজের site verify, `/sitemap.xml` submit এবং `/robots.txt` পরীক্ষা করো।

**SEO ranking guarantee নেই।** ভালো content, genuine project outcomes, proper domain, Core Web Vitals, internal/external links এবং ধারাবাহিক কাজ দরকার।

## Before public launch

- `npm run typecheck`, `npm run build`, `npm audit` সফলভাবে চালিয়ে যাচাই করবে।
- Google sign-in, email verification/reset, contact submission, client chat, owner reply, feedback এবং email delivery নিজের accounts-এ test করবে।
- Private service-account credentials local `.env` ছাড়া কোথাও যাবে না।
- Analytics consent, data retention, database backups, abuse prevention ও uptime monitoring production environment-এ যাচাই করবে।

### অ্যাডমিন অ্যাকাউন্ট
Owner login email: `ceh.fdr.mdsakibmollah@gmail.com`। এই account দিয়ে Google sign-in করতে হবে। `ADMIN_EMAILS` এবং `OWNER_NOTIFICATION_EMAIL`-এর default এই ঠিকানায় সেট করা আছে। Notification পাঠাতে Resend account এবং verified sender আলাদাভাবে configure করতে হবে।


### Update: Chatbot `Failed to fetch` via VS Code tunnel

`/api/backend/*` is a Next.js same-origin proxy to Express. Only forward Next.js port 3000; API port 4000 remains private on host machine.
Set `API_INTERNAL_URL=http://127.0.0.1:4000/api/v1` in `apps/web/.env.local` and restart `npm run dev`. In browser test `/api/backend/health`.
Chatbot offline FAQs are local-only and not delivered. Start database/API to enable real authenticated messaging and contact form persistence.
NID/TIN attachments and private credentials must not be committed. Read README for map embedding and payments.


### নতুন Chatbot Troubleshooting (Remote Tunnel)

- VS Code **PORTS** থেকে 3000 forward করো, API 4000 private রাখো।
- `apps/web/.env.local` এ `API_INTERNAL_URL=http://127.0.0.1:4000/api/v1` দাও।
- `http://localhost:3000/api/backend/health` খুলে `status:ok` দেখো।
- HTTP 503 হলে backend অথবা MongoDB Atlas connection check করো।
- Backend না চললে কেবল offline FAQ থাকবে; message owner-এর কাছে পৌঁছেছে বলা হবে না।
- NID, TIN, password, Firebase private key বা ব্যক্তিগত payment proof GitHub-এ দেবে না।
