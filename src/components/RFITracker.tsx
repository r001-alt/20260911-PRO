import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileQuestion,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Eye,
  Calendar,
  Layers,
  Building,
  DollarSign,
  Download,
  Printer,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react';
import { RFI, User, RFIStatus } from '../types';

interface RFITrackerProps {
  rfis: RFI[];
  users: User[];
  currentUser: User;
  onSelectRFI: (rfi: RFI) => void;
  onNewRFI: () => void;
  onPreviewImage: (url: string, name: string) => void;
}

export function RFITracker({
  rfis,
  users,
  currentUser,
  onSelectRFI,
  onNewRFI,
  onPreviewImage,
}: RFITrackerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Stats calculation
  const totalCount = rfis.length;
  const inReviewCount = rfis.filter((r) => r.status === 'IN_REVIEW' || r.status === 'SUBMITTED').length;
  const answeredCount = rfis.filter((r) => r.status === 'ANSWERED').length;
  const closedCount = rfis.filter((r) => r.status === 'CLOSED').length;
  const scheduleImpactCount = rfis.filter((r) => r.schedule_impact).length;
  const totalCostImpact = rfis.reduce((sum, r) => sum + (r.cost_amount || 0), 0);

  // Filtered list
  const filteredRFIs = rfis.filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = r.rfi_number.toLowerCase().includes(q);
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchQ = r.question.toLowerCase().includes(q);
      const matchDraw = r.drawing_ref?.toLowerCase().includes(q);
      if (!matchNum && !matchTitle && !matchQ && !matchDraw) return false;
    }
    if (statusFilter !== 'ALL' && r.status !== statusFilter) {
      return false;
    }
    if (assigneeFilter !== 'ALL' && r.assigned_to !== assigneeFilter) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: RFIStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-medium rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            草稿 DRAFT
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-medium rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
            已提交 SUBMITTED
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-medium rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            審查中 IN REVIEW
          </span>
        );
      case 'ANSWERED':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-medium rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
            已回覆 ANSWERED
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-medium rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            已結案 CLOSED
          </span>
        );
      case 'CLARIFICATION_REQUIRED':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-medium rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
            需補充 CLARIFY
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#1A1A24]/60 backdrop-blur-md p-4 rounded-xl border border-white/[0.08] transition-all duration-300 hover:border-white/[0.15]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">RFI 總案件數</span>
          <span className="font-display text-2xl font-bold text-white mt-1 block">{totalCount}</span>
        </div>
        <div className="bg-[#1A1A24]/60 backdrop-blur-md p-4 rounded-xl border border-white/[0.08] transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block">審查處理中</span>
          <span className="font-display text-2xl font-bold text-amber-400 mt-1 block">{inReviewCount}</span>
        </div>
        <div className="bg-[#1A1A24]/60 backdrop-blur-md p-4 rounded-xl border border-white/[0.08] transition-all duration-300 hover:border-white/[0.15]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 block">已正式回覆</span>
          <span className="font-display text-2xl font-bold text-purple-300 mt-1 block">{answeredCount}</span>
        </div>
        <div className="bg-[#1A1A24]/60 backdrop-blur-md p-4 rounded-xl border border-white/[0.08] transition-all duration-300 hover:border-white/[0.15]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">已簽核結案</span>
          <span className="font-display text-2xl font-bold text-emerald-400 mt-1 block">{closedCount}</span>
        </div>
        <div className="bg-[#1A1A24]/60 backdrop-blur-md p-4 rounded-xl border border-white/[0.08] transition-all duration-300 hover:border-white/[0.15]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">涉工期影響</span>
          <span className="font-display text-2xl font-bold text-zinc-200 mt-1 block">
            {scheduleImpactCount} <span className="text-xs text-zinc-500 font-normal">件</span>
          </span>
        </div>
        <div className="bg-[#1A1A24]/60 backdrop-blur-md p-4 rounded-xl border border-white/[0.08] transition-all duration-300 hover:border-white/[0.15]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">預估追加減金額</span>
          <span className="font-mono text-sm font-semibold text-zinc-200 mt-2 block">
            NT$ {totalCostImpact.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Filter & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12121A]/85 backdrop-blur-md p-4 rounded-xl border border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              id="rfi-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋編號、圖號、問題關鍵字..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#1A1A24]/70 border border-white/[0.08] rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-zinc-400 font-medium">狀態:</span>
            <select
              id="rfi-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1A1A24]/70 border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-200 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="ALL" className="bg-[#12121A]">全部狀態</option>
              <option value="SUBMITTED" className="bg-[#12121A]">已提交 (Submitted)</option>
              <option value="IN_REVIEW" className="bg-[#12121A]">審查處理中 (In Review)</option>
              <option value="ANSWERED" className="bg-[#12121A]">已回覆 (Answered)</option>
              <option value="CLOSED" className="bg-[#12121A]">已結案 (Closed)</option>
              <option value="CLARIFICATION_REQUIRED" className="bg-[#12121A]">需補充資訊 (Clarification)</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-zinc-400 font-medium">回覆顧問/主責:</span>
            <select
              id="rfi-assignee-filter"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="bg-[#1A1A24]/70 border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-200 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="ALL" className="bg-[#12121A]">全部主責人</option>
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#12121A]">
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-2.5">
          {/* View Toggle */}
          <div className="flex items-center bg-[#1A1A24] rounded-lg p-0.5 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs transition-all ${
                viewMode === 'table'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
              title="表格檢視"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-md text-xs transition-all ${
                viewMode === 'card'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
              title="卡片檢視"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            id="open-new-rfi-modal-btn"
            type="button"
            onClick={onNewRFI}
            className="text-xs font-medium text-[#0A0A0F] bg-amber-500 hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] px-4 py-2 rounded-lg transition-all active:scale-[0.98] flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>發起工程 RFI</span>
          </button>
        </div>
      </div>

      {/* Main RFI List View */}
      {viewMode === 'table' ? (
        /* ================= Table View ================= */
        <div className="bg-[#12121A]/70 backdrop-blur-md rounded-xl border border-white/[0.08] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1A1A24]/80 border-b border-white/[0.08] text-zinc-400 font-mono uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">RFI 編號</th>
                  <th className="py-3 px-4 min-w-[240px]">疑義問題標題與圖號</th>
                  <th className="py-3 px-4">當前狀態</th>
                  <th className="py-3 px-4">提問者</th>
                  <th className="py-3 px-4">指定回覆顧問</th>
                  <th className="py-3 px-4">工期 / 成本衝擊</th>
                  <th className="py-3 px-4">回覆期限</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredRFIs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500 font-mono text-xs">
                      查無相符的工程 RFI 記錄
                    </td>
                  </tr>
                ) : (
                  filteredRFIs.map((rfi) => {
                    const requester = users.find((u) => u.id === rfi.requested_by);
                    const assignee = users.find((u) => u.id === rfi.assigned_to);

                    return (
                      <tr
                        key={rfi.id}
                        id={`rfi-row-${rfi.id}`}
                        onClick={() => onSelectRFI(rfi)}
                        className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                      >
                        {/* RFI Number */}
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                          {rfi.rfi_number}
                        </td>

                        {/* Title & Drawing Ref */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-zinc-200 group-hover:text-amber-300 transition-colors line-clamp-1">
                            {rfi.title}
                          </div>
                          {rfi.drawing_ref && (
                            <div className="text-[11px] text-zinc-500 font-mono mt-0.5 truncate">
                              圖號: {rfi.drawing_ref}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(rfi.status)}
                        </td>

                        {/* Requester */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-medium text-zinc-300">
                            {rfi.requested_by_name || requester?.name || '工程師'}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">{rfi.requested_by_dept}</div>
                        </td>

                        {/* Assigned Reviewer */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-medium text-zinc-300">
                            {rfi.assigned_to_name || assignee?.name || '顧問審查組'}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">{rfi.assigned_to_dept}</div>
                        </td>

                        {/* Schedule & Cost Impact */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-0.5 font-mono text-[11px]">
                            {rfi.schedule_impact ? (
                              <span className="text-amber-400 block">
                                工期 +{rfi.schedule_days} 天
                              </span>
                            ) : (
                              <span className="text-zinc-600 block">無工期影響</span>
                            )}
                            {rfi.cost_impact ? (
                              <span className="text-zinc-300 block">
                                追加減 NT$ {(rfi.cost_amount || 0).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-zinc-600 block">無費用追加</span>
                            )}
                          </div>
                        </td>

                        {/* Due Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-zinc-400 font-mono text-[11px]">
                          {rfi.due_date ? new Date(rfi.due_date).toLocaleDateString('zh-TW') : '-'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRFI(rfi);
                            }}
                            className="text-xs text-zinc-300 group-hover:text-amber-400 font-medium px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 group-hover:border-amber-500/30 transition-all inline-flex items-center gap-1.5"
                          >
                            <span>查閱回覆</span>
                            <ArrowRight className="w-3 h-3 text-amber-500/70" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= Card Grid View ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRFIs.map((rfi) => {
            const firstImg = rfi.attachments?.find((a) => a.mime_type.startsWith('image/'));

            return (
              <div
                key={rfi.id}
                onClick={() => onSelectRFI(rfi)}
                className="bg-[#1A1A24]/60 backdrop-blur-md rounded-xl border border-white/[0.08] p-4 hover:border-white/[0.18] hover:bg-[#1A1A24]/90 hover:scale-[1.01] hover:shadow-[0_10px_25px_rgba(0,0,0,0.4)] transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                      {rfi.rfi_number}
                    </span>
                    {getStatusBadge(rfi.status)}
                  </div>

                  <h3 className="font-display text-sm font-semibold text-zinc-200 line-clamp-2 mb-2 leading-snug hover:text-amber-300 transition-colors">
                    {rfi.title}
                  </h3>

                  {firstImg && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewImage(firstImg.file_url, firstImg.file_name);
                      }}
                      className="w-full h-32 rounded-lg overflow-hidden bg-[#12121A] border border-white/[0.08] mb-2.5 relative group/img"
                    >
                      <img
                        src={firstImg.file_url}
                        alt={firstImg.file_name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-[#0A0A0F]/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-amber-300 text-xs font-medium transition-opacity">
                        <Eye className="w-4 h-4 mr-1" /> 放大檢視圖面
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-zinc-400 line-clamp-3 mb-3 leading-relaxed">
                    {rfi.question}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>提問: {rfi.requested_by_name}</span>
                  <span className="text-zinc-300 font-medium">回覆: {rfi.assigned_to_name}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
