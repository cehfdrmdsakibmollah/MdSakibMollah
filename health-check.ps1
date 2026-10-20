# Local-only troubleshooting: run from any PowerShell terminal while npm run dev is running.
$targets = @(
    @{Name="Next.js browser frontend"; Url="http://localhost:3000"},
    @{Name="Express API direct"; Url="http://localhost:4000/api/v1/health"},
    @{Name="Next.js same-origin chatbot proxy"; Url="http://localhost:3000/api/backend/health"}
)
foreach ($target in $targets) {
    try {
        $r = Invoke-WebRequest -Uri $target.Url -UseBasicParsing -TimeoutSec 5
        Write-Host "[OK] $($target.Name): HTTP $($r.StatusCode)" -ForegroundColor Green
        if ($target.Name -eq 'Next.js same-origin chatbot proxy') { Write-Host $r.Content }
    } catch {
        Write-Host "[FAILED] $($target.Name) => $($target.Url)" -ForegroundColor Yellow
        Write-Host $_.Exception.Message
    }
}
