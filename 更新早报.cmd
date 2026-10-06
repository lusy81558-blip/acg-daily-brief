@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

set "NODE_EXE=node"
where node >nul 2>nul
if errorlevel 1 set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

"%NODE_EXE%" "scripts\build.mjs"
set "EXITCODE=%errorlevel%"

if not "%EXITCODE%"=="0" (
  echo.
  echo [FAILED] Update failed. Check your network and run again.
  echo.
)

if /i "%~1"=="--silent" exit /b %EXITCODE%
echo.
pause
exit /b %EXITCODE%
