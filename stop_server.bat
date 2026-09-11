@echo off
title REI Project - Stop Server
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop_server.ps1"
