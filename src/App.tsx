import React, { useState, useEffect } from 'react';
import {
  Kanban,
  FileQuestion,
  UserCheck,
  Bell,
  Plus,
  Layers,
  Search,
  ChevronDown,
  Shield,
  HelpCircle,
  ExternalLink,
  Briefcase,
  FolderKanban,
  CheckCircle2,
} from 'lucide-react';
import {
  Project,
  User,
  KanbanColumn,
  Task,
  RFI,
  Notification,
  ActivityLog,
  RFIStatus,
} from './types';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskModal } from './components/TaskModal';
import { RFITracker } from './components/RFITracker';
import { RFIDetailModal } from './components/RFIDetailModal';
import { NewRFIModal } from './components/NewRFIModal';
import { MyTasksDashboard } from './components/MyTasksDashboard';
import { NotificationCenter } from './components/NotificationCenter';
import { LightboxViewer } from './components/LightboxViewer';

export function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'kanban' | 'rfi' | 'my-tasks'>('kanban');

  // Core domain states
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Modals & Overlays
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [defaultTaskColId, setDefaultTaskColId] = useState<string | undefined>();
  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null);
  const [isNewRFIModalOpen, setIsNewRFIModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // Loading indicator
  const [isLoading, setIsLoading] = useState(true);

  const safeFetchJson = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Fetch ${url} returned status ${res.status}`);
        return null;
      }
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error(`Invalid JSON from ${url}:`, text.slice(0, 80));
        return null;
      }
    } catch (e) {
      console.error(`Network error on ${url}:`, e);
      return null;
    }
  };

  // 1. Initial Data Fetch
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [
        projData,
        usersData,
        curUserData,
        colsData,
        tasksData,
        rfisData,
        notifData,
        actData,
      ] = await Promise.all([
        safeFetchJson('/api/v1/projects'),
        safeFetchJson('/api/v1/users'),
        safeFetchJson('/api/v1/auth/me'),
        safeFetchJson('/api/v1/kanban/columns'),
        safeFetchJson('/api/v1/kanban/tasks'),
        safeFetchJson('/api/v1/rfis'),
        safeFetchJson('/api/v1/notifications'),
        safeFetchJson('/api/v1/activities'),
      ]);

      const projectList = Array.isArray(projData) ? projData : (projData?.projects || []);
      setProjects(projectList);
      if (projectList.length > 0) {
        setCurrentProject(projectList[0]);
      }
      const userList = Array.isArray(usersData) ? usersData : (usersData?.users || []);
      setUsers(userList);
      setCurrentUser(curUserData?.user || userList[0] || null);
      setColumns(Array.isArray(colsData) ? colsData : (colsData?.columns || []));
      setTasks(Array.isArray(tasksData) ? tasksData : (tasksData?.tasks || []));
      setRfis(Array.isArray(rfisData) ? rfisData : (rfisData?.rfis || []));
      setNotifications(Array.isArray(notifData) ? notifData : (notifData?.notifications || []));
      setActivities(Array.isArray(actData) ? actData : (actData?.activities || []));
    } catch (err) {
      console.error('資料加載失敗', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Switch Current User (RBAC demo)
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/v1/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error('切換使用者失敗', err);
    }
  };

  // Kanban Tasks Operations
  const handleMoveTask = async (taskId: string, targetColumnId: string, newPosition?: number) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, column_id: targetColumnId } : t))
    );

    try {
      await fetch(`/api/v1/kanban/tasks/${taskId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column_id: targetColumnId, position: newPosition }),
      });
      // Refresh activities
      const actRes = await fetch('/api/v1/activities').then((r) => r.json());
      setActivities(actRes.activities || []);
    } catch (err) {
      console.error('移動任務失敗', err);
      loadAllData(); // Rollback
    }
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      if (selectedTask && selectedTask.id) {
        // Update existing task
        const res = await fetch(`/api/v1/kanban/tasks/${selectedTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
        const data = await res.json();
        if (data.task) {
          setTasks((prev) => prev.map((t) => (t.id === data.task.id ? data.task : t)));
        }
      } else {
        // Create new task
        const res = await fetch('/api/v1/kanban/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...taskData,
            column_id: defaultTaskColId || columns[0]?.id,
          }),
        });
        const data = await res.json();
        if (data.task) {
          setTasks((prev) => [...prev, data.task]);
        }
      }

      // Refresh activity logs
      const actRes = await fetch('/api/v1/activities').then((r) => r.json());
      setActivities(actRes.activities || []);
      setSelectedTask(null);
      setIsCreatingTask(false);
    } catch (err) {
      console.error('儲存任務出錯', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/v1/kanban/tasks/${taskId}`, { method: 'DELETE' });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setSelectedTask(null);
    } catch (err) {
      console.error('刪除任務失敗', err);
    }
  };

  const handleAddColumn = async (title: string, color: string) => {
    try {
      const res = await fetch('/api/v1/kanban/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, color }),
      });
      const data = await res.json();
      if (data.column) {
        setColumns((prev) => [...prev, data.column]);
      }
    } catch (err) {
      console.error('建立泳道失敗', err);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      await fetch(`/api/v1/kanban/columns/${columnId}`, { method: 'DELETE' });
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
    } catch (err) {
      console.error('刪除泳道失敗', err);
    }
  };

  // RFI Operations
  const handleCreateRFI = async (rfiData: any) => {
    try {
      const res = await fetch('/api/v1/rfis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rfiData),
      });
      const data = await res.json();
      if (data.rfi) {
        setRfis((prev) => [data.rfi, ...prev]);
        // Refresh notifications & activities
        const [notifRes, actRes] = await Promise.all([
          fetch('/api/v1/notifications').then((r) => r.json()),
          fetch('/api/v1/activities').then((r) => r.json()),
        ]);
        setNotifications(notifRes.notifications || []);
        setActivities(actRes.activities || []);
      }
    } catch (err) {
      console.error('建立 RFI 失敗', err);
    }
  };

  const handleSubmitRFIResponse = async (rfiId: string, content: string, newStatus?: RFIStatus) => {
    try {
      const res = await fetch(`/api/v1/rfis/${rfiId}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, status: newStatus }),
      });
      const data = await res.json();
      if (data.rfi) {
        setRfis((prev) => prev.map((r) => (r.id === rfiId ? data.rfi : r)));
        if (selectedRFI?.id === rfiId) {
          setSelectedRFI(data.rfi);
        }
        const [notifRes, actRes] = await Promise.all([
          fetch('/api/v1/notifications').then((r) => r.json()),
          fetch('/api/v1/activities').then((r) => r.json()),
        ]);
        setNotifications(notifRes.notifications || []);
        setActivities(actRes.activities || []);
      }
    } catch (err) {
      console.error('送出 RFI 回覆失敗', err);
    }
  };

  const handleUpdateRFIStatus = async (rfiId: string, status: RFIStatus) => {
    try {
      const res = await fetch(`/api/v1/rfis/${rfiId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.rfi) {
        setRfis((prev) => prev.map((r) => (r.id === rfiId ? data.rfi : r)));
        if (selectedRFI?.id === rfiId) {
          setSelectedRFI(data.rfi);
        }
        const actRes = await fetch('/api/v1/activities').then((r) => r.json());
        setActivities(actRes.activities || []);
      }
    } catch (err) {
      console.error('更新狀態失敗', err);
    }
  };

  // Notifications
  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await fetch('/api/v1/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadNotificationCount = notifications.filter((n) => !n.is_read).length;
  const inReviewRFICount = rfis.filter(
    (r) => r.status === 'IN_REVIEW' || r.status === 'SUBMITTED'
  ).length;
  const myAssignedCount = currentUser
    ? tasks.filter((t) => t.assignee_id === currentUser.id).length
    : 0;

  if (isLoading || !currentUser || !currentProject) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0F] text-[#FAFAFA]">
        <div className="relative mb-4">
          <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 rounded-full blur-[10px] bg-amber-500/20 animate-pulse"></div>
        </div>
        <p className="font-display text-sm tracking-tight text-zinc-300">
          PRO-MAN & RFI
        </p>
        <p className="text-xs text-zinc-500 mt-1 font-mono">
          載入專案與工程疑義系統中...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F] text-[#FAFAFA] selection:bg-amber-500/30 selection:text-amber-200 relative overflow-x-hidden">
      {/* Ambient background glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-amber-500/[0.035] rounded-full blur-[130px]" />
        <div className="absolute top-1/3 -right-20 w-[450px] h-[450px] bg-amber-500/[0.025] rounded-full blur-[140px]" />
        <div className="absolute -bottom-20 left-1/3 w-[600px] h-[400px] bg-amber-500/[0.03] rounded-full blur-[150px]" />
      </div>

      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#12121A]/85 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Project Selector */}
          <div className="flex items-center space-x-4 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <FolderKanban className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-2">
                  <h1 className="font-display text-sm font-bold tracking-tight text-white leading-none">
                    PRO-MAN & RFI
                  </h1>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                </div>
                <span className="text-[10px] text-zinc-500 font-mono tracking-wide leading-tight">
                  ENGINEERING PORTAL
                </span>
              </div>
            </div>

            {/* Project Picker */}
            <div className="h-5 w-px bg-white/[0.08] hidden sm:block"></div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-zinc-500 hidden md:inline font-medium">專案:</span>
              <div className="font-medium text-zinc-200 bg-[#1A1A24]/80 border border-white/[0.08] px-3 py-1 rounded-lg flex items-center space-x-2 backdrop-blur-sm">
                <span className="max-w-[180px] truncate">{currentProject.name}</span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                  {currentProject.code}
                </span>
              </div>
            </div>
          </div>

          {/* Primary View Switcher Tabs */}
          <nav className="flex items-center space-x-1 bg-[#12121A] p-1 rounded-lg border border-white/[0.08]">
            <button
              id="nav-tab-kanban"
              type="button"
              onClick={() => setActiveTab('kanban')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'kanban'
                  ? 'bg-[#1A1A24] text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>敏捷看板</span>
              <span className="text-[10px] font-mono bg-white/[0.06] text-zinc-400 px-1.5 py-0.5 rounded-full">
                {tasks.length}
              </span>
            </button>

            <button
              id="nav-tab-rfi"
              type="button"
              onClick={() => setActiveTab('rfi')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'rfi'
                  ? 'bg-[#1A1A24] text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <FileQuestion className="w-3.5 h-3.5" />
              <span>RFI 疑義追蹤</span>
              {inReviewRFICount > 0 ? (
                <span className="text-[10px] font-mono bg-amber-500 text-[#0A0A0F] font-bold px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                  {inReviewRFICount}
                </span>
              ) : (
                <span className="text-[10px] font-mono bg-white/[0.06] text-zinc-400 px-1.5 py-0.5 rounded-full">
                  {rfis.length}
                </span>
              )}
            </button>

            <button
              id="nav-tab-my-tasks"
              type="button"
              onClick={() => setActiveTab('my-tasks')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'my-tasks'
                  ? 'bg-[#1A1A24] text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>個人工作台</span>
              {myAssignedCount > 0 && (
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold px-1.5 py-0.5 rounded-full">
                  {myAssignedCount}
                </span>
              )}
            </button>
          </nav>

          {/* User Role Switcher & Notifications */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Quick Notification Bell */}
            <button
              id="notification-bell-btn"
              type="button"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] rounded-lg transition-all"
              title="系統通知"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.9)] animate-pulse"></span>
              )}
            </button>

            {/* Role Switcher Dropdown (RBAC Simulator) */}
            <div className="flex items-center space-x-2 bg-[#1A1A24]/90 border border-white/[0.08] rounded-lg p-1.5 pr-3 backdrop-blur-sm">
              <img
                src={currentUser.avatar_url}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover border border-white/20"
              />
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-semibold text-zinc-200 leading-none">
                  {currentUser.name}
                </span>
                <select
                  id="user-role-switcher"
                  value={currentUser.id}
                  onChange={(e) => handleSwitchUser(e.target.value)}
                  className="text-[10px] text-amber-400 font-mono bg-[#1A1A24] border-none p-0 focus:outline-none cursor-pointer mt-0.5"
                  title="切換使用者身分以測試各角色權限"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[#12121A] text-zinc-200">
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 overflow-hidden flex flex-col">
        {activeTab === 'kanban' && (
          <KanbanBoard
            columns={columns}
            tasks={tasks}
            users={users}
            currentUser={currentUser}
            onMoveTask={handleMoveTask}
            onSelectTask={(task) => setSelectedTask(task)}
            onAddTask={(columnId) => {
              setDefaultTaskColId(columnId);
              setSelectedTask({
                id: '',
                project_id: currentProject.id,
                task_code: `TSK-${100 + tasks.length + 1}`,
                title: '',
                description: '',
                column_id: columnId || columns[0]?.id || '',
                position: tasks.length,
                priority: 'MEDIUM',
                assignee_id: currentUser.id,
                collaborator_ids: [],
                tags: ['施工'],
                attachments: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }}
            onAddColumn={handleAddColumn}
            onDeleteColumn={handleDeleteColumn}
            onPreviewImage={(url, title) => setLightboxImage({ url, title })}
          />
        )}

        {activeTab === 'rfi' && (
          <RFITracker
            rfis={rfis}
            users={users}
            currentUser={currentUser}
            onSelectRFI={(rfi) => setSelectedRFI(rfi)}
            onNewRFI={() => setIsNewRFIModalOpen(true)}
            onPreviewImage={(url, title) => setLightboxImage({ url, title })}
          />
        )}

        {activeTab === 'my-tasks' && (
          <MyTasksDashboard
            currentUser={currentUser}
            tasks={tasks}
            rfis={rfis}
            columns={columns}
            activities={activities}
            onSelectTask={(task) => setSelectedTask(task)}
            onSelectRFI={(rfi) => setSelectedRFI(rfi)}
          />
        )}
      </main>

      {/* Modals & Overlays */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          columns={columns}
          users={users}
          currentUser={currentUser}
          onClose={() => setSelectedTask(null)}
          onSave={handleSaveTask}
          onDelete={selectedTask.id ? handleDeleteTask : undefined}
          onPreviewImage={(url, name) => setLightboxImage({ url, title: name })}
        />
      )}

      {selectedRFI && (
        <RFIDetailModal
          rfi={selectedRFI}
          users={users}
          currentUser={currentUser}
          onClose={() => setSelectedRFI(null)}
          onSubmitResponse={handleSubmitRFIResponse}
          onUpdateStatus={handleUpdateRFIStatus}
          onPreviewImage={(url, name) => setLightboxImage({ url, title: name })}
        />
      )}

      {isNewRFIModalOpen && (
        <NewRFIModal
          project={currentProject}
          users={users}
          currentUser={currentUser}
          onClose={() => setIsNewRFIModalOpen(false)}
          onSubmit={handleCreateRFI}
          onPreviewImage={(url, name) => setLightboxImage({ url, title: name })}
        />
      )}

      {isNotificationOpen && (
        <NotificationCenter
          notifications={notifications}
          onClose={() => setIsNotificationOpen(false)}
          onMarkAsRead={handleMarkNotificationRead}
          onMarkAllAsRead={handleMarkAllNotificationsRead}
        />
      )}

      {lightboxImage && (
        <LightboxViewer
          imageUrl={lightboxImage.url}
          title={lightboxImage.title}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}

export default App;
