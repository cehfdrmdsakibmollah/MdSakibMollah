# Configure the provided MongoDB Atlas + Firebase Admin files (WITHOUT sharing secrets)

The supplied `atlas-credentials.env` contains the MongoDB user/password/URI and the Firebase Admin JSON contains a **private signing key**. Both should be treated as compromised after being uploaded to a chat. **Rotate/revoke and regenerate both before live deployment.** Use the *new files* on your computer.

### On Windows PowerShell

1. Extract the ZIP into a normal folder.
2. Keep the **rotated** `atlas-credentials.env` and Firebase Admin JSON outside the project (for example your private Downloads folder). Do **not** put them in `public/`, `src/` or GitHub.
3. Open PowerShell in the extracted `MD-Sakib-Mollah-Portfolio-Production` folder:

```powershell
.\setup-private-config.ps1 `
  -AtlasFile 'C:\Users\YOURNAME\Downloads\atlas-credentials.env' `
  -FirebaseFile 'C:\Users\YOURNAME\Downloads\new-firebase-adminsdk.json' `
  -OwnerEmail 'ceh.fdr.mdsakibmollah@gmail.com'

npm install
npm run dev
```

4. This writes **only on your PC** `apps/api/.env` (Atlas URI, owner email and `GOOGLE_APPLICATION_CREDENTIALS` path) and `apps/web/.env.local` (public Firebase web config). The Firebase private key stays in the original JSON file outside your Git folder. The program verifies the Firebase `project_id` to prevent accidental cross-project use.
5. Open `http://localhost:3000`; backend `http://localhost:4000/api/v1/health`.
6. Open Firebase Console → `mdsakibmollahportfolio` → Authentication → Sign-in method. Enable Google and Email/Password; add `localhost` / live site to Authorized domains. Set Atlas Network Access to permit *your actual server IP* and grant the database user needed access.
7. Log in with **ceh.fdr.mdsakibmollah@gmail.com** to access `/dashboard` (verified Google or verified email).

### On Linux/macOS

Use Python 3.10+ (standard library only):

```bash
python3 setup-private-config.py ~/secure/atlas-credentials.env ~/secure/new-firebase-adminsdk.json ceh.fdr.mdsakibmollah@gmail.com
npm install
npm run dev
```

### Before going live

- **MongoDB:** Atlas → Security → Database Access → Edit user → rotate password; download/update a new local `.env` file with the rotated URI.
- **Firebase:** Google Cloud Console → IAM & Admin → Service Accounts → select account → Keys → delete the exposed key. Firebase Console → Project Settings → Service accounts → Generate new private key; download privately and update the path. Rotate first, then re-run the setup helper.
- **Never upload** service-account JSON, `.env`, `.env.local` or connection-password files to GitHub; the `.gitignore` and `publish-to-github.ps1` are designed to exclude them.
- **Hosting:** on Render/Vercel configure secrets in private dashboard environment settings, not in GitHub. For Node server hosting, either set `GOOGLE_APPLICATION_CREDENTIALS` to a secure, host-mounted service-account file, or set `FIREBASE_SERVICE_ACCOUNT_JSON_B64` to the newly generated service-account JSON encoded in base64 in server settings (base64 is NOT encryption). Vercel web only needs the public `NEXT_PUBLIC_FIREBASE_*` values.
- **OpenAI** and **Resend** credentials are optional, and must also remain backend-only.
- **DO NOT** grant Atlas open access (`0.0.0.0/0`) long-term; allowlist specific application egress IPs when feasible.

The ZIP contains **no actual MongoDB password or Firebase Admin private key**. It contains an executable local setup helper which consumes your own private files.

### Owner/admin email configured

The default owner email is **ceh.fdr.mdsakibmollah@gmail.com**. `apps/api/.env.example` and both setup helpers now set this email as `ADMIN_EMAILS` and `OWNER_NOTIFICATION_EMAIL`.

- Use the exact same verified Google account to sign in. Admin access is enforced by the Express API after Firebase ID-token verification, not just by the interface.
- The owner notification address receives emails only when the optional Resend API key and verified sender are configured.
- Never put private MongoDB passwords or Firebase service-account JSON in the project folder or version control.
