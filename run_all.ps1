# BlueGuard Single Launcher Script
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Starting BlueGuard Full-Stack App      " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "`n[1/2] Starting FastAPI Backend on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

Write-Host "[2/2] Starting Vite Frontend on port 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm.cmd run dev"

Write-Host "`nAll services launched!" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173/" -ForegroundColor White
Write-Host "Backend:  http://localhost:8000/docs" -ForegroundColor White
