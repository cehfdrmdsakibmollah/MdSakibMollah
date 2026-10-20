@echo off
where node >nul 2>&1 || (echo Please install Node.js 22 and reopen this window. & pause & exit /b 1)
if not exist "apps\web\.env.local" copy "apps\web\.env.example" "apps\web\.env.local"
if not exist "apps\api\.env" copy "apps\api\.env.example" "apps\api\.env"
echo Review apps\api\.env and configure MongoDB, Admin email and Firebase service account before starting.
echo For a local MongoDB container, run: docker compose up -d
echo.
call npm install
if errorlevel 1 (pause & exit /b 1)
call npm run dev
pause
