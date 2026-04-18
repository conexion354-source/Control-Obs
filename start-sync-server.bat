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

echo Iniciando servidor local en http://127.0.0.1:17354 ...
node sync-server.js
