import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Paperclip,
  UploadCloud,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FileText,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import { Project, User, Attachment } from '../types';

interface NewRFIModalProps {
  project: Project;
  users: User[];
  currentUser: User;
  onClose: () => void;
  onSubmit: (newRFI: any) => Promise<void>;
  onPreviewImage: (url: string, name: string) => void;
}

export function NewRFIModal({
  project,
  users,
  currentUser,
  onClose,
  onSubmit,
  onPreviewImage,
}: NewRFIModalProps) {
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [drawingRef, setDrawingRef] = useState('');
  const [specRef, setSpecRef] = useState('');
  const [scheduleImpact, setScheduleImpact] = useState(false);
  const [scheduleDays, setScheduleDays] = useState(0);
  const [costImpact, setCostImpact] = useState(false);
  const [costAmount, setCostAmount] = useState(0);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [assignedTo, setAssignedTo] = useState(
    users.find((u) => u.role === 'REVIEWER')?.id || users[0]?.id || ''
  );
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pasteNotice, setPasteNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Direct Clipboard Pasting (Ctrl+V)
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await uploadFileObject(file, `rfi-drawing-${Date.now()}.png`);
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
            target_type: 'RFI',
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((f: File) => uploadFileObject(f));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !question.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        question: question.trim(),
        drawing_ref: drawingRef.trim(),
        spec_ref: specRef.trim(),
        schedule_impact: scheduleImpact,
        schedule_days: scheduleImpact ? Number(scheduleDays) : 0,
        cost_impact: costImpact,
        cost_amount: costImpact ? Number(costAmount) : 0,
        due_date: new Date(dueDate).toISOString(),
        assigned_to: assignedTo,
        attachments,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="new-rfi-modal-overlay"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#0A0A0F]/80 backdrop-blur-md p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onPaste={handlePaste}
    >
      <div
        id="new-rfi-modal-content"
        className="bg-[#12121A] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/[0.08] w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-[#FAFAFA]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#12121A]">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                {project.code}-RFI-{new Date().getFullYear()}-AUTO
              </span>
              <h2 className="font-display text-base font-bold text-white">發起工程疑義單 (New RFI)</h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-mono">
              向業主顧問、建築師或監造技師提出正式技術或設計疑問
            </p>
          </div>

          <button
            id="close-new-rfi-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              疑義問題標題 <span className="text-amber-400">*</span>
            </label>
            <input
              id="new-rfi-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：3F 潔淨室主回風管與橋架空間干涉檢討..."
              className="w-full text-sm font-medium text-white bg-[#1A1A24]/70 border border-white/[0.08] rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-zinc-600"
            />
          </div>

          {/* Dual Grid: Drawing & Specification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                關聯工程圖號 (Drawing No.)
              </label>
              <input
                id="new-rfi-drawing-input"
                type="text"
                value={drawingRef}
                onChange={(e) => setDrawingRef(e.target.value)}
                placeholder="例：E-302-A 機房動力圖 Rev.2"
                className="w-full text-xs font-mono bg-[#1A1A24]/70 border border-white/[0.08] text-zinc-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                合約規範條文引用 (Specification Ref.)
              </label>
              <input
                id="new-rfi-spec-input"
                type="text"
                value={specRef}
                onChange={(e) => setSpecRef(e.target.value)}
                placeholder="例：施工技術規範 第 16120 節 2.1 條"
                className="w-full text-xs bg-[#1A1A24]/70 border border-white/[0.08] text-zinc-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Question Textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-zinc-500" /> 疑義內容詳細說明 <span className="text-amber-400">*</span>
              </label>
              <span className="text-[11px] font-mono text-zinc-500">請清楚陳述現場狀況與建議方案</span>
            </div>
            <textarea
              id="new-rfi-question-textarea"
              rows={5}
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="請詳細敘述現場干涉、尺寸差異、規範衝突處，並列出擬請顧問或技師確認之具體提問項目..."
              className="w-full text-xs font-normal text-zinc-200 bg-[#1A1A24]/70 border border-white/[0.08] rounded-xl p-3.5 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all leading-relaxed placeholder:text-zinc-600"
            />
          </div>

          {/* Impact Assessment Section */}
          <div className="border border-white/[0.08] rounded-xl p-4 bg-[#1A1A24]/40 space-y-3">
            <span className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider block">
              工期與成本影響預先評估 (Impact Evaluation)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Schedule Impact */}
              <div className="bg-[#1A1A24] p-3.5 rounded-xl border border-white/[0.08]">
                <label className="flex items-center space-x-2 font-medium text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleImpact}
                    onChange={(e) => setScheduleImpact(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-[#12121A] border-white/20"
                  />
                  <span>是否有工期影響 (Schedule Impact)？</span>
                </label>
                {scheduleImpact && (
                  <div className="mt-2.5 flex items-center space-x-2">
                    <span className="text-zinc-500 font-mono">預估展延天數:</span>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={scheduleDays}
                      onChange={(e) => setScheduleDays(Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-[#12121A] border border-white/[0.12] rounded text-center text-xs font-mono font-bold text-amber-400 focus:border-amber-500/50 focus:outline-none"
                    />
                    <span className="text-zinc-500">天</span>
                  </div>
                )}
              </div>

              {/* Cost Impact */}
              <div className="bg-[#1A1A24] p-3.5 rounded-xl border border-white/[0.08]">
                <label className="flex items-center space-x-2 font-medium text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={costImpact}
                    onChange={(e) => setCostImpact(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-[#12121A] border-white/20"
                  />
                  <span>是否有費用追加減 (Cost Impact)？</span>
                </label>
                {costImpact && (
                  <div className="mt-2.5 flex items-center space-x-2">
                    <span className="text-zinc-500 font-mono">預估金額: NT$</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={costAmount}
                      onChange={(e) => setCostAmount(Number(e.target.value))}
                      className="w-28 px-2 py-1 bg-[#12121A] border border-white/[0.12] rounded text-center text-xs font-mono font-bold text-zinc-200 focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assigned Reviewer & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                指定回覆顧問 / 單位負責人
              </label>
              <select
                id="new-rfi-assignee-select"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full text-xs bg-[#1A1A24] border border-white/[0.08] text-zinc-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-[#12121A]">
                    {u.name} ({u.title} - {u.department})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                要求回覆截止日 (Required Due Date)
              </label>
              <input
                id="new-rfi-due-date-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs font-mono bg-[#1A1A24] border border-white/[0.08] text-zinc-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Attachment upload & Ctrl+V Paste */}
          <div className="border border-white/[0.08] rounded-xl p-4 bg-[#1A1A24]/40">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-mono font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-zinc-500" /> 圖面與現場照片佐證 ({attachments.length})
              </label>
              <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                💡 支援直接 Ctrl+V / Cmd+V 貼圖
              </span>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/[0.1] hover:border-amber-500/40 hover:bg-amber-500/[0.02] rounded-xl p-4 text-center cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    Array.from(e.target.files).forEach((f: File) => uploadFileObject(f));
                  }
                }}
              />
              <UploadCloud className="w-6 h-6 mx-auto text-zinc-500 mb-1" />
              <p className="text-xs text-zinc-300">
                點擊或拖曳檔案至此處，或在視窗內直接貼上截圖 (Ctrl+V)
              </p>
            </div>

            {isUploading && (
              <div className="text-xs text-zinc-400 font-mono text-center py-2 animate-pulse">
                檔案上傳中...
              </div>
            )}

            {attachments.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 bg-[#1A1A24] border border-white/[0.08] rounded-lg text-xs"
                  >
                    <span className="truncate max-w-[140px] text-zinc-200">{att.file_name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(attachments.filter((a) => a.id !== att.id))}
                      className="text-zinc-500 hover:text-red-400 ml-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-zinc-300 hover:text-white px-4 py-2 rounded-lg border border-white/15 hover:bg-white/5 active:scale-[0.98] transition-all"
            >
              取消
            </button>
            <button
              id="submit-new-rfi-btn"
              type="submit"
              disabled={isSubmitting || !title.trim() || !question.trim()}
              className="text-xs font-medium text-[#0A0A0F] bg-amber-500 hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-[0.98] px-5 py-2 rounded-lg transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? '送審建立中...' : '確認發起並提交審查'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
