# ======================================================================
#   營建機電專案管理系統 (REI) - PowerShell 啟動腳本
# ======================================================================

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  [REI] 營建機電專案管理系統 - 本地伺服器啟動腳本" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 檢查 Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[錯誤] 系統未偵測到 Node.js，請先安裝 Node.js (https://nodejs.org/)" -ForegroundColor Red
    exit 1
}

# 2. 檢查 .env
if (-not (Test-Path ".env")) {
    Write-Host "[INFO] 未偵測到 .env 設定檔，正在自動建立預設設定..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
    } else {
        @"
PORT=3000
HOST=0.0.0.0
GEMINI_API_KEY=
"@ | Out-File -FilePath ".env" -Encoding utf8
    }
    Write-Host "[OK] 已建立 .env 檔案" -ForegroundColor Green
}

# 3. 檢查 node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] 尚未安裝套件，正在執行 npm install..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[錯誤] 套件安裝失敗。" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] 套件安裝完成！" -ForegroundColor Green
}

# 4. 檢查通訊埠 3000 是否被佔用
$activeConn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($activeConn) {
    Write-Host "[提示] 偵測到通訊埠 3000 被舊行程佔用，正在嘗試清理..." -ForegroundColor Yellow
    & "$ScriptDir\stop_server.ps1"
    Start-Sleep -Seconds 1
}

# 5. 開啟瀏覽器工作
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:3000"
} | Out-Null

Write-Host ""
Write-Host ">> 正在啟動本地伺服器..." -ForegroundColor Green
Write-Host ">> 啟動後將自動在瀏覽器開啟: http://localhost:3000" -ForegroundColor Cyan
Write-Host ">> 如需停止伺服器，可按 Ctrl+C 或執行 .\stop_server.ps1" -ForegroundColor Gray
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

npm run dev
