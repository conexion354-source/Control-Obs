@echo off
setlocal

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [ERROR] Node.js no esta instalado o no esta en PATH.
  echo Instala Node.js desde https://nodejs.org y vuelve a intentar.
  exit /b 1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":17354 .*LISTENING"') do set PID=%%a
if not defined PID (
  powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command ^
    "Start-Process -WindowStyle Hidden -FilePath 'node' -ArgumentList 'sync-server.js' -WorkingDirectory '%~dp0'"
  timeout /t 2 >nul
)

start "" "http://127.0.0.1:17354/index.html"
exit /b 0
