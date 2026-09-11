import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize server-side Gemini client lazily or when key is present
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// In-Memory Database seed data matching ER Model
const USERS = [
  {
    id: 'usr-1',
    email: 'admin@reiarchitect.com',
    name: '林系統管理員 (Admin)',
    role: 'SUPER_ADMIN',
    title: '首席系統架構師',
    department: '專案技術總處',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-2',
    email: 'pm.lee@reiarchitect.com',
    name: '李專案經理 (PM)',
    role: 'PM',
    title: '資深專案經理',
    department: '廠務機電統包處',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-3',
    email: 'chang.eng@reiarchitect.com',
    name: '張工程師 (Member)',
    role: 'MEMBER',
    title: '機電結構主任工程師',
    department: '配管與動力組',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-4',
    email: 'wang.consultant@partner.com',
    name: '王顧問 (Reviewer)',
    role: 'REVIEWER',
    title: '業主代表 / 監造設計專案顧問',
    department: '工程顧問審查委員會',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-5',
    email: 'chen.qa@reiarchitect.com',
    name: '陳品質工程師',
    role: 'MEMBER',
    title: '品保與安全工程師',
    department: '品管安衛部',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  },
];

let currentUser = USERS[1]; // Default logged in as 李專案經理 (PM)

const PROJECTS = [
  {
    id: 'prj-1',
    code: 'PRJ-TECH',
    name: '高科技廠房機電統包與潔淨室擴建工程',
    description: '12吋晶圓廠二期擴充案之機電整合、高低壓動力配電、給排水及製程排氣系統統包工程。',
    created_at: '2026-01-15T08:00:00Z',
    manager_id: 'usr-2',
  },
  {
    id: 'prj-2',
    code: 'PRJ-HVAC',
    name: '智慧研發大樓綠建築 HVAC 監控系統工程',
    description: '智慧研發總部大樓能源管理自動化控制與低噪音冰水主機系統工程。',
    created_at: '2026-03-01T09:00:00Z',
    manager_id: 'usr-2',
  },
];

let KANBAN_COLUMNS = [
  { id: 'col-1', project_id: 'prj-1', title: '待處理 (To Do)', position: 0, color: '#64748b' },
  { id: 'col-2', project_id: 'prj-1', title: '進行中 (In Progress)', position: 1, color: '#2563eb' },
  { id: 'col-3', project_id: 'prj-1', title: '待審核 (Under Review)', position: 2, color: '#d97706' },
  { id: 'col-4', project_id: 'prj-1', title: '已完成 (Done)', position: 3, color: '#16a34a', is_done: true },
  { id: 'col-5', project_id: 'prj-2', title: '待處理 (To Do)', position: 0, color: '#64748b' },
  { id: 'col-6', project_id: 'prj-2', title: '施工安裝 (In Progress)', position: 1, color: '#2563eb' },
  { id: 'col-7', project_id: 'prj-2', title: '測試運轉 (Testing)', position: 2, color: '#d97706' },
  { id: 'col-8', project_id: 'prj-2', title: '驗收結案 (Completed)', position: 3, color: '#16a34a', is_done: true },
];

let ATTACHMENTS = [
  {
    id: 'att-1',
    target_type: 'TASK',
    target_id: 'tsk-1',
    file_name: 'Drawing_MEP_L3_Section_RevC.png',
    file_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80',
    file_size: 2458900,
    mime_type: 'image/png',
    uploaded_by: 'usr-3',
    uploaded_by_name: '張工程師',
    created_at: '2026-09-02T10:15:00Z',
  },
  {
    id: 'att-2',
    target_type: 'RFI',
    target_id: 'rfi-1',
    file_name: 'E-302-A_Power_Distribution_Conflict.png',
    file_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    file_size: 3892100,
    mime_type: 'image/png',
    uploaded_by: 'usr-3',
    uploaded_by_name: '張工程師',
    created_at: '2026-09-04T14:20:00Z',
  },
  {
    id: 'att-3',
    target_type: 'RFI',
    target_id: 'rfi-2',
    file_name: 'HVAC_Duct_Cleanroom_Interference.png',
    file_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
    file_size: 1980000,
    mime_type: 'image/png',
    uploaded_by: 'usr-2',
    uploaded_by_name: '李專案經理',
    created_at: '2026-09-05T09:30:00Z',
  },
];

