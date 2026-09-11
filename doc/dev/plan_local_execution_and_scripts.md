# 本地執行環境重構與伺服器啟閉腳本開發計畫 (plan_local_execution_and_scripts.md)

**建立日期**：2026-09-11  
**負責人/代理**：Antigravity Agent  
**狀態**：[已完成 / COMPLETED]  
**關聯需求**：將專案重構成本地電腦（Windows 環境）可直接執行的版本，並建立支援一鍵啟動與關閉伺服器之雙腳本。

---

## 1. 需求與目標概述
- **目標**：
  1. 解決雲端/特定環境至 Windows 本機電腦遷移時之通訊埠寫死、殘留行程鎖死 Port 3000、無環境變數檔等問題。
  2. 提供一般使用者與工程人員「開箱即用」、「滑鼠雙擊」即可執行的批次啟閉腳本 (`start_server.bat`、`stop_server.bat`)，並同步提供 PowerShell 腳本 (`start_server.ps1`、`stop_server.ps1`)。
  3. 啟動時具備前置檢查（Node.js 環境、`.env` 設定、`npm install` 套件安裝狀態、舊通訊埠衝突排查），並自動開啟瀏覽器導向首頁。
  4. 關閉時具備雙重安全釋放機制（`.server.pid` 行程識別碼終止 + 針對 Port 3000 殘留行程強制釋放），防止 Port 被背景死鎖。
- **使用情境**：
  - 開發者或終端用戶下載或 clone 專案後，直接滑鼠雙擊 `start_server.bat` 即可一鍵安裝相依套件、啟動本機伺服器並自動彈出瀏覽器。
  - 需要結束服務時，雙擊 `stop_server.bat` 即可安全釋放連接埠與關閉伺服器。

---

## 2. 系統架構與影響評估
- **後端變更**：
  - `server.ts`：引入 `dotenv` 讀取 `.env` 中的 `PORT` 與 `HOST`，在服務監聽前寫入 `.server.pid`，並綁定 `SIGINT`、`SIGTERM`、`exit` 訊號安全刪除 PID 檔；攔截 `EADDRINUSE` 錯誤並給予指引。
- **配置與相依套件**：
  - `.env` / `.env.example`：提供本機預設 `PORT=3000`、`HOST=0.0.0.0` 與 `GEMINI_API_KEY` 範本。
  - `package.json`：修改 `clean` 指令為 Node 跨平台腳本，相容 Windows 命令列環境。
- **腳本架構**：
  - `start_server.bat`：Bypass 執行 `start_server.ps1`，避免權限限制與編碼崩潰。
  - `start_server.ps1`：包含 UTF-8 BOM，具備 Node、`.env`、套件、Port 檢查，並在背景 Job 延遲 3 秒開啟 `http://localhost:3000`。
  - `stop_server.bat`：Bypass 執行 `stop_server.ps1`。
  - `stop_server.ps1`：包含 UTF-8 BOM，根據 `.server.pid` 與 `Get-NetTCPConnection` 雙重終止行程。
- **說明文件**：
  - `README_LOCAL.md`：繁體中文本地執行指南。

---

## 3. 詳細實作步驟清單
1. [x] **步驟一：重構 `server.ts` 本機執行相容性**
   - 支援動態 `process.env.PORT` 與 `process.env.HOST`。
   - 實作 `.server.pid` 產生與優雅釋放邏輯。
   - 美化終端機輸出，明確提示 `http://localhost:${PORT}`。
2. [x] **步驟二：建立環境變數設定檔**
   - 建立 `.env.example` 與預設 `.env`。
3. [x] **步驟三：跨平台相容性調適**
   - 調適 `package.json` 之 `clean` 指令，杜絕 Windows `rm -rf` 錯誤。
4. [x] **步驟四：建立 Windows 啟閉雙腳本**
   - 編寫 `start_server.bat` 與 `start_server.ps1`（注入 UTF-8 BOM）。
   - 編寫 `stop_server.bat` 與 `stop_server.ps1`（注入 UTF-8 BOM）。
5. [x] **步驟五：編寫本地端使用文件**
   - 建立 `README_LOCAL.md`，提供雙擊與指令操作圖文指引。
6. [x] **步驟六：回寫規格文件**
   - 回寫至 `doc/spec/01_系統架構與環境規格.md`。

---

## 4. 測試與驗證規劃
- [x] TypeScript 型別檢查：執行 `npx tsc --noEmit` 通過 (0 errors)。
- [x] 前端與伺服器生產打包：執行 `npm run build` 通過。
- [x] 伺服器啟動與 API 驗證：執行 `npm run dev` 並透過 HTTP 請求確認 `/api/v1/projects` 回傳正確 JSON。
- [x] 行程管理驗證：啟動後確認 `.server.pid` 正常生成；執行 `stop_server.bat` / `stop_server.ps1` 後確認行程終止且 Port 3000 完全釋放。
- [x] 編碼檢驗：確認所有 `.ps1` 檔案均含 `\uFEFF` (UTF-8 BOM)，在 Big5/CP950 系統上無亂碼無跳脫錯誤。
