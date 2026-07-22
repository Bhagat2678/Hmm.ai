# ==============================================================================
# Mhmm.ai Native Development Startup Script for Windows (PowerShell)
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "[INFO] Starting Mhmm.ai Platform Natively..." -ForegroundColor Cyan

$ScriptDir = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
$RootDir = Split-Path -Path $ScriptDir -Parent
Set-Location $RootDir

# Activate virtual environment if available
if (Test-Path ".venv\Scripts\Activate.ps1") {
    Write-Host "[INFO] Activating virtual environment..." -ForegroundColor Green
    & ".venv\Scripts\Activate.ps1"
}

Write-Host "[INFO] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
$env:PYTHONPATH = "$RootDir;$RootDir\backend"
$BackendJob = Start-Job -ScriptBlock {
    Set-Location "$using:RootDir\backend"
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
}

Start-Sleep -Seconds 3

Write-Host "[INFO] Starting Frontend Dev Server on http://localhost:5173..." -ForegroundColor Green
Set-Location "$RootDir\frontend"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "🚀 Mhmm.ai Platform Running Natively!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "📡 Backend API:         http://localhost:8000" -ForegroundColor White
Write-Host "📖 API OpenAPI Docs:     http://localhost:8000/docs" -ForegroundColor White
Write-Host "🎨 Frontend Workspace:   http://localhost:5173" -ForegroundColor White
Write-Host "====================================================" -ForegroundColor Cyan

npm run dev