let TASKS = [
  {
    id: 'tsk-1',
    task_code: 'TSK-101',
    project_id: 'prj-1',
    column_id: 'col-1',
    title: '3F 無塵室主回風管線與高壓電纜架干涉套圖檢討',
    description: '現場雷射掃描點雲顯示，3F Grid C-4 區域回風主管路（標高 EL+4200）與主幹高壓電纜架（EL+4150）淨距小於規範規定之 200mm，需重新套圖並確認管路走向。',
    priority: 'HIGH',
    position: 0,
    start_date: '2026-09-08',
    due_date: '2026-09-18',
    assignee_id: 'usr-3',
    collaborator_ids: ['usr-2', 'usr-5'],
    tags: ['BIM套圖', '管線干涉', '3F潔淨室'],
    created_by: 'usr-2',
    created_at: '2026-09-08T08:30:00Z',
    updated_at: '2026-09-08T08:30:00Z',
  },
  {
    id: 'tsk-2',
    task_code: 'TSK-102',
    project_id: 'prj-1',
    column_id: 'col-1',
    title: '消防排煙風門連動訊號電纜佈線清單校核',
    description: '依據最新修正之消防技師審定圖，核對防煙區劃 1 至 4 之風門復歸與連動監控接點數，出具材料送審單與放線清冊。',
    priority: 'MEDIUM',
    position: 1,
    start_date: '2026-09-10',
    due_date: '2026-09-22',
    assignee_id: 'usr-5',
    collaborator_ids: ['usr-3'],
    tags: ['消防弱電', '圖面校對'],
    created_by: 'usr-2',
    created_at: '2026-09-09T09:00:00Z',
    updated_at: '2026-09-09T09:00:00Z',
  },
  {
    id: 'tsk-3',
    task_code: 'TSK-103',
    project_id: 'prj-1',
    column_id: 'col-2',
    title: '配電盤二次側盤內配線耐壓測試與絕緣阻抗量測',
    description: '進行 1F 變電站 MCC-01 及 MCC-02 配電盤出線絕緣測試，由品質安衛組陳工程師全程見證記錄。',
    priority: 'URGENT',
    position: 0,
    start_date: '2026-09-05',
    due_date: '2026-09-15',
    assignee_id: 'usr-3',
    collaborator_ids: ['usr-5'],
    tags: ['高低壓配電', '耐壓測試', '現場施工'],
    created_by: 'usr-2',
    created_at: '2026-09-05T10:00:00Z',
    updated_at: '2026-09-07T14:30:00Z',
  },
  {
    id: 'tsk-4',
    task_code: 'TSK-104',
    project_id: 'prj-1',
    column_id: 'col-3',
    title: '冰水主機冷媒管路探傷檢驗報告審查 (NDT)',
    description: '非破壞性探傷檢驗報告 (X-Ray / 超音波檢測) 承包商已提交，正由王顧問與監造單位進行審查中。',
    priority: 'HIGH',
    position: 0,
    start_date: '2026-09-01',
    due_date: '2026-09-12',
    assignee_id: 'usr-4',
    collaborator_ids: ['usr-2'],
    tags: ['品管送審', '顧問審查', '冰水系統'],
    created_by: 'usr-3',
    created_at: '2026-09-01T11:00:00Z',
    updated_at: '2026-09-06T16:00:00Z',
  },
  {
    id: 'tsk-5',
    task_code: 'TSK-105',
    project_id: 'prj-1',
    column_id: 'col-4',
    title: '廠房基礎接地網電阻量測驗收 (數值小於 0.5Ω 符合規程)',
    description: '全區共同接地網 12 處測試點量測完畢，實測平均 0.32 歐姆，業主代表及監造工程司已簽認完成。',
    priority: 'LOW',
    position: 0,
    start_date: '2026-08-20',
    due_date: '2026-08-30',
    assignee_id: 'usr-2',
    collaborator_ids: ['usr-3', 'usr-4'],
    tags: ['接地系統', '已驗收'],
    created_by: 'usr-2',
    created_at: '2026-08-20T08:00:00Z',
    updated_at: '2026-08-30T17:00:00Z',
  },
];

