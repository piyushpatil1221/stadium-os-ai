@echo off
title StadiumOS AI - Startup
color 0A

echo.
echo  ====================================================
echo    StadiumOS AI - FIFA World Cup 2026 Platform
echo  ====================================================
echo.

:: ---- Backend ----
echo [1/2] Starting FastAPI backend on http://localhost:8000
cd /d "%~dp0backend"

:: Install deps if needed
pip install -r requirements.txt --quiet

:: Start uvicorn in a new window
start "StadiumOS Backend" cmd /k "uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak >nul

:: ---- Frontend ----
echo [2/2] Starting Vite frontend on http://localhost:5173
cd /d "%~dp0frontend"

:: Start vite in a new window
start "StadiumOS Frontend" cmd /k "npm run dev"

echo.
echo  Both servers are starting...
echo  - Frontend: http://localhost:5173
echo  - Backend:  http://localhost:8000
echo  - API Docs: http://localhost:8000/docs
echo.
echo  Demo accounts:
echo    admin@stadiumos.ai     / admin1234     (Admin)
echo    organizer@stadiumos.ai / organizer1234 (Organizer)
echo    staff@stadiumos.ai     / staff1234     (Staff)
echo    volunteer@stadiumos.ai / volunteer1234 (Volunteer)
echo    fan@stadiumos.ai       / fan12345      (Fan)
echo.
pause
