# Start-Apollo.ps1 - Starts all Apollo Voyage II services (monolith removed)
# Run from: F:\DEV\apollo\odyssey-voyage-II-server

$RootServer = "F:\DEV\apollo\odyssey-voyage-II-server"
$RootClient = "F:\DEV\apollo\odyssey-voyage-II-client"

function Start-ServiceWindow {
  param ([string]$Title, [string]$WorkingDir, [string]$Command)
  Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Set-Location '$WorkingDir'; `$host.UI.RawUI.WindowTitle = '$Title'; $Command"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Apollo Voyage II - Starting Up..."    -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: REST backing services (accounts @ 4010, listings @ 4011)
Write-Host "[1/5] Starting REST services (ports 4010, 4011)..." -ForegroundColor Yellow
Start-ServiceWindow -Title "REST Services" `
  -WorkingDir "$RootServer" `
  -Command "node scripts\launch-services.js"

Write-Host "      Waiting 4s for REST services to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 4

# Step 2: Accounts subgraph (port 4002)
Write-Host "[2/5] Starting subgraph-accounts (port 4002)..." -ForegroundColor Yellow
Start-ServiceWindow -Title "Subgraph-Accounts (4002)" `
  -WorkingDir "$RootServer\subgraph-accounts" `
  -Command "pnpm start"

Start-Sleep -Seconds 2

# Step 3: Listings subgraph (port 4003)
Write-Host "[3/5] Starting subgraph-listings (port 4003)..." -ForegroundColor Yellow
Start-ServiceWindow -Title "Subgraph-Listings (4003)" `
  -WorkingDir "$RootServer\subgraph-listings" `
  -Command "pnpm start"

Write-Host "      Waiting 3s for subgraphs to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Step 4: rover dev - Router (port 4000)
Write-Host "[4/5] Starting rover dev / Router (port 4000)..." -ForegroundColor Yellow
Start-ServiceWindow -Title "Rover Dev / Router (4000)" `
  -WorkingDir "$RootServer" `
  -Command "rover dev --supergraph-config .\router\supergraph-config.yaml --router-config .\router\router-config.yaml --router-version 2.14.0"

Start-Sleep -Seconds 2

# Step 5: Client (port 3000)
Write-Host "[5/5] Starting client (port 3000)..." -ForegroundColor Yellow
Start-ServiceWindow -Title "Client (3000)" `
  -WorkingDir "$RootClient" `
  -Command "pnpm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   All services starting!"               -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  REST services : http://127.0.0.1:4010 (accounts)"  -ForegroundColor White
Write-Host "                  http://127.0.0.1:4011 (listings)"  -ForegroundColor White
Write-Host "  Accounts GQL  : http://localhost:4002"             -ForegroundColor White
Write-Host "  Listings GQL  : http://localhost:4003"             -ForegroundColor White
Write-Host "  Router        : http://localhost:4000  <-- query here" -ForegroundColor Cyan
Write-Host "  Client        : http://localhost:3000  <-- browser here" -ForegroundColor Cyan
Write-Host ""
Write-Host "Wait ~10s total for all services to fully start." -ForegroundColor Gray
Write-Host ""
