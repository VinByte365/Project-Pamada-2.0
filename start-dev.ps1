# Start FarmSystem Full-Stack Application (Backend + Frontend)

Write-Host "==================================================" -ForegroundColor Green
Write-Host " Starting FarmSystem Full-Stack Application       " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# 1. Start FastAPI Backend in a separate window
Write-Host "[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python -m uvicorn app.main:app --reload --port 8000"

# 2. Start Next.js Frontend in a separate window
Write-Host "[2/2] Starting Next.js Frontend on http://localhost:3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "Both servers are launching in dedicated terminal windows." -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend API docs: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "Backend Health: http://127.0.0.1:8000/health" -ForegroundColor White

