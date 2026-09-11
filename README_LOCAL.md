# 營建機電專案管理系統 (REI) - 本地電腦執行指南

本專案已重構為支援 Windows 本地電腦開箱即用運行的版本。

---

## ⚡ 快速開始（推薦）

### 方法一：滑鼠雙擊腳本（最簡單）
1. **啟動伺服器**：在專案根目錄中直接**滑鼠雙擊** `start_server.bat`。
   - 腳本會自動檢查 Node.js、自動建立 `.env` 設定檔、自動檢查並安裝缺少的套件（`npm install`）。
   - 伺服器啟動完成後，會**自動喚起您的瀏覽器開啟** `http://localhost:3000`。
2. **停止伺服器**：
   - 直接關閉啟動視窗，或**滑鼠雙擊** `stop_server.bat` 徹底釋放通訊埠。

---

### 方法二：在 VS Code / PowerShell 終端機中執行
```powershell
# 啟動伺服器
.\start_server.ps1
# 或使用 npm 指令
npm run dev

# 關閉伺服器
.\stop_server.ps1
```

---

## ⚙️ 環境設定說明 (`.env`)

專案根目錄下的 `.env` 檔案包含以下設定：

| 變數名稱 | 預設值 | 說明 |
| :--- | :--- | :--- |
| `PORT` | `3000` | 伺服器監聽通訊埠。若改為 8080，啟動網址將為 `http://localhost:8080` |
| `HOST` | `0.0.0.0` | 允許本機與區域網路連線 |
| `GEMINI_API_KEY` | *(留空)* | **可選**。若填入 Google Gemini API Key，可啟用 Gemini 3.8 Flash 疑義深度分析；**若留空，系統亦內建智慧工程模擬評估模式，所有功能皆能正常運作** |

---

## 🛠️ 常用 npm 指令

| 指令 | 說明 |
| :--- | :--- |
| `npm run dev` | 以開發模式啟動伺服器 (整合 Vite 即時熱重載與後端 API) |
| `npm run build` | 建置前端 SPA 與後端伺服器至 `dist` 目錄 |
| `npm start` | 執行生產環境打包版本 (`node dist/server.cjs`) |
| `npm run clean` | 跨平台清理 `dist`、`server.js` 與 `.server.pid` 暫存檔 |
| `npm run lint` | 執行 TypeScript 型別檢查 (`tsc --noEmit`) |

---

## ❓ 常見問題排解

### Q1: 雙擊 `start_server.bat` 提示通訊埠 3000 被佔用？
**解答**：
請直接雙擊執行 `stop_server.bat`（或執行 `.\stop_server.ps1`），腳本會精準終止殘留行程並立即釋放 Port 3000。

### Q2: 啟動後在瀏覽器看到空白頁或連線失敗？
**解答**：
請確認網址為 `http://localhost:3000` 或 `http://127.0.0.1:3000`（避免使用 `0.0.0.0`，因為 Windows 瀏覽器限制不可直接訪問 0.0.0.0）。
