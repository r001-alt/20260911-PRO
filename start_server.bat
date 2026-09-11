@echo off
title REI Project - Local Server
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_server.ps1"
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] 伺服器異常終止，請檢查上方錯誤訊息。
    pause
)
