# Run from the repository root:
# powershell -ExecutionPolicy Bypass -File .\scripts\deploy-cloudflare.ps1
# This deploys the Next.js frontend as a Cloudflare WORKER (not Pages).
# It never stores or displays API credentials.
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$web = Join-Path $root "apps\web"
if (-not (Test-Path (Join-Path $web "package.json"))) { throw "apps/web/package.json missing. Run this from the portfolio repository." }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Install Node.js 22 LTS or later first." }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm was not found." }

Write-Host ""
Write-Host "[Portfolio] Preparing Cloudflare Workers deployment" -ForegroundColor Cyan
Write-Host "The existing *.pages.dev project cannot run this dynamic Next.js app as ordinary static HTML."
Write-Host "This will create a separate *.workers.dev deployment using OpenNext."
Write-Host "Note: Dashboard/chat require a separately deployed HTTPS Express API (API_INTERNAL_URL)."
Write-Host ""

Push-Location $root
try {
  Write-Host "Installing pinned OpenNext + Wrangler into apps/web..." -ForegroundColor Cyan
  & npm install -w apps/web --save-dev --save-exact "@opennextjs/cloudflare@1.20.12" "wrangler@4.129.1"
  if ($LASTEXITCODE -ne 0) { throw "npm dependency installation failed." }

  Push-Location $web
  try {
    if (-not (Test-Path "wrangler.jsonc") -and -not (Test-Path "wrangler.toml")) {
      Write-Host "Generating OpenNext / Wrangler configuration..." -ForegroundColor Cyan
      & npx opennextjs-cloudflare migrate
      if ($LASTEXITCODE -ne 0) { throw "OpenNext migration failed; inspect the output before redeploying." }
    }
    if (-not (Test-Path "open-next.config.ts")) {
      Write-Host "OpenNext config missing. Run npx opennextjs-cloudflare migrate and inspect its output." -ForegroundColor Yellow
    }
    Write-Host "Logging into Cloudflare. Browser authorization is required." -ForegroundColor Cyan
    & npx wrangler login
    if ($LASTEXITCODE -ne 0) { throw "Cloudflare login failed." }
    Write-Host "Building Workers-compatible output..." -ForegroundColor Cyan
    & npx opennextjs-cloudflare build
    if ($LASTEXITCODE -ne 0) { throw "Cloudflare build failed. Do not deploy until it passes." }
    Write-Host "Deploying frontend Worker..." -ForegroundColor Cyan
    & npx opennextjs-cloudflare deploy
    if ($LASTEXITCODE -ne 0) { throw "OpenNext deployment failed." }
    Write-Host ""
    Write-Host "Worker deploy command finished. Check the *.workers.dev URL printed above." -ForegroundColor Green
    Write-Host "If Google sign-in fails, add the new hostname to Firebase Authorized domains."
    Write-Host "Set API_INTERNAL_URL to your deployed HTTPS backend API URL to enable dashboard/chat."
    Write-Host "Remember to commit generated configuration and package-lock changes AFTER verifying the diff."
  }
  finally { Pop-Location }
}
finally { Pop-Location }
