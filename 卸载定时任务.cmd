@echo off
setlocal
chcp 65001 >nul

set "TASK_NAME=ACG-Daily-Brief"

schtasks /Delete /TN "%TASK_NAME%" /F

if errorlevel 1 (
  echo.
  echo [INFO] Task not found. It may already be removed.
) else (
  echo.
  echo [DONE] Daily auto-update removed.
)
echo.
pause
