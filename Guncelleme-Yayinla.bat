@echo off
chcp 65001 >nul
title Kizuna - Guncelleme yayinlaniyor
cd /d "%~dp0"
rem One-click release: bumps the version, builds the installer, uploads it to GitHub.
rem Everyone using Kizuna receives this version automatically.

set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Links;%PATH%"
where gh >nul 2>nul || ( echo  [!] GitHub CLI bulunamadi. & pause & exit /b 1 )
where git >nul 2>nul || ( echo  [!] Git bulunamadi. & pause & exit /b 1 )
if not exist build\node\node.exe ( echo  [!] build\node\node.exe yok. Once Kurulum-Exe-Olustur.bat calistirin. & pause & exit /b 1 )
gh auth status >nul 2>nul || ( echo  GitHub girisi gerekiyor, tarayici acilacak... & gh auth login --hostname github.com --git-protocol https --web )

echo  [1/4] Surum numarasi artiriliyor...
for /f "delims=" %%v in ('build\node\node.exe scripts\bump.js') do set VER=%%v
echo        Yeni surum: %VER%

echo  [2/4] Kod GitHub'a gonderiliyor...
git add -A
git commit -q -m "Kizuna v%VER%"
git tag v%VER%
git push -q origin HEAD --tags || ( echo  [!] Kod gonderilemedi. & pause & exit /b 1 )

echo  [3/4] Kurulum dosyasi olusturuluyor ve yayinlaniyor...
for /f "delims=" %%t in ('gh auth token') do set GH_TOKEN=%%t
set CSC_IDENTITY_AUTO_DISCOVERY=false
set "PATH=%~dp0build\node;%PATH%"
build\node\node.exe node_modules\electron-builder\cli.js --win nsis --x64 --publish always
if errorlevel 1 ( echo  [!] Yayinlama basarisiz. & pause & exit /b 1 )
set GH_TOKEN=

echo  [4/4] Bitti!
echo.
echo  Kizuna v%VER% yayinda. Kullanicilar bir sonraki acilista otomatik guncellenecek.
echo  https://github.com/tvman78/Kizuna/releases
pause
