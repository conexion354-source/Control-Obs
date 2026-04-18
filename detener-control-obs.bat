@echo off
setlocal

for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":17354 .*LISTENING"') do (
  taskkill /PID %%a /F >nul 2>nul
)

exit /b 0
