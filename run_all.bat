@echo off
title BlueGuard Launcher
echo ==========================================
echo   Starting BlueGuard Full-Stack App
echo ==========================================

echo [1/2] Launching Backend (FastAPI on :8000)...
start "BlueGuard Backend" cmd /k "cd /d %~dp0backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

echo [2/2] Launching Frontend (Vite on :5173)...
start "BlueGuard Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ==========================================
echo   Both services are now running!
echo   Frontend: http://localhost:5173/
echo   Backend:  http://localhost:8000/docs
echo ==========================================
