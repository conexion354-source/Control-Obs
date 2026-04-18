@echo off
setlocal

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo.
  echo [ERROR] Node.js no esta instalado o no esta en PATH.
  echo Instala Node.js desde https://nodejs.org y vuelve a intentar.
  echo.
  pause
  exit /b 1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":17354 .*LISTENING"') do set PID=%%a
if not defined PID (
  start "Control-OBS Sync" cmd /k "cd /d %~dp0 && node sync-server.js"
  timeout /t 2 >nul
)

start "" "http://127.0.0.1:17354/index.html"

echo.
echo Panel:   http://127.0.0.1:17354/index.html
echo Overlay: http://127.0.0.1:17354/index.html?mode=overlay
echo.
echo Usa la URL de Overlay en OBS (fuente Navegador, NO archivo local).
echo.
pause
