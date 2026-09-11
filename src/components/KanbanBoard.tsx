import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  AlertCircle,
  Clock,
  Paperclip,
  Image as ImageIcon,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Task, KanbanColumn, User, TaskPriority } from '../types';

interface KanbanBoardProps {
  columns: KanbanColumn[];
  tasks: Task[];
  users: User[];
  currentUser: User;
  onMoveTask: (taskId: string, targetColumnId: string, newPosition?: number) => Promise<void>;
  onSelectTask: (task: Task) => void;
  onAddTask: (columnId?: string) => void;
  onAddColumn: (title: string, color: string) => Promise<void>;
  onDeleteColumn: (columnId: string) => Promise<void>;
  onPreviewImage: (url: string, name: string) => void;
}

export function KanbanBoard({
  columns,
  tasks,
  users,
  currentUser,
  onMoveTask,
  onSelectTask,
  onAddTask,
  onAddColumn,
  onDeleteColumn,
  onPreviewImage,
}: KanbanBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [tagFilter, setTagFilter] = useState<string>('ALL');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<string | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#F59E0B');

  // Collect all unique tags
  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags || [])));

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchCode = t.task_code.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchCode && !matchDesc) return false;
    }
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) {
      return false;
    }
    if (assigneeFilter !== 'ALL' && t.assignee_id !== assigneeFilter) {
      return false;
    }
    if (tagFilter !== 'ALL' && !t.tags?.includes(tagFilter)) {
      return false;
    }
    return true;
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropColumn !== columnId) {
      setActiveDropColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, columnId: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (activeDropColumn === columnId) {
      setActiveDropColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setActiveDropColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.column_id === columnId) return;

    await onMoveTask(taskId, columnId);
  };

  const handleQuickMove = async (task: Task, direction: 'prev' | 'next') => {
    const currentIndex = columns.findIndex((c) => c.id === task.column_id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < columns.length) {
      const targetColumn = columns[targetIndex];
      await onMoveTask(task.id, targetColumn.id);
    }
  };

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    await onAddColumn(newColumnTitle.trim(), newColumnColor);
    setNewColumnTitle('');
    setIsAddingColumn(false);
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded bg-red-500/10 text-red-400 border border-red-500/20">
            緊急
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            高優先
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
            中等
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            低
          </span>
        );
    }
  };

  const isOverdue = (dueDateStr?: string) => {
    if (!dueDateStr) return false;
    const due = new Date(dueDateStr);
    const now = new Date();
    return due < now;
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12121A]/85 backdrop-blur-md p-4 rounded-xl border border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              id="kanban-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋任務編號、標題或內容..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#1A1A24]/70 border border-white/[0.08] rounded-lg text-[#FAFAFA] placeholder:text-zinc-500 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
            />
          </div>

          {/* Filter: Priority */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-zinc-400 font-medium">優先級:</span>
            <select
              id="filter-priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#1A1A24]/70 border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-200 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="ALL" className="bg-[#12121A]">全部優先級</option>
              <option value="URGENT" className="bg-[#12121A]">緊急 (Urgent)</option>
              <option value="HIGH" className="bg-[#12121A]">高 (High)</option>
              <option value="MEDIUM" className="bg-[#12121A]">中等 (Medium)</option>
              <option value="LOW" className="bg-[#12121A]">低 (Low)</option>
            </select>
          </div>

          {/* Filter: Assignee */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-zinc-400 font-medium">主責人員:</span>
            <select
              id="filter-assignee"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="bg-[#1A1A24]/70 border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-200 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="ALL" className="bg-[#12121A]">全部人員</option>
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#12121A]">
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter: Tags */}
          {allTags.length > 0 && (
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-zinc-400 font-medium">標籤:</span>
              <select
                id="filter-tag"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="bg-[#1A1A24]/70 border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-200 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="ALL" className="bg-[#12121A]">全部標籤</option>
                {allTags.map((t) => (
                  <option key={t} value={t} className="bg-[#12121A]">
                    #{t}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(searchQuery || priorityFilter !== 'ALL' || assigneeFilter !== 'ALL' || tagFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setPriorityFilter('ALL');
                setAssigneeFilter('ALL');
                setTagFilter('ALL');
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium underline px-1 transition-colors"
            >
              重設篩選
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            id="add-column-toggle-btn"
            type="button"
            onClick={() => setIsAddingColumn(!isAddingColumn)}
            className="text-xs font-medium text-zinc-300 bg-transparent hover:bg-white/[0.05] border border-white/15 hover:border-white/25 px-3 py-2 rounded-lg transition-all active:scale-[0.98] flex items-center space-x-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>自訂泳道</span>
          </button>
          <button
            id="create-task-btn"
            type="button"
            onClick={() => onAddTask(columns[0]?.id)}
            className="text-xs font-medium text-[#0A0A0F] bg-amber-500 hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] px-4 py-2 rounded-lg transition-all active:scale-[0.98] flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>新增任務卡片</span>
          </button>
        </div>
      </div>

      {/* Add Column Expandable Row */}
      {isAddingColumn && (
        <form
          onSubmit={handleCreateColumn}
          className="bg-[#12121A]/90 border border-amber-500/30 rounded-xl p-3.5 flex flex-wrap items-center gap-3 animate-in fade-in duration-150 backdrop-blur-md"
        >
          <span className="text-xs font-medium text-amber-400">新增工作流泳道:</span>
          <input
            type="text"
            required
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            placeholder="泳道名稱 (例如：現場會勘、安全查核)..."
            className="text-xs bg-[#1A1A24] border border-white/[0.08] text-white rounded-lg px-3 py-1.5 w-64 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
          />
          <div className="flex items-center space-x-1.5 text-xs text-zinc-400">
            <span>代表色:</span>
            <input
              type="color"
              value={newColumnColor}
              onChange={(e) => setNewColumnColor(e.target.value)}
              className="w-7 h-7 rounded border border-white/[0.08] bg-transparent cursor-pointer"
            />
          </div>
          <button
            type="submit"
            className="text-xs font-medium text-[#0A0A0F] bg-amber-500 hover:brightness-110 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] px-3 py-1.5 rounded-lg transition-all"
          >
            建立泳道
          </button>
          <button
            type="button"
            onClick={() => setIsAddingColumn(false)}
            className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1.5 transition-colors"
          >
            取消
          </button>
        </form>
      )}

      {/* Kanban Board Columns Container */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max h-full items-start">
          {columns.map((column, colIdx) => {
            const colTasks = filteredTasks
              .filter((t) => t.column_id === column.id)
              .sort((a, b) => a.position - b.position);

            const isDropTarget = activeDropColumn === column.id;

            return (
              <div
                key={column.id}
                id={`kanban-column-${column.id}`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={(e) => handleDragLeave(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
                className={`w-80 flex flex-col rounded-xl bg-[#12121A]/60 backdrop-blur-md border transition-all duration-300 max-h-[calc(100vh-230px)] ${
                  isDropTarget
                    ? 'border-amber-500/60 ring-2 ring-amber-500/20 bg-amber-500/[0.02]'
                    : 'border-white/[0.08]'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.08] bg-[#12121A]/80 rounded-t-xl">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: column.color || '#F59E0B',
                        boxShadow: `0 0 8px ${column.color || '#F59E0B'}66`,
                      }}
                    />
                    <h3 className="font-display text-xs font-semibold text-zinc-200 tracking-wide">
                      {column.title}
                    </h3>
                    <span className="font-mono text-[10px] text-zinc-400 bg-white/[0.06] px-1.5 py-0.5 rounded-full border border-white/[0.04]">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => onAddTask(column.id)}
                      className="p-1 text-zinc-400 hover:text-amber-400 hover:bg-white/[0.05] rounded transition-colors"
                      title="在此泳道新增任務"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    {columns.length > 3 && colTasks.length === 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`確定要刪除泳道「${column.title}」嗎？`)) {
                            onDeleteColumn(column.id);
                          }
                        }}
                        className="p-1 text-zinc-500 hover:text-red-400 hover:bg-white/[0.05] rounded transition-colors"
                        title="刪除空白泳道"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Column Task Cards Scroll Area */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[140px]">
                  {colTasks.length === 0 ? (
                    <div className="h-28 border border-dashed border-white/[0.08] rounded-xl flex flex-col items-center justify-center text-zinc-500 text-xs">
                      <span>尚無卡片</span>
                      <span className="text-[10px] text-zinc-600 mt-1 font-mono">拖曳至此處移動</span>
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const assignee = users.find((u) => u.id === task.assignee_id);
                      const imageAtt = task.attachments?.find((a) => a.mime_type.startsWith('image/'));
                      const overdue = isOverdue(task.due_date);

                      return (
                        <div
                          key={task.id}
                          id={`task-card-${task.id}`}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => onSelectTask(task)}
                          className={`group bg-[#1A1A24]/60 backdrop-blur-md rounded-xl p-3.5 border border-white/[0.08] transition-all duration-300 hover:border-white/[0.18] hover:bg-[#1A1A24]/90 hover:scale-[1.01] hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] cursor-pointer relative ${
                            draggedTaskId === task.id ? 'opacity-30 ring-1 ring-amber-500' : ''
                          }`}
                        >
                          {/* Top Row: Task Code & Priority */}
                          <div className="flex items-center justify-between gap-1.5 mb-2">
                            <span className="font-mono text-[11px] font-medium text-zinc-500 tracking-tight">
                              {task.task_code}
                            </span>
                            <div className="flex items-center space-x-1.5">
                              {getPriorityBadge(task.priority)}
                            </div>
                          </div>

                          {/* Image Thumbnail Preview if attached */}
                          {imageAtt && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                onPreviewImage(imageAtt.file_url, imageAtt.file_name);
                              }}
                              className="mb-2.5 w-full h-24 rounded-lg overflow-hidden bg-[#12121A] border border-white/[0.08] relative group/img"
                            >
                              <img
                                src={imageAtt.file_url}
                                alt={imageAtt.file_name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-[#0A0A0F]/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-amber-300 text-[11px] font-medium transition-opacity">
                                點擊放大查看截圖
                              </div>
                            </div>
                          )}

                          {/* Title */}
                          <h4 className="text-xs font-medium text-zinc-200 line-clamp-2 leading-relaxed mb-2.5 group-hover:text-amber-300 transition-colors">
                            {task.title}
                          </h4>

                          {/* Tags */}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2.5">
                              {task.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] font-mono bg-white/[0.04] text-zinc-400 px-1.5 py-0.5 rounded border border-white/[0.06]"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Card Footer: Metadata & Assignee */}
                          <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06] text-[11px] text-zinc-500">
                            {/* Left: Due date & Attachments */}
                            <div className="flex items-center space-x-2.5">
                              {task.due_date && (
                                <span
                                  className={`flex items-center gap-1 font-mono text-[10px] ${
                                    overdue && !column.is_done ? 'text-red-400' : 'text-zinc-500'
                                  }`}
                                  title={overdue ? '已逾期！' : '截止日期'}
                                >
                                  <Calendar className="w-3 h-3" />
                                  {new Date(task.due_date).toLocaleDateString('zh-TW', {
                                    month: 'numeric',
                                    day: 'numeric',
                                  })}
                                </span>
                              )}

                              {task.attachments && task.attachments.length > 0 && (
                                <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                                  <Paperclip className="w-3 h-3 text-zinc-500" />
                                  {task.attachments.length}
                                </span>
                              )}
                            </div>

                            {/* Right: Quick Move Controls & Assignee Avatar */}
                            <div className="flex items-center space-x-1.5">
                              {/* Quick Move Buttons (accessible on mobile/desktop) */}
                              <div
                                className="opacity-0 group-hover:opacity-100 flex items-center bg-[#12121A] border border-white/[0.08] rounded p-0.5 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {colIdx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickMove(task, 'prev')}
                                    className="p-0.5 text-zinc-400 hover:text-amber-400 rounded transition-colors"
                                    title="移至上一泳道"
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                  </button>
                                )}
                                {colIdx < columns.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickMove(task, 'next')}
                                    className="p-0.5 text-zinc-400 hover:text-amber-400 rounded transition-colors"
                                    title="移至下一泳道"
                                  >
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              {/* Assignee Avatar */}
                              {assignee ? (
                                <div className="relative group/avatar" title={assignee.name}>
                                  <img
                                    src={assignee.avatar_url}
                                    alt={assignee.name}
                                    referrerPolicy="no-referrer"
                                    className="w-5 h-5 rounded-full object-cover border border-white/20"
                                  />
                                </div>
                              ) : (
                                <span className="w-5 h-5 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-[9px] text-zinc-500">
                                  未
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