let RFIS = [
  {
    id: 'rfi-1',
    project_id: 'prj-1',
    rfi_number: 'PRJ-TECH-RFI-2026-0001',
    title: 'B棟變電室低壓配電盤出線電纜徑與斷路器端子座孔徑不符疑義',
    question: `在現場施作 380V 低壓配電盤 (Panel LP-2B) 之主幹線接線作業時，發現設計圖面指定之電纜規格為 500MCM (約 253mm²)，惟設備製造商交付之 800A 空氣斷路器 (ACB) 端子壓接孔最大僅容納 300MCM 或需使用專用過渡端子銅排。
請確認：
1. 是否同意改採 2x250MCM 雙併電纜替代，抑或提供特定廠牌之擴充轉接端子？
2. 雙併線若採套管敷設，導線管徑由 4" 變更為 2x3" 是否需重新出具壓降計算書？`,
    status: 'ANSWERED',
    drawing_ref: 'E-302-A 機房動力配電平面圖 Rev.2',
    spec_ref: '施工規範 第 16120 節「600V 以下導線與電纜」第 2.1 條',
    schedule_impact: false,
    schedule_days: 0,
    cost_impact: true,
    cost_amount: 35000,
    due_date: '2026-09-14T00:00:00Z',
    requested_by: 'usr-3',
    requested_by_name: '張工程師',
    requested_by_dept: '配管與動力組',
    assigned_to: 'usr-4',
    assigned_to_name: '王顧問',
    assigned_to_dept: '工程顧問審查委員會',
    official_response: `經電機技師核算：
1. 同意現場採用原廠認證之過渡延伸銅排組件 (Part No. ACB-800-TB500) 銜接 500MCM 電纜，無須破壞盤內安全防護隔板。追加之端子零件費用由統包商提報實作實算。
2. 經核算此配置短路容量強度與溫升皆在 IEC 61439-2 規範允許範圍內，不影響主要交期。`,
    responder_id: 'usr-4',
    responder_name: '王顧問',
    responded_at: '2026-09-09T16:20:00Z',
    created_at: '2026-09-04T10:00:00Z',
    updated_at: '2026-09-09T16:20:00Z',
  },
  {
    id: 'rfi-2',
    project_id: 'prj-1',
    rfi_number: 'PRJ-TECH-RFI-2026-0002',
    title: '3F 潔淨室 Class 1000 區高架地板支柱避讓與回風預留孔位牴觸',
    question: `依建築結構平面圖 A-205 與機電空調平面圖 M-301：
潔淨室高架地板完成面高 600mm，其主支撐鋼架 (Pedestal Grid 600x600) 於軸線 X8-Y4 處恰與 400x400 特殊氣體二次排氣底座回風預留孔重疊。現場若直接鋸切地板支柱將導致局部承載力不足（規範要求集中載重需達 450kgf）。
建請建築師與結構技師指示：
1. 是否可將回風孔向西側平移 150mm？
2. 若不可平移，是否採用雙副梁補強跨越該排氣孔？`,
    status: 'IN_REVIEW',
    drawing_ref: 'M-301 空調回風管路圖 / A-205 潔淨室高架地板放樣圖',
    spec_ref: '特訂條款 潔淨室內裝高架地板承載標準 09690-3.4',
    schedule_impact: true,
    schedule_days: 3,
    cost_impact: true,
    cost_amount: 18000,
    due_date: '2026-09-16T00:00:00Z',
    requested_by: 'usr-2',
    requested_by_name: '李專案經理',
    requested_by_dept: '廠務機電統包處',
    assigned_to: 'usr-4',
    assigned_to_name: '王顧問',
    assigned_to_dept: '工程顧問審查委員會',
    created_at: '2026-09-06T11:30:00Z',
    updated_at: '2026-09-07T09:15:00Z',
  },
  {
    id: 'rfi-3',
    project_id: 'prj-1',
    rfi_number: 'PRJ-TECH-RFI-2026-0003',
    title: '緊急發電機冷卻水回水管減震防震接頭材質耐溫等級確認',
    question: `設計規範書第 15250 節註記防震橡膠軟管需耐溫 120°C，但發電機散熱器出口在滿載運轉測試時之最高水溫設計值為 115°C，安全裕度偏低。詢問是否可提升規格為不銹鋼波紋金屬軟管 (SUS316 double braided) 以確保高溫運轉下無爆管洩漏之虞？`,
    status: 'SUBMITTED',
    drawing_ref: 'M-112 緊急發電機房冷卻管路系統圖',
    spec_ref: '一般機電規範 第 15250 條「減震與避震裝置」',
    schedule_impact: false,
    schedule_days: 0,
    cost_impact: true,
    cost_amount: 12000,
    due_date: '2026-09-18T00:00:00Z',
    requested_by: 'usr-3',
    requested_by_name: '張工程師',
    requested_by_dept: '配管與動力組',
    assigned_to: 'usr-4',
    assigned_to_name: '王顧問',
    assigned_to_dept: '工程顧問審查委員會',
    created_at: '2026-09-09T14:00:00Z',
    updated_at: '2026-09-09T14:00:00Z',
  },
];

let RFI_RESPONSES = [
  {
    id: 'resp-1',
    rfi_id: 'rfi-1',
    responder_id: 'usr-4',
    responder_name: '王顧問',
    responder_title: '監造設計專案顧問',
    content: '經電機技師核算：同意採用原廠過渡銅排配件。請承包商於施工前提供廠商品質證明書，並於配盤完成後執行絕緣阻抗試驗紀錄備查。',
    official: true,
    created_at: '2026-09-09T16:20:00Z',
  },
];

let NOTIFICATIONS = [
  {
    id: 'notif-1',
    user_id: 'usr-2',
    title: 'RFI 官方回覆通知',
    message: '王顧問 已正式回覆 RFI [PRJ-TECH-RFI-2026-0001]：低壓配電盤出線電纜徑疑義。',
    type: 'RFI_ANSWERED',
    target_id: 'rfi-1',
    target_type: 'RFI',
    read: false,
    created_at: '2026-09-09T16:21:00Z',
  },
  {
    id: 'notif-2',
    user_id: 'usr-3',
    title: '任務指派通知',
    message: '李專案經理 將任務 [TSK-103 配電盤二次側耐壓測試] 指派給您。',
    type: 'TASK_ASSIGNED',
    target_id: 'tsk-3',
    target_type: 'TASK',
    read: true,
    created_at: '2026-09-05T10:05:00Z',
  },
  {
    id: 'notif-3',
    user_id: 'usr-4',
    title: '新工程 RFI 提請審查',
    message: '張工程師 提交了新疑義 [PRJ-TECH-RFI-2026-0003]：緊急發電機冷卻水回水管減震接頭確認。',
    type: 'RFI_SUBMITTED',
    target_id: 'rfi-3',
    target_type: 'RFI',
    read: false,
    created_at: '2026-09-09T14:02:00Z',
  },
];

