import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileQuestion,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Task, RFI, User as UserType, KanbanColumn, ActivityLog } from '../types';

interface MyTasksDashboardProps {
  currentUser: UserType;
  tasks: Task[];
  rfis: RFI[];
  columns: KanbanColumn[];
  activities: ActivityLog[];
  onSelectTask: (task: Task) => void;
  onSelectRFI: (rfi: RFI) => void;
}

export function MyTasksDashboard({
  currentUser,
  tasks,
  rfis,
  columns,
  activities,
  onSelectTask,
  onSelectRFI,
}: MyTasksDashboardProps) {
  // Tasks assigned to current user
  const myAssignedTasks = tasks.filter((t) => t.assignee_id === currentUser.id);

  // RFIs where current user is the responder / assignee
  const rfisAssignedToMe = rfis.filter((r) => r.assigned_to === currentUser.id);
  // RFIs requested by current user
  const rfisRequestedByMe = rfis.filter((r) => r.requested_by === currentUser.id);

  const getColumnName = (colId: string) => {
    return columns.find((c) => c.id === colId)?.title || '處理中';
  };

  return (
    <div className="space-y-6 pb-8">
      {/* User Greeting & Persona banner */}
      <div className="relative overflow-hidden bg-[#12121A]/90 backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 text-[#FAFAFA] shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-wrap items-center justify-between gap-6">
        {/* Ambient glow accent inside banner */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex items-center space-x-4 relative z-10">
          <div className="relative">
            <img
              src={currentUser.avatar_url}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border-2 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-[#0A0A0F]" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="font-display text-xl font-bold tracking-tight text-white">{currentUser.name}</h2>
              <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              {currentUser.title} • {currentUser.department}
            </p>
          </div>
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-3 text-center relative z-10">
          <div className="bg-[#1A1A24]/70 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/[0.08] transition-all hover:border-white/[0.15]">
            <span className="text-[10px] font-mono text-zinc-400 uppercase block">指派待辦任務</span>
            <span className="font-display text-xl font-bold text-white mt-1 block">{myAssignedTasks.length}</span>
          </div>
          <div className="bg-[#1A1A24]/70 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/[0.08] transition-all hover:border-amber-500/30">
            <span className="text-[10px] font-mono text-amber-400 uppercase block">待回覆 RFI</span>
            <span className="font-display text-xl font-bold text-amber-400 mt-1 block">{rfisAssignedToMe.length}</span>
          </div>
          <div className="bg-[#1A1A24]/70 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/[0.08] transition-all hover:border-white/[0.15]">
            <span className="text-[10px] font-mono text-zinc-400 uppercase block">我發起的 RFI</span>
            <span className="font-display text-xl font-bold text-zinc-200 mt-1 block">{rfisRequestedByMe.length}</span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: My Tasks & My RFIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: My Tasks */}
        <div className="bg-[#12121A]/85 backdrop-blur-md rounded-xl border border-white/[0.08] p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <h3 className="font-display text-sm font-semibold text-zinc-200 tracking-wide">
                指派給我的施工與品管任務 ({myAssignedTasks.length})
              </h3>
            </div>
          </div>

          <div className="space-y-2.5">
            {myAssignedTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono border border-dashed border-white/[0.08] rounded-xl">
                目前沒有指派給您的任務卡片
              </div>
            ) : (
              myAssignedTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="p-3.5 bg-[#1A1A24]/60 hover:bg-[#1A1A24]/90 border border-white/[0.08] hover:border-amber-500/30 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1 truncate pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold text-zinc-400 bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.04]">
                        {task.task_code}
                      </span>
                      <span className="text-xs font-medium text-zinc-200 truncate group-hover:text-amber-300 transition-colors">
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-zinc-500 font-mono">
                      <span>泳道: {getColumnName(task.column_id)}</span>
                      {task.due_date && <span>截止: {new Date(task.due_date).toLocaleDateString('zh-TW')}</span>}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: My RFIs (Awaiting my review or submitted by me) */}
        <div className="bg-[#12121A]/85 backdrop-blur-md rounded-xl border border-white/[0.08] p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
            <div className="flex items-center space-x-2.5">
              <FileQuestion className="w-4 h-4 text-amber-400" />
              <h3 className="font-display text-sm font-semibold text-zinc-200 tracking-wide">
                指派由我審查回覆之 RFI ({rfisAssignedToMe.length})
              </h3>
            </div>
          </div>

          <div className="space-y-2.5">
            {rfisAssignedToMe.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono border border-dashed border-white/[0.08] rounded-xl">
                目前沒有待您回覆的工程疑義案件
              </div>
            ) : (
              rfisAssignedToMe.map((rfi) => (
                <div
                  key={rfi.id}
                  onClick={() => onSelectRFI(rfi)}
                  className="p-3.5 bg-[#1A1A24]/60 hover:bg-[#1A1A24]/90 border border-white/[0.08] hover:border-amber-500/30 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1 truncate pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                        {rfi.rfi_number}
                      </span>
                      <span className="text-xs font-medium text-zinc-200 truncate group-hover:text-amber-300 transition-colors">
                        {rfi.title}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-zinc-500 font-mono">
                      <span>提問: {rfi.requested_by_name}</span>
                      <span className={`font-medium ${rfi.status === 'ANSWERED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        狀態: {rfi.status}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Project Activity Stream */}
      <div className="bg-[#12121A]/85 backdrop-blur-md rounded-xl border border-white/[0.08] p-5 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2.5 border-b border-white/[0.06] pb-3.5">
          <Activity className="w-4 h-4 text-amber-400" />
          <h3 className="font-display text-sm font-semibold text-zinc-200 tracking-wide">
            專案即時動態與審查歷程 (Project Activity Stream)
          </h3>
        </div>

        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-xs text-zinc-500 font-mono text-center py-4">尚無動態紀錄</p>
          ) : (
            activities.map((act) => (
              <div key={act.id} className="flex items-start space-x-3 text-xs border-b border-white/[0.04] last:border-none pb-2.5">
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] mt-1.5 shrink-0" />
                <div className="flex-1 text-zinc-300">
                  <span className="font-semibold text-white">{act.user_name}</span>{' '}
                  <span className="text-zinc-400">{act.action}</span>：{' '}
                  <span className="font-mono text-amber-400">{act.target_title}</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                  {new Date(act.created_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
