@echo off
chcp 65001 >nul
title Kizuna
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [!] Node.js bulunamadi.
  echo      https://nodejs.org adresinden LTS surumunu indirip kurun,
  echo      sonra bu dosyayi tekrar calistirin.
  echo.
  start "" https://nodejs.org/
  pause
  exit /b
)
if not exist node_modules (
  echo  Ilk kurulum yapiliyor, birkac dakika surebilir...
  call npm install
)
call npm start
