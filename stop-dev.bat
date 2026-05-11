@echo off
title Novel Reader - Stopping Services

echo Stopping all novel-reader services...
echo.

taskkill /f /fi "WINDOWTITLE eq Backend-8080" 2>nul && echo  [OK] Backend stopped || echo  [!] Backend not running
taskkill /f /fi "WINDOWTITLE eq H5-5175" 2>nul && echo  [OK] H5 stopped || echo  [!] H5 not running
taskkill /f /fi "WINDOWTITLE eq Admin-5176" 2>nul && echo  [OK] Admin stopped || echo  [!] Admin not running

echo.
echo Done.
timeout /t 3 >nul
