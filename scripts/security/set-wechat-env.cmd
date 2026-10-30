@echo off
setlocal
title ESG Compass - WeChat secure setup
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0set-wechat-env.ps1"
set "EXIT_CODE=%ERRORLEVEL%"
echo.
if "%EXIT_CODE%"=="0" (
  echo Setup completed. The password input is never displayed.
) else (
  echo Setup failed. Review the message above and run this file again.
)
pause
exit /b %EXIT_CODE%
