@echo off
chcp 65001 >nul
title Kizuna - Kurulum dosyasi olusturuluyor
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 ( echo Once Node.js 22.13 veya ustunu kurun: https://nodejs.org & pause & exit /b )

echo  [1/4] Uygulama paketleri...
if not exist node_modules call npm install

echo  [2/4] Sunucu paketleri...
pushd server
if not exist node_modules\node-turn call npm install --omit=dev
popd

echo  [3/4] Sunucu icin Node.js calisma ortami...
if not exist build\node\node.exe (
  mkdir build\node 2>nul
  for /f "delims=" %%i in ('where node') do (
    copy /y "%%i" build\node\node.exe >nul
    if exist "%%~dpiLICENSE" copy /y "%%~dpiLICENSE" build\node\LICENSE >nul
    goto :nodecopied
  )
)
:nodecopied
build\node\node.exe -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)"
if errorlevel 1 ( echo  [!] build\node\node.exe surumu 22.13'ten eski. Yeni Node.js kurup build\node klasorunu silin. & pause & exit /b )
if not exist build\icon.png echo  [i] Logolu ikon icin once Baslat.bat ile uygulamayi bir kez acip kapatin.

echo  [4/4] Kurulum dosyasi olusturuluyor...
set CSC_IDENTITY_AUTO_DISCOVERY=false
call npx electron-builder --win nsis --x64 --publish never
echo.
echo  Bitti! Kurulum dosyasi "dist" klasorunde: Kizuna Setup 1.0.0.exe
explorer dist
pause
