import React, { useState, useRef } from 'react';
import {
  X,
  Calendar,
  User,
  Users,
  Tag,
  Paperclip,
  UploadCloud,
  FileText,
  AlertCircle,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Task, KanbanColumn, User as UserType, Attachment, TaskPriority } from '../types';

interface TaskModalProps {
  task: Task;
  columns: KanbanColumn[];
  users: UserType[];
  currentUser: UserType;
  onClose: () => void;
  onSave: (updatedTask: Partial<Task>) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  onPreviewImage: (url: string, name: string) => void;
}

export function TaskModal({
  task,
  columns,
  users,
  currentUser,
  onClose,
  onSave,
  onDelete,
  onPreviewImage,
}: TaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [columnId, setColumnId] = useState(task.column_id);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [startDate, setStartDate] = useState(task.start_date || '');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [assigneeId, setAssigneeId] = useState(task.assignee_id || '');
  const [collaborators, setCollaborators] = useState<string[]>(task.collaborator_ids || []);
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>(task.attachments || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pasteNotice, setPasteNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Direct Clipboard Pasting (Ctrl+V / Cmd+V)
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await uploadFileObject(file, `clipboard-${Date.now()}.png`);
        }
      }
    }
  };

  const uploadFileObject = async (file: File, fallbackName?: string) => {
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch('/api/v1/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: base64,
            fileName: fallbackName || file.name,
            mimeType: file.type || 'image/png',
            target_type: 'TASK',
            target_id: task.id,
          }),
        });
        const data = await res.json();
        if (data.attachment) {
          setAttachments((prev) => [...prev, data.attachment]);
          setPasteNotice(true);
          setTimeout(() => setPasteNotice(false), 3000);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('上傳出錯', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((f: File) => uploadFileObject(f));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((f: File) => uploadFileObject(f));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleToggleCollaborator = (userId: string) => {
    if (collaborators.includes(userId)) {
      setCollaborators(collaborators.filter((id) => id !== userId));
    } else {
      setCollaborators([...collaborators, userId]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        title,
        description,
        column_id: columnId,
        priority,
        start_date: startDate,
        due_date: dueDate,
        assignee_id: assigneeId,
        collaborator_ids: collaborators,
        tags,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div
      id="task-modal-overlay"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#0A0A0F]/80 backdrop-blur-md p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onPaste={handlePaste}
    >
      <div
        id="task-modal-content"
        className="bg-[#12121A] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/[0.08] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-[#FAFAFA]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#12121A]">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
              {task.task_code}
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              建立於 {new Date(task.created_at).toLocaleDateString('zh-TW')}
            </span>
            {pasteNotice && (
              <span className="text-xs font-mono font-medium text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                <CheckCircle2 className="w-3.5 h-3.5" /> 剪貼簿截圖已自動上傳！
              </span>
            )}
          </div>
          <button
            id="close-task-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title Field */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              任務名稱
            </label>
            <input
              id="task-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="請輸入任務名稱..."
              className="w-full text-base font-semibold text-white bg-[#1A1A24]/70 border border-white/[0.08] rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-zinc-600"
            />
          </div>

          {/* Quick Properties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-[#1A1A24]/40 border border-white/[0.08]">
            {/* Column / Status */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" /> 狀態泳道
              </label>
              <select
                id="task-column-select"
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full text-xs font-medium bg-[#1A1A24] border border-white/[0.08] text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#12121A]">
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-zinc-500" /> 優先等級
              </label>
              <select
                id="task-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full text-xs font-medium bg-[#1A1A24] border border-white/[0.08] text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="LOW" className="bg-[#12121A]">低 (Low)</option>
                <option value="MEDIUM" className="bg-[#12121A]">中等 (Medium)</option>
                <option value="HIGH" className="bg-[#12121A]">高 (High)</option>
                <option value="URGENT" className="bg-[#12121A]">緊急 (Urgent)</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-500" /> 主責工程師
              </label>
              <select
                id="task-assignee-select"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full text-xs font-medium bg-[#1A1A24] border border-white/[0.08] text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-[#12121A]">
                    {u.name} ({u.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" /> 截止期限
              </label>
              <input
                id="task-due-date-input"
                type="date"
                value={dueDate ? dueDate.slice(0, 10) : ''}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs font-mono font-medium bg-[#1A1A24] border border-white/[0.08] text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Collaborators Selection */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-zinc-500" /> 協同工程師與關注人員
            </label>
            <div className="flex flex-wrap gap-2">
              {users.map((u) => {
                const isSelected = collaborators.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleToggleCollaborator(u.id)}
                    className={`inline-flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-medium shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                        : 'bg-[#1A1A24]/60 border-white/[0.08] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                    }`}
                  >
                    <img
                      src={u.avatar_url}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="w-4 h-4 rounded-full object-cover border border-white/20"
                    />
                    <span>{u.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-zinc-500" /> 標籤分類 (Tags)
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center text-xs font-mono bg-white/[0.05] text-zinc-300 px-2.5 py-1 rounded-md border border-white/[0.08]"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="輸入標籤後按 Enter"
                  className="text-xs bg-[#1A1A24] border border-white/[0.08] text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="text-xs bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border border-white/[0.08] px-2.5 py-1 rounded-lg transition-colors"
                >
                  新增
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-zinc-500" /> 施工說明與規格要求
              </label>
              <span className="text-[11px] font-mono text-zinc-500">支援 Markdown 格式</span>
            </div>
            <textarea
              id="task-description-textarea"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="詳細記錄工程內容、圖號引述、現場尺寸或審查注意事項..."
              className="w-full text-xs font-normal text-zinc-200 bg-[#1A1A24]/70 border border-white/[0.08] rounded-xl p-3.5 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all leading-relaxed placeholder:text-zinc-600"
            />
          </div>

          {/* Attachments & Clipboard Paste section */}
          <div className="border border-white/[0.08] rounded-xl p-4 bg-[#1A1A24]/40">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-mono font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-zinc-500" /> 圖面與附件檔案清單 ({attachments.length})
              </label>
              <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                💡 支援剪貼簿直接貼圖 (Ctrl+V / Cmd+V)
              </span>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/[0.1] hover:border-amber-500/40 hover:bg-amber-500/[0.02] rounded-xl p-5 text-center cursor-pointer transition-all mb-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
              <UploadCloud className="w-7 h-7 mx-auto text-zinc-500 mb-1.5" />
              <p className="text-xs text-zinc-300 font-medium">
                拖曳圖檔至此處，或 <span className="text-amber-400 underline underline-offset-2">點擊瀏覽檔案</span>
              </p>
              <p className="text-[11px] text-zinc-500 font-mono mt-1">
                支援 PNG, JPG, WebP, PDF, DWG, XLSX, DOCX (最大單檔 50MB)
              </p>
            </div>

            {/* Uploading indicator */}
            {isUploading && (
              <div className="flex items-center justify-center p-3 text-xs text-zinc-400 space-x-2 font-mono">
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <span>檔案上傳儲存中...</span>
              </div>
            )}

            {/* Attachments Grid */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachments.map((att) => {
                  const isImage = att.mime_type.startsWith('image/');
                  return (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2.5 bg-[#1A1A24] border border-white/[0.08] hover:border-white/[0.18] rounded-xl transition-all"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        {isImage ? (
                          <div
                            onClick={() => onPreviewImage(att.file_url, att.file_name)}
                            className="w-11 h-11 rounded-lg border border-white/[0.08] overflow-hidden shrink-0 cursor-pointer relative group bg-[#12121A]"
                          >
                            <img
                              src={att.file_url}
                              alt={att.file_name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-[#0A0A0F]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-4 h-4 text-amber-300" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-[#12121A] border border-white/[0.08] flex items-center justify-center shrink-0 text-zinc-500">
                            <FileText className="w-6 h-6" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-xs font-medium text-zinc-200 truncate">{att.file_name}</p>
                          <p className="text-[10px] font-mono text-zinc-500">
                            {formatFileSize(att.file_size)} • {att.uploaded_by_name || '系統成員'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        {isImage && (
                          <button
                            type="button"
                            onClick={() => onPreviewImage(att.file_url, att.file_name)}
                            className="p-1 text-zinc-400 hover:text-amber-400 rounded transition-colors"
                            title="放大預覽"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setAttachments(attachments.filter((a) => a.id !== att.id))}
                          className="p-1 text-zinc-500 hover:text-red-400 rounded transition-colors"
                          title="移除附件"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] bg-[#12121A]">
          <div>
            {onDelete && (
              <button
                id="delete-task-btn"
                type="button"
                onClick={() => {
                  if (confirm('確定要刪除此任務卡片嗎？此操作無法復原。')) {
                    onDelete(task.id);
                    onClose();
                  }
                }}
                className="text-xs font-medium text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition-colors"
              >
                刪除任務
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              id="cancel-task-btn"
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-zinc-300 hover:text-white px-4 py-2 rounded-lg border border-white/15 hover:bg-white/5 active:scale-[0.98] transition-all"
            >
              取消
            </button>
            <button
              id="save-task-btn"
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="text-xs font-medium text-[#0A0A0F] bg-amber-500 hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-[0.98] px-5 py-2 rounded-lg transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isSaving ? '儲存中...' : '儲存變更'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
