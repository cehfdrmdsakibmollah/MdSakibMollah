# Safe Windows deployment helper: clones repo, copies source, and pauses before commit/push.
# Credentials, local env files, dependencies and private certificates are never copied.
$ErrorActionPreference = 'Stop'
$repo = 'https://github.com/cehfdrmdsakibmollah/MdSakibMollah.git'
$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = Join-Path $env:TEMP 'sakib-portfolio-github-sync'
if (Test-Path $target) { throw "Target already exists: $target. Move/delete it manually before running." }
git clone $repo $target
if ($LASTEXITCODE -ne 0) { throw 'Git clone failed.' }
robocopy $source $target /E /NFL /NDL /NJH /NJS /NC /NS `
  /XD '.git' 'node_modules' '.next' '.vercel' 'dist' 'coverage' '.secrets' `
  /XF '.env' '.env.local' '.env.production' '.env.development' '.env.test' `
      'atlas-credentials.env' '*firebase-adminsdk*.json' '*service-account*.json' `
      '*serviceAccountKey*.json' '*.pem' '*.key' '*.p12' '*.pfx' '*.log'
if ($LASTEXITCODE -gt 7) { throw 'File copying failed.' }
Set-Location $target
Write-Host 'Review git status + git diff before committing.' -ForegroundColor Yellow
Write-Host 'Check no credentials are staged: git status --short'
Write-Host 'When satisfied: git add .; git commit -m "Add premium developer portfolio"; git push origin main'
Write-Host "Repository clone: $target"
