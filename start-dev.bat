@echo off
title Novel Reader - Dev Server
cd /d "%~dp0"

echo ============================================
echo  Novel Reader - Starting All Services...
echo ============================================
echo.

:: ---- Backend (Spring Boot :8080) ----
echo [1/3] Starting Backend (port 8080)...
start "Backend-8080" cmd /c "cd /d backend && call mvn spring-boot:run -q"

:: ---- H5 Frontend (:5175) ----
echo [2/3] Starting H5 Frontend (port 5175)...
start "H5-5175" cmd /c "cd /d frontend && call npm run dev:h5"

:: ---- Admin Frontend (:5176) ----
echo [3/3] Starting Admin Frontend (port 5176)...
start "Admin-5176" cmd /c "cd /d admin-frontend && call npm run dev"

echo.
echo All services starting up!
echo   Backend :8080     (window: Backend-8080)
echo   H5      :5175     (window: H5-5175)
echo   Admin   :5176     (window: Admin-5176)
echo.
echo Close each window to stop, or run stop-dev.bat
echo ============================================
pause