let ACTIVITIES = [
  {
    id: 'act-1',
    project_id: 'prj-1',
    user_id: 'usr-4',
    user_name: '王顧問',
    action: '回覆並簽核了 RFI',
    target_title: 'PRJ-TECH-RFI-2026-0001 低壓配電盤出線電纜徑疑義',
    target_type: 'RFI',
    created_at: '2026-09-09T16:20:00Z',
  },
  {
    id: 'act-2',
    project_id: 'prj-1',
    user_id: 'usr-3',
    user_name: '張工程師',
    action: '建立了新工程疑義單',
    target_title: 'PRJ-TECH-RFI-2026-0003 緊急發電機冷卻水接頭確認',
    target_type: 'RFI',
    created_at: '2026-09-09T14:00:00Z',
  },
  {
    id: 'act-3',
    project_id: 'prj-1',
    user_id: 'usr-2',
    user_name: '李專案經理',
    action: '將任務狀態推進至已完成',
    target_title: 'TSK-105 廠房基礎接地網電阻量測驗收',
    target_type: 'TASK',
    created_at: '2026-08-30T17:00:00Z',
  },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ==================== RESTful API Routes ====================

  // --- Auth & Users ---
  app.get('/api/v1/auth/me', (req, res) => {
    res.json({
      user: currentUser,
      available_users: USERS,
    });
  });

  const handleSwitchOrLogin = (req: express.Request, res: express.Response) => {
    const { userId } = req.body;
    const found = USERS.find((u) => u.id === userId);
    if (found) {
      currentUser = found;
      res.json({ success: true, user: currentUser, token: `mock-jwt-token-${currentUser.id}` });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  };

  app.post('/api/v1/auth/login', handleSwitchOrLogin);
  app.post('/api/v1/auth/switch-user', handleSwitchOrLogin);

  app.get('/api/v1/users', (req, res) => {
    res.json({ users: USERS });
  });

  // --- Projects ---
  app.get('/api/v1/projects', (req, res) => {
    res.json({ projects: PROJECTS });
  });

  app.post('/api/v1/projects', (req, res) => {
    const { code, name, description } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: '專案代號與名稱為必填項目' });
    }
    const newProject = {
      id: `prj-${Date.now()}`,
      code: code.toUpperCase().trim(),
      name,
      description: description || '',
      created_at: new Date().toISOString(),
      manager_id: currentUser.id,
    };
    PROJECTS.push(newProject);

    // Create default columns for new project
    const defaultCols = [
      { id: `col-${Date.now()}-1`, project_id: newProject.id, title: '待處理 (To Do)', position: 0, color: '#64748b' },
      { id: `col-${Date.now()}-2`, project_id: newProject.id, title: '進行中 (In Progress)', position: 1, color: '#2563eb' },
      { id: `col-${Date.now()}-3`, project_id: newProject.id, title: '待審核 (Under Review)', position: 2, color: '#d97706' },
      { id: `col-${Date.now()}-4`, project_id: newProject.id, title: '已完成 (Done)', position: 3, color: '#16a34a', is_done: true },
    ];
    KANBAN_COLUMNS.push(...defaultCols);

    res.status(201).json({ project: newProject });
  });

  // --- Kanban Board & Columns ---
  app.get('/api/v1/kanban/columns', (req, res) => {
    res.json({ columns: KANBAN_COLUMNS.sort((a, b) => a.position - b.position) });
  });

  app.post('/api/v1/kanban/columns', (req, res) => {
    const { title, color, project_id } = req.body;
    if (!title) {
      return res.status(400).json({ error: '欄位標題為必填' });
    }
    const projId = project_id || (PROJECTS[0] ? PROJECTS[0].id : 'prj-1');
    const currentCols = KANBAN_COLUMNS.filter((c) => c.project_id === projId);
    const newCol = {
      id: `col-${Date.now()}`,
      project_id: projId,
      title,
      color: color || '#3b82f6',
      position: currentCols.length,
    };
    KANBAN_COLUMNS.push(newCol);
    res.status(201).json({ column: newCol });
  });

  const handleDeleteColumn = (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const tasksInCol = TASKS.filter((t) => t.column_id === id);
    if (tasksInCol.length > 0) {
      return res.status(400).json({ error: '此欄位仍有任務卡片，請先移出卡片後再行刪除' });
    }
    KANBAN_COLUMNS = KANBAN_COLUMNS.filter((c) => c.id !== id);
    res.json({ success: true });
  };

  app.delete('/api/v1/kanban/columns/:id', handleDeleteColumn);
  app.delete('/api/v1/columns/:id', handleDeleteColumn);

  // --- Kanban Tasks ---
  const handleGetTasks = (req: express.Request, res: express.Response) => {
    const enriched = TASKS.map((task) => {
      const attachments = ATTACHMENTS.filter((a) => a.target_type === 'TASK' && a.target_id === task.id);
      return {
        ...task,
        attachments,
        assignee: USERS.find((u) => u.id === task.assignee_id),
      };
    });
    res.json({ tasks: enriched });
  };

  app.get('/api/v1/kanban/tasks', handleGetTasks);
  app.get('/api/v1/tasks', handleGetTasks);

  const handleCreateTask = (req: express.Request, res: express.Response) => {
    const { project_id, column_id, title, description, priority, due_date, start_date, assignee_id, collaborator_ids, tags } = req.body;
    const projId = project_id || (PROJECTS[0] ? PROJECTS[0].id : 'prj-1');
    const colId = column_id || (KANBAN_COLUMNS[0] ? KANBAN_COLUMNS[0].id : 'col-1');
    const taskCount = TASKS.length + 1;
    const task_code = `TSK-${String(taskCount).padStart(3, '0')}`;

    const newTask = {
      id: `tsk-${Date.now()}`,
      task_code,
      project_id: projId,
      column_id: colId,
      title: title || '未命名任務',
      description: description || '',
      priority: priority || 'MEDIUM',
      position: 0,
      start_date,
      due_date,
      assignee_id: assignee_id || currentUser.id,
      collaborator_ids: collaborator_ids || [],
      tags: tags || [],
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attachments: [],
    };
    TASKS.unshift(newTask);

    if (assignee_id && assignee_id !== currentUser.id) {
      NOTIFICATIONS.unshift({
        id: `notif-${Date.now()}`,
        user_id: assignee_id,
        title: '新任務指派通知',
        message: `${currentUser.name} 將任務 [${task_code} ${newTask.title}] 指派給您。`,
        type: 'TASK_ASSIGNED',
        target_id: newTask.id,
        target_type: 'TASK',
        read: false,
        created_at: new Date().toISOString(),
      });
    }

    ACTIVITIES.unshift({
      id: `act-${Date.now()}`,
      project_id: projId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action: '建立了新任務',
      target_title: `${task_code} ${newTask.title}`,
      target_type: 'TASK',
      created_at: new Date().toISOString(),
    });

    res.status(201).json({ task: newTask });
  };

  app.post('/api/v1/kanban/tasks', handleCreateTask);
  app.post('/api/v1/tasks', handleCreateTask);

  const handleMoveTask = (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { column_id, target_column_id, position, target_position } = req.body;
    const col = column_id || target_column_id;
    const taskIndex = TASKS.findIndex((t) => t.id === id);
    if (taskIndex === -1) {
      return res.status(404).json({ error: '任務不存在' });
    }

    if (col) {
      TASKS[taskIndex].column_id = col;
    }
    const pos = typeof position === 'number' ? position : target_position;
    if (typeof pos === 'number') {
      TASKS[taskIndex].position = pos;
    }
    TASKS[taskIndex].updated_at = new Date().toISOString();

    const colObj = KANBAN_COLUMNS.find((c) => c.id === TASKS[taskIndex].column_id);
    ACTIVITIES.unshift({
      id: `act-${Date.now()}`,
      project_id: TASKS[taskIndex].project_id,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action: `將任務移至 [${colObj ? colObj.title : '新泳道'}]`,
      target_title: `${TASKS[taskIndex].task_code} ${TASKS[taskIndex].title}`,
      target_type: 'TASK',
      created_at: new Date().toISOString(),
    });

    const attachments = ATTACHMENTS.filter((a) => a.target_type === 'TASK' && a.target_id === id);
    res.json({ success: true, task: { ...TASKS[taskIndex], attachments } });
  };

  app.put('/api/v1/kanban/tasks/:id/move', handleMoveTask);
  app.patch('/api/v1/kanban/tasks/:id/move', handleMoveTask);
  app.put('/api/v1/tasks/:id/move', handleMoveTask);
  app.patch('/api/v1/tasks/:id/move', handleMoveTask);

  const handleUpdateTask = (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const taskIndex = TASKS.findIndex((t) => t.id === id);
    if (taskIndex === -1) {
      return res.status(404).json({ error: '任務不存在' });
    }

    const updates = req.body;
    delete updates.id;
    delete updates.task_code;
    delete updates.created_at;

    TASKS[taskIndex] = {
      ...TASKS[taskIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const attachments = ATTACHMENTS.filter((a) => a.target_type === 'TASK' && a.target_id === id);
    res.json({ task: { ...TASKS[taskIndex], attachments } });
  };

  app.put('/api/v1/kanban/tasks/:id', handleUpdateTask);
  app.patch('/api/v1/kanban/tasks/:id', handleUpdateTask);
  app.put('/api/v1/tasks/:id', handleUpdateTask);
  app.patch('/api/v1/tasks/:id', handleUpdateTask);

  const handleDeleteTask = (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    TASKS = TASKS.filter((t) => t.id !== id);
    ATTACHMENTS = ATTACHMENTS.filter((a) => !(a.target_type === 'TASK' && a.target_id === id));
    res.json({ success: true });
  };

  app.delete('/api/v1/kanban/tasks/:id', handleDeleteTask);
  app.delete('/api/v1/tasks/:id', handleDeleteTask);

  // --- RFI Management ---
  const handleGetRFIs = (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { status, requester_id, assigned_to, search } = req.query;

    let list = id ? RFIS.filter((r) => r.project_id === id) : RFIS;

    if (status && status !== 'ALL') {
      list = list.filter((r) => r.status === status);
    }
    if (requester_id) {
      list = list.filter((r) => r.requested_by === requester_id);
    }
    if (assigned_to) {
      list = list.filter((r) => r.assigned_to === assigned_to);
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (r) =>
          r.rfi_number.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.question.toLowerCase().includes(q) ||
          (r.drawing_ref && r.drawing_ref.toLowerCase().includes(q))
      );
    }

    const enriched = list.map((rfi) => {
      const attachments = ATTACHMENTS.filter((a) => a.target_type === 'RFI' && a.target_id === rfi.id);
      const responses = RFI_RESPONSES.filter((resp) => resp.rfi_id === rfi.id);
      return {
        ...rfi,
        attachments,
        responses,
        requested_user: USERS.find((u) => u.id === rfi.requested_by),
        assigned_user: USERS.find((u) => u.id === rfi.assigned_to),
      };
    });

    res.json({ rfis: enriched });
  };

  app.get('/api/v1/rfis', handleGetRFIs);
  app.get('/api/v1/projects/:id/rfis', handleGetRFIs);

  // Create RFI with automated numbering {PROJECT_CODE}-RFI-{YEAR}-{0001}
  const handleCreateRFI = (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { title, question, drawing_ref, spec_ref, schedule_impact, schedule_days, cost_impact, cost_amount, due_date, assigned_to, attachments, project_id } = req.body;

    if (!title || !question) {
      return res.status(400).json({ error: 'RFI 標題與提問內容為必填' });
    }

    const targetProjId = project_id || id || (PROJECTS[0] ? PROJECTS[0].id : 'prj-1');
    const project = PROJECTS.find((p) => p.id === targetProjId) || { code: 'PRJ' };
    const currentYear = new Date().getFullYear();
    const existingCount = RFIS.length + 1;
    const rfi_number = `${project.code}-RFI-${currentYear}-${String(existingCount).padStart(4, '0')}`;

    const assignedUser = USERS.find((u) => u.id === assigned_to) || USERS[3] || USERS[0];

    const newRFI = {
      id: `rfi-${Date.now()}`,
      project_id: targetProjId,
      rfi_number,
      title,
      question,
      status: 'SUBMITTED',
      drawing_ref: drawing_ref || '',
      spec_ref: spec_ref || '',
      schedule_impact: Boolean(schedule_impact),
      schedule_days: schedule_days ? Number(schedule_days) : 0,
      cost_impact: Boolean(cost_impact),
      cost_amount: cost_amount ? Number(cost_amount) : 0,
      due_date: due_date || new Date(Date.now() + 7 * 86400000).toISOString(),
      requested_by: currentUser.id,
      requested_by_name: currentUser.name,
      requested_by_dept: currentUser.department,
      assigned_to: assignedUser.id,
      assigned_to_name: assignedUser.name,
      assigned_to_dept: assignedUser.department,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attachments: [] as any[],
    };

    if (Array.isArray(attachments)) {
      attachments.forEach((att: any) => {
        const item = {
          id: att.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          target_type: 'RFI',
          target_id: newRFI.id,
          file_name: att.file_name,
          file_url: att.file_url,
          file_size: att.file_size || 1024,
          mime_type: att.mime_type || 'image/png',
          uploaded_by: currentUser.id,
          uploaded_by_name: currentUser.name,
          created_at: new Date().toISOString(),
        };
        ATTACHMENTS.push(item);
        newRFI.attachments.push(item);
      });
    }

    RFIS.unshift(newRFI);

    NOTIFICATIONS.unshift({
      id: `notif-${Date.now()}`,
      user_id: newRFI.assigned_to,
      title: '新 RFI 提問送審通知',
      message: `${currentUser.name} 提出了工程疑義 [${rfi_number} ${title}]，請查照並提供回覆。`,
      type: 'RFI_SUBMITTED',
      target_id: newRFI.id,
      target_type: 'RFI',
      read: false,
      created_at: new Date().toISOString(),
    });

    ACTIVITIES.unshift({
      id: `act-${Date.now()}`,
      project_id: targetProjId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action: '發起了新 RFI 疑義',
      target_title: `${rfi_number} ${title}`,
      target_type: 'RFI',
      created_at: new Date().toISOString(),
    });

    res.status(201).json({ rfi: newRFI });
  };

  app.post('/api/v1/rfis', handleCreateRFI);
  app.post('/api/v1/projects/:id/rfis', handleCreateRFI);

  app.get('/api/v1/rfis/:id', (req, res) => {
    const { id } = req.params;
    const rfi = RFIS.find((r) => r.id === id);
    if (!rfi) {
      return res.status(404).json({ error: 'RFI 記錄不存在' });
    }

    const attachments = ATTACHMENTS.filter((a) => a.target_id === id);
    const responses = RFI_RESPONSES.filter((r) => r.rfi_id === id);

    res.json({
      rfi: {
        ...rfi,
        attachments,
        responses,
        requested_user: USERS.find((u) => u.id === rfi.requested_by),
        assigned_user: USERS.find((u) => u.id === rfi.assigned_to),
      },
    });
  });

  // Submit Official Response to RFI
  const handleRFIResponse = (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { content, status, official = true } = req.body;
    if (!content) {
      return res.status(400).json({ error: '回覆內容不得為空' });
    }
    const rfiIndex = RFIS.findIndex((r) => r.id === id);
    if (rfiIndex === -1) {
      return res.status(404).json({ error: 'RFI 不存在' });
    }

    const newResponse = {
      id: `resp-${Date.now()}`,
      rfi_id: id,
      responder_id: currentUser.id,
      responder_name: currentUser.name,
      responder_title: currentUser.title,
      content,
      official: Boolean(official),
      created_at: new Date().toISOString(),
    };
    RFI_RESPONSES.push(newResponse);

    RFIS[rfiIndex].status = status || 'ANSWERED';
    RFIS[rfiIndex].official_response = content;
    RFIS[rfiIndex].responder_id = currentUser.id;
    RFIS[rfiIndex].responder_name = currentUser.name;
    RFIS[rfiIndex].responded_at = new Date().toISOString();
    RFIS[rfiIndex].updated_at = new Date().toISOString();

    NOTIFICATIONS.unshift({
      id: `notif-${Date.now()}`,
      user_id: RFIS[rfiIndex].requested_by,
      title: 'RFI 官方回覆通知',
      message: `${currentUser.name} 已正式回覆 RFI [${RFIS[rfiIndex].rfi_number}]。`,
      type: 'RFI_ANSWERED',
      target_id: id,
      target_type: 'RFI',
      read: false,
      created_at: new Date().toISOString(),
    });

    ACTIVITIES.unshift({
      id: `act-${Date.now()}`,
      project_id: RFIS[rfiIndex].project_id,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action: '提交了官方正式回覆',
      target_title: `${RFIS[rfiIndex].rfi_number} ${RFIS[rfiIndex].title}`,
      target_type: 'RFI',
      created_at: new Date().toISOString(),
    });

    const attachments = ATTACHMENTS.filter((a) => a.target_id === id);
    res.status(201).json({ rfi: { ...RFIS[rfiIndex], attachments } });
  };

  app.post('/api/v1/rfis/:id/response', handleRFIResponse);
  app.post('/api/v1/rfis/:id/responses', handleRFIResponse);

  // Update RFI status (e.g. IN_REVIEW, CLOSED, CLARIFICATION_REQUIRED)
  const handleUpdateRFIStatus = (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const rfiIndex = RFIS.findIndex((r) => r.id === id);
    if (rfiIndex === -1) {
      return res.status(404).json({ error: 'RFI 不存在' });
    }

    // Role check: Only PM or Super Admin can close RFI
    if (status === 'CLOSED' && !['SUPER_ADMIN', 'PM'].includes(currentUser.role)) {
      return res.status(403).json({ error: '權限不足：僅專案經理 (PM) 或系統管理員可執行 RFI 核准結案' });
    }

    RFIS[rfiIndex].status = status;
    RFIS[rfiIndex].updated_at = new Date().toISOString();

    ACTIVITIES.unshift({
      id: `act-${Date.now()}`,
      project_id: RFIS[rfiIndex].project_id,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action: `更新狀態為 [${status}]`,
      target_title: `${RFIS[rfiIndex].rfi_number} ${RFIS[rfiIndex].title}`,
      target_type: 'RFI',
      created_at: new Date().toISOString(),
    });

    const attachments = ATTACHMENTS.filter((a) => a.target_id === id);
    res.json({ rfi: { ...RFIS[rfiIndex], attachments } });
  };

  app.patch('/api/v1/rfis/:id/status', handleUpdateRFIStatus);
  app.put('/api/v1/rfis/:id/status', handleUpdateRFIStatus);

  // --- Upload & Clipboard Paste API ---
  // Section 5.4: POST /api/v1/upload
  app.post('/api/v1/upload', (req, res) => {
    try {
      const { dataUrl, fileName, mimeType, target_type, target_id } = req.body;
      const file_id = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const fallbackName = `clipboard-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.png`;
      const finalFileName = fileName || fallbackName;
      const finalMime = mimeType || 'image/png';

      // Use the provided dataUrl or a simulated secure asset URL
      const finalUrl = dataUrl || `https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80`;

      const newAttachment = {
        id: file_id,
        target_type: target_type || 'TASK',
        target_id: target_id || 'unassigned',
        file_name: finalFileName,
        file_url: finalUrl,
        file_size: dataUrl ? Math.round(dataUrl.length * 0.75) : 1024 * 350,
        mime_type: finalMime,
        uploaded_by: currentUser.id,
        uploaded_by_name: currentUser.name,
        created_at: new Date().toISOString(),
      };

      if (target_id && target_id !== 'unassigned') {
        ATTACHMENTS.push(newAttachment);
      }

      res.status(201).json({
        file_id: newAttachment.id,
        url: newAttachment.file_url,
        file_name: newAttachment.file_name,
        mime_type: newAttachment.mime_type,
        file_size: newAttachment.file_size,
        attachment: newAttachment,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || '上傳失敗' });
    }
  });

  // --- Milestone 4: Gemini AI Engineering Assistant ---
  // Analyzes drawings, engineering conflicts, codes, and drafts RFI official response
  app.post('/api/v1/ai/analyze-rfi', async (req, res) => {
    try {
      const { title, question, drawing_ref, spec_ref, imageBase64, imageMime } = req.body;

      const ai = getAI();
      if (!ai) {
        // Fallback intelligent engineering analysis when API key is not configured yet
        return res.json({
          analysis: `【工程疑義深度解析 (模擬評估模式)】
1. 技術關鍵點檢討：
- 圖面與規範關聯性：針對「${drawing_ref || '工程施工圖'}」與「${spec_ref || '工程合約技術規範'}」，現場施作干涉應以主設備運轉安全為最高準則。
- 物理空間/材料規格衝突：提問「${title}」涉及之管件/電纜/設備承載，需查核短路容量、動態溫升及施工淨距（至少大於等於 150mm 防護間隙）。

2. 工期與成本衝擊評估：
- 建議工期評估：預估若採原廠規格組件施工，對關鍵路徑（Critical Path）影響約 0~2 個工作天。
- 追加減成本評估：建議由承包商檢附合格出廠測試證明書與實作工料清冊核備。

3. 官方回覆草案建議：
「經機電設計顧問與技師查核相關送審型錄：
同意現場依原廠規範之專用轉接配件或路徑局部微調施作，承包商應於安裝後完成絕緣試驗與通水/通電負載測試，並將竣工照片附於查驗紀錄歸檔。」`,
          suggested_response: `經工程設計顧問與電機技師綜合查核：\n1. 考量現場既有空間與設備進場期程，同意採取現場提議之工法或原廠專屬過渡轉接組件施作。\n2. 承包商需於施作前出具符合 CNS / IEC 國際防護規範之第三方型式試驗證明，並於品管自主查驗表登載備查。追加金額請依契約實作實算計價。`,
          suggested_schedule_days: 2,
          suggested_cost_impact: true,
        });
      }

      const prompt = `您是一位具備 20 年高科技廠房與機電工程統包經驗的資深工程總監 (PE, Professional Engineer)。
請針對以下工程疑義 (Request For Information, RFI) 提供專業、嚴謹且符合國際工程規範的技術評估與建議：

專案/疑義標題: ${title}
關聯圖號: ${drawing_ref || '無特別標註'}
合約規範引用: ${spec_ref || '無特別標註'}
提問內容:
${question}

請以繁體中文 (Traditional Chinese) 輸出三個結構化段落：
1. 【工程技術問題解析與規範校核】：剖析根本肇因、結構或電氣安全標準、圖面衝突點。
2. 【工期與成本影響性評估】：說明是否影響關鍵工期、預估工期影響天數、追加減成本方向。
3. 【官方回覆建議 (Draft Official Response)】：產出一篇可直接由監造單位/業主顧問簽署發布的正式回覆草案，語氣專業嚴謹。`;

      let contents: any = prompt;
      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        contents = {
          parts: [
            {
              inlineData: {
                mimeType: imageMime || 'image/png',
                data: cleanBase64,
              },
            },
            {
              text: prompt + '\n（同時請仔細比對附圖中所呈現的管線走向、標註尺寸與空間干涉現場！）',
            },
          ],
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
      });

      const responseText = response.text || '';

      // Extract draft response if marked
      let suggested_response = '';
      if (responseText.includes('【官方回覆建議')) {
        suggested_response = responseText.split('【官方回覆建議')[1].replace(/^[^】]*】/g, '').trim();
      } else {
        suggested_response = responseText.slice(-300).trim();
      }

      res.json({
        analysis: responseText,
        suggested_response,
        suggested_schedule_days: responseText.includes('工期影響') ? 2 : 0,
        suggested_cost_impact: true,
      });
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      res.status(500).json({ error: err.message || 'AI 分析發生錯誤' });
    }
  });

  // --- Notifications ---
  app.get('/api/v1/notifications', (req, res) => {
    res.json({ notifications: NOTIFICATIONS });
  });

  const handleMarkNotificationRead = (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const n = NOTIFICATIONS.find((item) => item.id === id);
    if (n) {
      n.read = true;
      (n as any).is_read = true;
    }
    res.json({ success: true });
  };

  app.patch('/api/v1/notifications/:id/read', handleMarkNotificationRead);
  app.put('/api/v1/notifications/:id/read', handleMarkNotificationRead);

  const handleMarkAllNotificationsRead = (req: express.Request, res: express.Response) => {
    NOTIFICATIONS.forEach((n) => {
      n.read = true;
      (n as any).is_read = true;
    });
    res.json({ success: true });
  };

  app.patch('/api/v1/notifications/mark-all-read', handleMarkAllNotificationsRead);
  app.put('/api/v1/notifications/mark-all-read', handleMarkAllNotificationsRead);
  app.put('/api/v1/notifications/read-all', handleMarkAllNotificationsRead);

  // --- Activities ---
  const handleGetActivities = (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const list = id ? ACTIVITIES.filter((a) => a.project_id === id) : ACTIVITIES;
    res.json({ activities: list });
  };

  app.get('/api/v1/activities', handleGetActivities);
  app.get('/api/v1/projects/:id/activities', handleGetActivities);

  // ==================== Vite Middleware Setup ====================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
