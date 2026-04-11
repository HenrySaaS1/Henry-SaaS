# HENRY local PostgreSQL — run from repo root:  powershell -ExecutionPolicy Bypass -File scripts/setup-local-db.ps1
$ErrorActionPreference = 'Stop'
# scripts/ -> repo root
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host "HENRY database setup (repo: $root)" -ForegroundColor Cyan

function Test-PortOpen([int]$Port) {
  try {
    $c = New-Object System.Net.Sockets.TcpClient
    $c.Connect('127.0.0.1', $Port)
    $c.Close()
    return $true
  } catch {
    return $false
  }
}

$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
  Write-Host "Starting PostgreSQL with Docker Compose..." -ForegroundColor Green
  docker compose up -d
  $deadline = (Get-Date).AddSeconds(45)
  while ((Get-Date) -lt $deadline) {
    if (Test-PortOpen 5432) { break }
    Start-Sleep -Seconds 1
  }
  if (-not (Test-PortOpen 5432)) {
    Write-Host "Port 5432 not open yet. Wait a few seconds and run:" -ForegroundColor Yellow
    Write-Host "  cd backend; npx prisma migrate deploy" -ForegroundColor Yellow
    exit 1
  }
} else {
  Write-Host "Docker not found. Choose one:" -ForegroundColor Yellow
  Write-Host "  1) Install Docker Desktop: https://docs.docker.com/desktop/install/windows-install/"
  Write-Host "     Then run:  docker compose up -d"
  Write-Host "  2) Install PostgreSQL 16 (winget):"
  Write-Host "     winget install PostgreSQL.PostgreSQL.16 --accept-package-agreements"
  Write-Host "     Create user/db henry, then set DATABASE_URL in backend/.env"
  Write-Host "  3) Free cloud DB: https://neon.tech — paste connection string in backend/.env (add ?sslmode=require)"
  if (-not (Test-PortOpen 5432)) {
    Write-Host "`nPort 5432 is not open. Fix that, then re-run this script." -ForegroundColor Red
    exit 1
  }
  Write-Host "Port 5432 is open — continuing with migrate..." -ForegroundColor Green
}

$envFile = Join-Path $root 'backend/.env'
if (-not (Test-Path $envFile)) {
  Copy-Item (Join-Path $root 'backend/.env.example') $envFile
  Write-Host "Created backend/.env from .env.example" -ForegroundColor Green
}

Set-Location (Join-Path $root 'backend')
Write-Host "Running Prisma migrations..." -ForegroundColor Green
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Database ready. Start API:  npm run dev" -ForegroundColor Cyan
