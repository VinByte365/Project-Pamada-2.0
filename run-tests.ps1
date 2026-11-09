# Run Full-Stack Tests (Backend Pytest + Frontend Typecheck/Build)

Write-Host "==================================================" -ForegroundColor Green
Write-Host " Running Backend & Frontend Test Suite            " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

Write-Host "`n[1/2] Running Backend Pytest Tests..." -ForegroundColor Cyan
python -m pytest backend/tests

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nBackend tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/2] Running Frontend Build & Typecheck..." -ForegroundColor Cyan
npm --prefix frontend run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nFrontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host " All Full-Stack Tests Passed Successfully!        " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

