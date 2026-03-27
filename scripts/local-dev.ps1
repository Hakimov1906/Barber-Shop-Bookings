Param(
  [switch]$SkipInstall,
  [switch]$SkipSeed,
  [switch]$Detached
)

$ErrorActionPreference = "Stop"

function Assert-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

function Set-Or-AppendEnvValue {
  param(
    [string]$Path,
    [string]$Key,
    [string]$Value
  )

  if (-not (Test-Path $Path)) {
    Set-Content -Path $Path -Value "$Key=$Value" -Encoding utf8
    return
  }

  $pattern = "^\s*" + [regex]::Escape($Key) + "\s*="
  $lines = Get-Content -Path $Path
  $found = $false
  $updated = foreach ($line in $lines) {
    if ($line -match $pattern) {
      $found = $true
      "$Key=$Value"
    } else {
      $line
    }
  }

  if (-not $found) {
    $updated += "$Key=$Value"
  }

  Set-Content -Path $Path -Value $updated -Encoding utf8
}

Assert-Command docker
Assert-Command npm

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "barbershop-booking-api"
$backendEnv = Join-Path $backendDir ".env"
$backendEnvExample = Join-Path $backendDir ".env.example"
$frontendEnv = Join-Path $repoRoot ".env"
$frontendEnvExample = Join-Path $repoRoot ".env.example"

$dbContainer = "barbershop-postgres-local"
$dbName = "barbershop"
$dbUser = "postgres"
$dbPassword = "postgres"
$dbPort = "5432"

Write-Host "Starting local Postgres container..." -ForegroundColor Cyan
$existing = docker ps -a --filter "name=^/$dbContainer$" --format "{{.Names}}"
if ($existing -eq $dbContainer) {
  docker rm -f $dbContainer | Out-Null
}

docker run --name $dbContainer `
  -e "POSTGRES_PASSWORD=$dbPassword" `
  -e "POSTGRES_DB=$dbName" `
  -p "$dbPort`:5432" `
  -d postgres:15 | Out-Null

Write-Host "Waiting for Postgres health..." -ForegroundColor Cyan
for ($i = 1; $i -le 30; $i++) {
  docker exec $dbContainer pg_isready -U $dbUser -d $dbName *> $null
  if ($LASTEXITCODE -eq 0) {
    break
  }

  if ($i -eq 30) {
    throw "Postgres did not become ready in time."
  }
  Start-Sleep -Seconds 2
}

if (-not (Test-Path $backendEnv) -and (Test-Path $backendEnvExample)) {
  Copy-Item $backendEnvExample $backendEnv -Force
}

if (-not (Test-Path $frontendEnv) -and (Test-Path $frontendEnvExample)) {
  Copy-Item $frontendEnvExample $frontendEnv -Force
}

Set-Or-AppendEnvValue -Path $backendEnv -Key "DATABASE_URL" -Value "postgresql://$dbUser`:$dbPassword@localhost:$dbPort/$dbName"
Set-Or-AppendEnvValue -Path $backendEnv -Key "PGSSL" -Value "false"
Set-Or-AppendEnvValue -Path $backendEnv -Key "PORT" -Value "4000"
Set-Or-AppendEnvValue -Path $frontendEnv -Key "VITE_API_BASE_URL" -Value "http://localhost:4000"
Set-Or-AppendEnvValue -Path $frontendEnv -Key "VITE_MOCK_MODE" -Value "false"

if (-not $SkipInstall) {
  Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
  Push-Location $backendDir
  npm install
  Pop-Location

  Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
  Push-Location $repoRoot
  npm install --legacy-peer-deps
  Pop-Location
}

Write-Host "Running backend migrations..." -ForegroundColor Cyan
Push-Location $backendDir
npm run migrate:up
if (-not $SkipSeed) {
  npm run seed:refresh
}
Pop-Location

Write-Host "Generating API types..." -ForegroundColor Cyan
Push-Location $repoRoot
npm run api:types
Pop-Location

if ($Detached) {
  Write-Host "Starting backend and frontend in separate PowerShell windows..." -ForegroundColor Green
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; npm run dev"
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$repoRoot'; npm run dev"
  Write-Host "Done. Frontend: http://localhost:8080  Backend: http://localhost:4000" -ForegroundColor Green
  return
}

Write-Host "Starting backend in a new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; npm run dev"

Write-Host "Starting frontend in current terminal..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:8080  Backend: http://localhost:4000" -ForegroundColor Green
Push-Location $repoRoot
npm run dev
Pop-Location
