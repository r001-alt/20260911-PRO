# 第 06 章：API 介面與資料模型規格

## 6.1 RESTful API 端點清單

### 認證與使用者 (Auth & Users)
| 方法 | 端點路徑 | 說明 |
| :--- | :--- | :--- |
| `GET` | `/api/v1/auth/me` | 取得目前登入使用者與可切換的使用者清單 |
| `POST` | `/api/v1/auth/login` | 使用者登入 |
| `POST` | `/api/v1/auth/switch-user` | 快速切換模擬身分（便於測試不同角色） |
| `GET` | `/api/v1/users` | 取得團隊成員清單 |

### 專案管理 (Projects)
| 方法 | 端點路徑 | 說明 |
| :--- | :--- | :--- |
| `GET` | `/api/v1/projects` | 取得所有工程專案清單 |
| `POST` | `/api/v1/projects` | 建立新工程專案 |
| `GET` | `/api/v1/projects/:id` | 取得特定專案詳情 |

### 敏捷看板與任務 (Kanban & Tasks)
| 方法 | 端點路徑 | 說明 |
| :--- | :--- | :--- |
| `GET` | `/api/v1/kanban/columns` | 取得看板欄位清單 (支援 `?project_id=`) |
| `POST` | `/api/v1/kanban/columns` | 新增看板欄位 |
| `DELETE`| `/api/v1/kanban/columns/:id` | 刪除看板欄位 |
| `GET` | `/api/v1/kanban/tasks` | 取得任務清單 (支援附件與負責人關聯) |
| `POST` | `/api/v1/kanban/tasks` | 建立新任務卡片 (自動編號 TSK-xxx) |
| `PUT` | `/api/v1/kanban/tasks/:id` | 編輯任務詳情 |
| `DELETE`| `/api/v1/kanban/tasks/:id` | 刪除任務卡片 |
| `POST` | `/api/v1/kanban/tasks/:id/move` | 移動任務至不同欄位或更新排序 |

### 工程疑義 (RFI)
| 方法 | 端點路徑 | 說明 |
| :--- | :--- | :--- |
| `GET` | `/api/v1/rfis` | 取得 RFI 清單 (支援關鍵字 `?q=` 檢索) |
| `POST` | `/api/v1/rfis` | 建立新 RFI (自動格式化編號並關聯附件) |
| `GET` | `/api/v1/rfis/:id` | 取得單一 RFI 完整詳情 (包含回覆歷程) |
| `POST` | `/api/v1/rfis/:id/response` | 審查顧問提交正式官方回覆 |
| `POST` | `/api/v1/rfis/:id/status` | 更新 RFI 生命週期狀態 |

### AI 工程分析與附件上傳
| 方法 | 端點路徑 | 說明 |
| :--- | :--- | :--- |
| `POST` | `/api/v1/ai/analyze-rfi` | 呼叫 Gemini 進行專業工程技術解析、工期成本影響評估與草擬回覆 |
| `POST` | `/api/v1/upload` | 上傳 Base64 圖檔附件 |

### 通知與活動軌跡
| 方法 | 端點路徑 | 說明 |
| :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | 取得目前使用者的通知列表 |
| `PUT` | `/api/v1/notifications/:id/read`| 標記單筆通知已讀 |
| `PUT` | `/api/v1/notifications/read-all`| 標記所有通知已讀 |
| `GET` | `/api/v1/activities` | 取得專案審計活動日誌 |

---

## 6.2 核心 TypeScript 型別定義 (`src/types.ts`)

```typescript
export type UserRole = 'SUPER_ADMIN' | 'PM' | 'MEMBER' | 'REVIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  title: string;
  department: string;
  avatar_url?: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  created_at: string;
  manager_id: string;
}

export interface Task {
  id: string;
  task_code: string;
  project_id: string;
  column_id: string;
  title: string;
  description: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  position: number;
  start_date?: string;
  due_date?: string;
  assignee_id?: string;
  assignee?: User;
  collaborator_ids?: string[];
  tags: string[];
  attachments?: Attachment[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type RFIStatus = 'SUBMITTED' | 'IN_REVIEW' | 'ANSWERED' | 'CLOSED';

export interface RFI {
  id: string;
  project_id: string;
  rfi_number: string;
  title: string;
  question: string;
  status: RFIStatus;
  drawing_ref?: string;
  spec_ref?: string;
  schedule_impact: boolean;
  schedule_days?: number;
  cost_impact: boolean;
  cost_amount?: number;
  due_date: string;
  requested_by: string;
  requested_by_name: string;
  requested_by_dept?: string;
  assigned_to: string;
  assigned_to_name: string;
  assigned_to_dept?: string;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
  responses?: RFIResponse[];
}
```
