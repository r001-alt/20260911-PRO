# 系統規格中心 (`doc/spec/`)

本目錄為營建機電專案管理系統之分章節規格說明書。所有功能開發完成後，皆必須同步更新至對應章節中。

---

## 規格章節目錄 (Table of Chapters)

| 章節編號 | 規格檔案名稱 | 核心職責與規範範疇 |
| :--- | :--- | :--- |
| **第 01 章** | [01_系統架構與環境規格.md](file:///c:/Users/user/Documents/vscode_project/20260911-PRO/doc/spec/01_系統架構與環境規格.md) | 技術棧、本地運行環境、啟閉腳本、環境變數與安全生命週期 |
| **第 02 章** | [02_敏捷看板與任務管理規格.md](file:///c:/Users/user/Documents/vscode_project/20260911-PRO/doc/spec/02_敏捷看板與任務管理規格.md) | 看板欄位定義、任務編號邏輯、優先級、拖曳排序與施工附件關聯 |
| **第 03 章** | [03_工程疑義_RFI_追蹤規格.md](file:///c:/Users/user/Documents/vscode_project/20260911-PRO/doc/spec/03_工程疑義_RFI_追蹤規格.md) | RFI 自動編號規則、狀態機扭轉、圖號規範引用、工期成本影響評估與簽核回覆 |
| **第 04 章** | [04_AI工程顧問輔助規格.md](file:///c:/Users/user/Documents/vscode_project/20260911-PRO/doc/spec/04_AI工程顧問輔助規格.md) | Google Gemini 3.8 Flash 提示工程、多模態圖面分析、回覆草案生成與智慧降級模擬機制 |
| **第 05 章** | [05_通知與活動日誌規格.md](file:///c:/Users/user/Documents/vscode_project/20260911-PRO/doc/spec/05_通知與活動日誌規格.md) | 系統即時通知觸發條件、已讀未讀狀態維護、工程活動軌跡日誌 (Audit Trail) |
| **第 06 章** | [06_API介面與資料模型規格.md](file:///c:/Users/user/Documents/vscode_project/20260911-PRO/doc/spec/06_API介面與資料模型規格.md) | RESTful API 端點定義、請求/回應格式範例、TypeScript 實體型別定義 |

---

## 規格維護原則
1. **單一真實來源 (Single Source of Truth)**：任何功能變更完成後，必須回寫此處對應章節。
2. **分章明確**：禁止將所有規格混雜在單一巨大檔案中，新增獨立領域功能時，請規劃新增獨立章節。
