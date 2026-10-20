#requires -Version 5.1
<#
.DESCRIPTION
  Configure LOCAL, gitignored Next.js/Express .env files using your Atlas and Firebase credential files.
  Keeps the raw service-account JSON outside the repository. It never uploads credentials.
.EXAMPLE
  .\setup-private-config.ps1 -AtlasFile 'C:\Users\you\Downloads\atlas-credentials.env' `
    -FirebaseFile 'C:\Users\you\Downloads\mdsakibmollahportfolio-firebase-adminsdk-XXXX.json' `
    -OwnerEmail 'ceh.fdr.mdsakibmollah@gmail.com'
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$AtlasFile,
    [Parameter(Mandatory = $true)][string]$FirebaseFile,
    [string]$OwnerEmail = 'ceh.fdr.mdsakibmollah@gmail.com',
    [string]$DatabaseName = 'sakib_portfolio'
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$atlasAbsolute = (Resolve-Path -LiteralPath $AtlasFile).Path
$firebaseAbsolute = (Resolve-Path -LiteralPath $FirebaseFile).Path
$apiTemplate = Join-Path $root 'apps/api/.env.example'
$webTemplate = Join-Path $root 'apps/web/.env.example'
$apiDestination = Join-Path $root 'apps/api/.env'
$webDestination = Join-Path $root 'apps/web/.env.local'
if (-not (Test-Path -LiteralPath $apiTemplate -PathType Leaf)) { throw 'Run this script from its original portfolio folder.' }
if ($OwnerEmail -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$') { throw 'Provide the Google email for your owner/admin account.' }
if ($DatabaseName -notmatch '^[A-Za-z0-9_-]+$') { throw 'Invalid database name.' }

$atlas = @{}
foreach ($line in [System.IO.File]::ReadAllLines($atlasAbsolute)) {
    $match = [regex]::Match($line, '^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$')
    if ($match.Success) {
        $value = $match.Groups[2].Value.Trim()
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
            ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        $atlas[$match.Groups[1].Value] = $value
    }
}
if (-not $atlas.ContainsKey('MONGODB_URI')) { throw 'Atlas file must contain MONGODB_URI.' }
$base = $atlas['MONGODB_URI']
$uriMatch = [regex]::Match($base, '^(mongodb(?:\+srv)?://[^/?\s]+)(?:/[^?\s]*)?(\?[^\s]*)?$')
if (-not $uriMatch.Success -or $base.Contains('<db_password>')) {
    throw 'Atlas connection URI is invalid or still contains a password placeholder.'
}
$uri = $uriMatch.Groups[1].Value + '/' + $DatabaseName + $uriMatch.Groups[2].Value

$serviceJson = [System.IO.File]::ReadAllText($firebaseAbsolute)
$service = $serviceJson | ConvertFrom-Json
if ($service.type -ne 'service_account' -or $service.project_id -ne 'mdsakibmollahportfolio' -or
    -not $service.client_email -or -not $service.private_key) {
    throw 'The JSON file is not a valid service account for the required Firebase project.'
}
# ADC reads from this private JSON file directly; no key is embedded in source or the .env file.
$adcPath = $firebaseAbsolute.Replace('\','/')
$api = [System.IO.File]::ReadAllText($apiTemplate)
$api = [regex]::Replace($api, '(?m)^MONGODB_URI=.*$', [System.Text.RegularExpressions.MatchEvaluator]{ param($m) 'MONGODB_URI="' + $uri + '"' })
$api = [regex]::Replace($api, '(?m)^ADMIN_EMAILS=.*$', [System.Text.RegularExpressions.MatchEvaluator]{ param($m) 'ADMIN_EMAILS=' + $OwnerEmail.ToLowerInvariant() })
$api = [regex]::Replace($api, '(?m)^OWNER_NOTIFICATION_EMAIL=.*$', [System.Text.RegularExpressions.MatchEvaluator]{ param($m) 'OWNER_NOTIFICATION_EMAIL=' + $OwnerEmail.ToLowerInvariant() })
$api = [regex]::Replace($api, '(?m)^GOOGLE_APPLICATION_CREDENTIALS=.*$', [System.Text.RegularExpressions.MatchEvaluator]{ param($m) 'GOOGLE_APPLICATION_CREDENTIALS="' + $adcPath + '"' })
if ($api -notmatch '(?m)^GOOGLE_APPLICATION_CREDENTIALS=') { throw 'Missing GOOGLE_APPLICATION_CREDENTIALS in API template.' }

# Limit accidental exposure in the shared folder and Git; .env is already ignored.
$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($apiDestination, $api, $utf8)
if (-not (Test-Path -LiteralPath $webDestination -PathType Leaf)) {
    [System.IO.File]::Copy($webTemplate, $webDestination)
}
Write-Host 'SUCCESS: Private MongoDB Atlas and Firebase Admin paths configured locally.' -ForegroundColor Green
Write-Host 'NEXT: Enable Google + Email/Password in Firebase Console, then run npm install; npm run dev.'
Write-Host 'IMPORTANT: Rotate the credentials you shared before production deployment.' -ForegroundColor Yellow
Write-Host 'NOTE: No credentials were copied into a GitHub upload package.'
