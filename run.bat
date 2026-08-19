@echo off
title Melonawka Uzytkownik Simulator V7
cd /d "%~dp0"
set PORT=8797
where py >nul 2>nul
if %errorlevel%==0 (
 start "" "http://localhost:%PORT%/?v=7"
 py -m http.server %PORT%
 goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
 start "" "http://localhost:%PORT%/?v=7"
 python -m http.server %PORT%
 goto :eof
)
echo Nie znaleziono Pythona. Do poprawnego ladowania baz JSON aplikacja wymaga serwera HTTP.
pause
