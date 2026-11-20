@echo off
chcp 65001 >nul
title Kizuna - Kurulum dosyasi olusturuluyor
cd /d "%~dp0"
rem Builds a local Windows installer in "dist" (does not publish anything).
set "NODE=build\node\node.exe"
if not exist "%NODE%" ( where node >nul 2>nul && set "NODE=node" )
if not exist "%NODE%" if not "%NODE%"=="node" ( echo Once Node.js kurun: https://nodejs.org & pause & exit /b )

echo  [1/2] Uygulama paketleri...
if not exist node_modules call npm install
if not exist build\icon.png echo  [i] Logolu ikon icin once Baslat.bat ile uygulamayi bir kez acip kapatin.

echo  [2/2] Kurulum dosyasi olusturuluyor...
set CSC_IDENTITY_AUTO_DISCOVERY=false
"%NODE%" node_modules\electron-builder\cli.js --win nsis --x64 --publish never
echo.
echo  Bitti! Kurulum dosyasi "dist" klasorunde.
explorer dist
pause
