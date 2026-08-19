@echo off
setlocal
title Melonawka Uzytkownik Simulator V5
cd /d "%~dp0"
set PORT=8790
where py >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:%PORT%/index.html?v=5.0.0
  py -m http.server %PORT% --bind 127.0.0.1
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:%PORT%/index.html?v=5.0.0
  python -m http.server %PORT% --bind 127.0.0.1
  goto :eof
)
echo Nie znaleziono Pythona.
echo Otworz index.html bezposrednio w przegladarce.
pause
