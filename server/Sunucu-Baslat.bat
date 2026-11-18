@echo off
chcp 65001 >nul
title Kizuna Sunucusu
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo  [!] Node.js bulunamadi. https://nodejs.org adresinden LTS surumunu kurun.
  start "" https://nodejs.org/
  pause
  exit /b
)
if not exist node_modules (
  echo  Ilk kurulum yapiliyor...
  call npm install --omit=dev
)
node server.js
pause
