# ======================================================================
#   營建機電專案管理系統 (REI) - PowerShell 關閉腳本
# ======================================================================

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  [REI] 營建機電專案管理系統 - 關閉本地伺服器" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

$stopped = $false

# 1. 根據 .server.pid 關閉行程
if (Test-Path ".server.pid") {
    $pidContent = (Get-Content ".server.pid" -Raw).Trim()
    if ($pidContent -match '^\d+$') {
        $pidNum = [int]$pidContent
        try {
            $proc = Get-Process -Id $pidNum -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "[INFO] 終止伺服器主行程 (PID: $pidNum)..." -ForegroundColor Yellow
                Stop-Process -Id $pidNum -Force -ErrorAction SilentlyContinue
                $stopped = $true
            }
        } catch {}
    }
    Remove-Item ".server.pid" -Force -ErrorAction SilentlyContinue
}

# 2. 徹底釋放通訊埠 3000
Write-Host "[INFO] 正在檢查通訊埠 3000 是否有任何監聽行程..." -ForegroundColor Gray
$connections = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($connections) {
    foreach ($conn in $connections) {
        $pId = $conn.OwningProcess
        try {
            Stop-Process -Id $pId -Force -ErrorAction SilentlyContinue
            Write-Host "[OK] 已強制終止佔用 Port 3000 之行程 (PID: $pId)" -ForegroundColor Green
            $stopped = $true
        } catch {}
    }
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
if ($stopped) {
    Write-Host "  [成功] 本地伺服器已安全停止！通訊埠 3000 已完全釋放。" -ForegroundColor Green
} else {
    Write-Host "  [提示] 目前未發現運行中的伺服器或佔用通訊埠 3000 的行程。" -ForegroundColor Yellow
}
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""
