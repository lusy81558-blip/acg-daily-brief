@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

set "TASK_NAME=ACG-Daily-Brief"
set "TASK_TIME=07:00"

set "NODE_EXE=node"
where node >nul 2>nul
if errorlevel 1 set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

echo Installing daily task "%TASK_NAME%" at %TASK_TIME% ...
echo Node: %NODE_EXE%
echo Script: %~dp0scripts\build.mjs
echo.

schtasks /Create /TN "%TASK_NAME%" /TR "\"%NODE_EXE%\" \"%~dp0scripts\build.mjs\"" /SC DAILY /ST %TASK_TIME% /F

if errorlevel 1 (
  echo.
  echo [FAILED] Could not register the task. Try right-click - Run as administrator.
) else (
  echo.
  echo [DONE] Daily auto-update installed at %TASK_TIME%.
  echo If the PC is off at that time, just double-click the update cmd manually.
)
echo.
pause
