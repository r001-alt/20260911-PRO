import React, { useState } from 'react';
import {
  X,
  Printer,
  Sparkles,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  FileCheck,
  Send,
  Eye,
  Calendar,
  Building,
  DollarSign,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { RFI, User, RFIStatus } from '../types';

interface RFIDetailModalProps {
  rfi: RFI;
  users: User[];
  currentUser: User;
  onClose: () => void;
  onSubmitResponse: (rfiId: string, content: string, newStatus?: RFIStatus) => Promise<void>;
  onUpdateStatus: (rfiId: string, status: RFIStatus) => Promise<void>;
  onPreviewImage: (url: string, name: string) => void;
}

export function RFIDetailModal({
  rfi,
  users,
  currentUser,
  onClose,
  onSubmitResponse,
  onUpdateStatus,
  onPreviewImage,
}: RFIDetailModalProps) {
  const [responseContent, setResponseContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'detail' | 'print'>('detail');

  // RBAC checks
  const canRespond = ['SUPER_ADMIN', 'PM', 'REVIEWER'].includes(currentUser.role);
  const canClose = ['SUPER_ADMIN', 'PM'].includes(currentUser.role);

  const getStatusBadge = (status: RFIStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">草稿 DRAFT</span>;
      case 'SUBMITTED':
        return <span className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">已提交 SUBMITTED</span>;
      case 'IN_REVIEW':
        return <span className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]">審查中 IN REVIEW</span>;
      case 'ANSWERED':
        return <span className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">已回覆 ANSWERED</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">已結案 CLOSED</span>;
      case 'CLARIFICATION_REQUIRED':
        return <span className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">需補充 CLARIFY</span>;
    }
  };

  const handleAIAnalyze = async () => {
    setIsAnalyzingAI(true);
    try {
      const firstImage = rfi.attachments?.find((a) => a.mime_type.startsWith('image/'));
      const res = await fetch('/api/v1/ai/analyze-rfi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: rfi.title,
          question: rfi.question,
          drawing_ref: rfi.drawing_ref,
          spec_ref: rfi.spec_ref,
          imageBase64: firstImage ? firstImage.file_url : undefined,
          imageMime: firstImage ? firstImage.mime_type : undefined,
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAiAnalysisResult(data.analysis);
        if (data.suggested_response && !responseContent) {
          setResponseContent(data.suggested_response);
        }
      }
    } catch (err) {
      console.error('AI 解析失敗', err);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handleSendResponse = async () => {
    if (!responseContent.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmitResponse(rfi.id, responseContent.trim(), 'ANSWERED');
      setResponseContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseRFI = async () => {
    if (confirm('確認要核准並將此 RFI 正式結案 (Closed) 嗎？')) {
      await onUpdateStatus(rfi.id, 'CLOSED');
    }
  };

  const handleRequestClarification = async () => {
    const reason = prompt('請輸入需要提問者補充說明的事項：');
    if (reason) {
      await onSubmitResponse(rfi.id, `【審查方要求補充資訊】：${reason}`, 'CLARIFICATION_REQUIRED');
    }
  };

  return (
    <div
      id="rfi-modal-overlay"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#0A0A0F]/80 backdrop-blur-md p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="rfi-modal-content"
        className="bg-[#12121A] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/[0.08] w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-[#FAFAFA]"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#12121A]">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg shadow-[0_0_10px_rgba(245,158,11,0.15)]">
              {rfi.rfi_number}
            </span>
            {getStatusBadge(rfi.status)}
            <span className="text-xs text-zinc-500 font-mono">
              提問日期: {new Date(rfi.created_at).toLocaleDateString('zh-TW')}
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              id="rfi-print-toggle-btn"
              type="button"
              onClick={() => setActiveTab(activeTab === 'detail' ? 'print' : 'detail')}
              className={`text-xs font-mono font-medium px-3.5 py-1.5 rounded-lg border transition-all flex items-center space-x-1.5 ${
                activeTab === 'print'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-[#1A1A24] text-zinc-300 border-white/[0.08] hover:border-white/20 hover:text-white'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{activeTab === 'print' ? '返回工作視圖' : '工程報告 / 列印預覽'}</span>
            </button>
            <button
              id="close-rfi-modal-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === 'print' ? (
          /* ================= Formal Print / Export Preview ================= */
          <div className="flex-1 overflow-y-auto p-8 bg-[#0A0A0F]">
            <div className="max-w-3xl mx-auto bg-[#161622] p-10 border border-white/10 shadow-2xl rounded-2xl space-y-6 text-zinc-200">
              {/* Report Header */}
              <div className="border-b-2 border-white/20 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="font-display text-xl font-bold tracking-tight text-white">
                    工程與技術疑義單 (Request For Information)
                  </h1>
                  <p className="text-xs text-zinc-400 font-mono mt-1">
                    專案代碼：{rfi.project_id} • 系統流水編號：{rfi.rfi_number}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-amber-400">{rfi.rfi_number}</div>
                  <div className="text-xs text-zinc-400 font-mono">日期：{new Date(rfi.created_at).toLocaleDateString('zh-TW')}</div>
                </div>
              </div>

              {/* Basic Fields Table */}
              <div className="border border-white/10 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-4 border-b border-white/10 bg-white/[0.02]">
                  <div className="p-3 font-semibold text-zinc-400 border-r border-white/10">疑義標題</div>
                  <div className="p-3 font-bold text-white col-span-3">{rfi.title}</div>
                </div>
                <div className="grid grid-cols-4 border-b border-white/10">
                  <div className="p-3 font-semibold text-zinc-400 border-r border-white/10 bg-white/[0.02]">提問單位 / 提問者</div>
                  <div className="p-3 text-zinc-200 border-r border-white/10">
                    {rfi.requested_by_dept} - {rfi.requested_by_name}
                  </div>
                  <div className="p-3 font-semibold text-zinc-400 border-r border-white/10 bg-white/[0.02]">回覆負責人 / 單位</div>
                  <div className="p-3 text-zinc-200">
                    {rfi.assigned_to_dept} - {rfi.assigned_to_name}
                  </div>
                </div>
                <div className="grid grid-cols-4 border-b border-white/10">
                  <div className="p-3 font-semibold text-zinc-400 border-r border-white/10 bg-white/[0.02]">關聯工程圖號</div>
                  <div className="p-3 text-zinc-200 border-r border-white/10 font-mono">{rfi.drawing_ref || '無'}</div>
                  <div className="p-3 font-semibold text-zinc-400 border-r border-white/10 bg-white/[0.02]">契約規範引用</div>
                  <div className="p-3 text-zinc-200">{rfi.spec_ref || '無'}</div>
                </div>
                <div className="grid grid-cols-4">
                  <div className="p-3 font-semibold text-zinc-400 border-r border-white/10 bg-white/[0.02]">工期影響評估</div>
                  <div className="p-3 text-zinc-200 border-r border-white/10">
                    {rfi.schedule_impact ? `是 (預估天數: +${rfi.schedule_days} 天)` : '無工期影響'}
                  </div>
                  <div className="p-3 font-semibold text-zinc-400 border-r border-white/10 bg-white/[0.02]">費用追加減影響</div>
                  <div className="p-3 text-zinc-200">
                    {rfi.cost_impact ? `是 (預估金額: NT$ ${(rfi.cost_amount || 0).toLocaleString()})` : '無追加減費用'}
                  </div>
                </div>
              </div>

              {/* Question Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 bg-white/[0.04] p-2.5 rounded-lg border border-white/[0.06]">
                  一、現場疑義內容說明 (Technical Question Description)
                </h3>
                <div className="text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap p-4 bg-[#12121A] border border-white/10 rounded-xl">
                  {rfi.question}
                </div>
              </div>

              {/* Attached Images */}
              {rfi.attachments && rfi.attachments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 bg-white/[0.04] p-2.5 rounded-lg border border-white/[0.06]">
                    二、圖面與現場佐證附圖 ({rfi.attachments.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {rfi.attachments.map((att) => (
                      <div key={att.id} className="border border-white/10 rounded-xl p-2.5 text-center bg-[#12121A]">
                        {att.mime_type.startsWith('image/') ? (
                          <img
                            src={att.file_url}
                            alt={att.file_name}
                            referrerPolicy="no-referrer"
                            className="max-h-48 mx-auto object-contain mb-1.5 rounded-lg"
                          />
                        ) : (
                          <div className="p-4 text-zinc-500 font-mono text-xs">{att.file_name}</div>
                        )}
                        <p className="text-[10px] text-zinc-400 truncate font-mono">{att.file_name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Official Response Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 bg-white/[0.04] p-2.5 rounded-lg border border-white/[0.06]">
                  三、監造 / 設計顧問官方正式回覆意見 (Official Response)
                </h3>
                {rfi.official_response ? (
                  <div className="text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap p-4 bg-emerald-500/[0.05] border border-emerald-500/20 rounded-xl">
                    {rfi.official_response}
                    <div className="mt-4 pt-3 border-t border-emerald-500/20 flex justify-between text-[11px] text-zinc-400 font-mono">
                      <span>回覆專案顧問 / 審查主管：{rfi.responder_name || '王顧問'}</span>
                      <span>回覆時間：{rfi.responded_at ? new Date(rfi.responded_at).toLocaleString('zh-TW') : '-'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-xs text-zinc-500 italic border border-dashed border-white/10 rounded-xl text-center font-mono">
                    目前尚未簽核官方回覆意見。
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/15 text-xs">
                <div className="text-center">
                  <p className="text-zinc-500 mb-8 font-mono">提問工程師簽名</p>
                  <p className="font-semibold text-white border-t border-white/20 pt-1.5">
                    {rfi.requested_by_name}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-zinc-500 mb-8 font-mono">專業設計顧問 / 技師簽章</p>
                  <p className="font-semibold text-white border-t border-white/20 pt-1.5">
                    {rfi.responder_name || rfi.assigned_to_name || '待回覆'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-zinc-500 mb-8 font-mono">專案經理 (PM) 結案核定</p>
                  <p className="font-semibold text-white border-t border-white/20 pt-1.5">
                    {rfi.status === 'CLOSED' ? '李專案經理 (已結案)' : '待核准'}
                  </p>
                </div>
              </div>

              {/* Print Action */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-amber-500 hover:brightness-110 text-[#0A0A0F] text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                >
                  <Printer className="w-4 h-4" />
                  <span>列印或儲存為 PDF</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ================= Interactive Workspace View ================= */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title & Status Stepper */}
            <div>
              <h2 className="font-display text-lg font-bold text-white leading-snug mb-3.5">
                {rfi.title}
              </h2>

              {/* Lifecycle Progress Stepper */}
              <div className="flex items-center justify-between bg-[#1A1A24]/60 border border-white/[0.08] rounded-xl p-3.5 text-xs">
                {[
                  { key: 'SUBMITTED', label: '1. 已提交' },
                  { key: 'IN_REVIEW', label: '2. 審查中' },
                  { key: 'ANSWERED', label: '3. 已回覆' },
                  { key: 'CLOSED', label: '4. 已結案' },
                ].map((step, idx) => {
                  const statusOrder = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'ANSWERED', 'CLOSED'];
                  const currentIndex = statusOrder.indexOf(rfi.status);
                  const stepIndex = statusOrder.indexOf(step.key);
                  const isDone = currentIndex >= stepIndex;
                  const isCurrent = rfi.status === step.key;

                  return (
                    <div key={step.key} className="flex items-center space-x-2 flex-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                          isDone
                            ? 'bg-amber-500 text-[#0A0A0F] shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                            : 'bg-white/[0.08] text-zinc-500'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span
                        className={`font-mono text-xs ${
                          isCurrent ? 'text-amber-400 font-bold' : isDone ? 'text-zinc-200' : 'text-zinc-500'
                        }`}
                      >
                        {step.label}
                      </span>
                      {idx < 3 && (
                        <div
                          className={`flex-1 h-0.5 mx-2 hidden sm:block ${
                            currentIndex > stepIndex ? 'bg-amber-500/50' : 'bg-white/[0.08]'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Meta Attributes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#1A1A24]/40 p-4 rounded-xl border border-white/[0.08] text-xs">
              <div>
                <span className="text-zinc-500 font-mono block mb-1">提問者 / 所屬組別</span>
                <span className="font-semibold text-zinc-200">
                  {rfi.requested_by_name} ({rfi.requested_by_dept})
                </span>
              </div>
              <div>
                <span className="text-zinc-500 font-mono block mb-1">指定回覆負責人</span>
                <span className="font-semibold text-zinc-200">
                  {rfi.assigned_to_name} ({rfi.assigned_to_dept})
                </span>
              </div>
              <div>
                <span className="text-zinc-500 font-mono block mb-1">工期影響評估</span>
                <span className={`font-mono font-semibold ${rfi.schedule_impact ? 'text-amber-400' : 'text-zinc-400'}`}>
                  {rfi.schedule_impact ? `⚠️ 有影響 (+${rfi.schedule_days} 天)` : '無工期影響'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 font-mono block mb-1">費用變更影響</span>
                <span className={`font-mono font-semibold ${rfi.cost_impact ? 'text-amber-400' : 'text-zinc-400'}`}>
                  {rfi.cost_impact ? `⚠️ 追加減 $${(rfi.cost_amount || 0).toLocaleString()}` : '無追加減費用'}
                </span>
              </div>
              <div className="lg:col-span-2">
                <span className="text-zinc-500 font-mono block mb-1">關聯圖號</span>
                <span className="font-mono text-zinc-300">{rfi.drawing_ref || '無特別標註'}</span>
              </div>
              <div className="lg:col-span-2">
                <span className="text-zinc-500 font-mono block mb-1">規範條文引用</span>
                <span className="text-zinc-300">{rfi.spec_ref || '無特別標註'}</span>
              </div>
            </div>

            {/* Question Details */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-zinc-500" /> 工程現場疑義提問詳情
              </label>
              <div className="p-4 bg-[#1A1A24]/70 border border-white/[0.08] rounded-xl text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {rfi.question}
              </div>
            </div>

            {/* Attachments & Lightbox Viewer Grid */}
            {rfi.attachments && rfi.attachments.length > 0 && (
              <div className="space-y-2">
                <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-zinc-500" /> 相關圖面與截圖附件 ({rfi.attachments.length})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {rfi.attachments.map((att) => {
                    const isImg = att.mime_type.startsWith('image/');
                    return (
                      <div
                        key={att.id}
                        className="group border border-white/[0.08] rounded-xl p-2.5 bg-[#1A1A24]/60 hover:border-white/20 transition-all cursor-pointer"
                        onClick={() => {
                          if (isImg) onPreviewImage(att.file_url, att.file_name);
                        }}
                      >
                        {isImg ? (
                          <div className="w-full h-28 rounded-lg overflow-hidden bg-[#12121A] border border-white/[0.06] relative mb-2">
                            <img
                              src={att.file_url}
                              alt={att.file_name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-[#0A0A0F]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-amber-300 text-xs font-medium transition-opacity">
                              <Eye className="w-4 h-4 mr-1" /> 放大檢視
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-28 rounded-lg bg-[#12121A] border border-white/[0.06] flex items-center justify-center text-zinc-500 mb-2">
                            <Paperclip className="w-6 h-6" />
                          </div>
                        )}
                        <p className="text-xs font-medium text-zinc-200 truncate">{att.file_name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          由 {att.uploaded_by_name || '提問者'} 上傳
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Assistant: Gemini 3.8 Flash Engineering Helper */}
            <div className="border border-amber-500/30 bg-amber-500/[0.03] rounded-xl p-4 space-y-3 backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500 text-[#0A0A0F] shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-xs font-bold text-amber-400">
                      Gemini 智慧工程疑義與圖面分析輔助
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      由伺服端 Gemini 3.8 Flash 自動剖析規範條文、評估工期費用衝擊並草擬專業回覆
                    </p>
                  </div>
                </div>

                <button
                  id="gemini-analyze-rfi-btn"
                  type="button"
                  disabled={isAnalyzingAI}
                  onClick={handleAIAnalyze}
                  className="text-xs font-medium bg-amber-500 hover:brightness-110 text-[#0A0A0F] px-3.5 py-1.5 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-[0.98] flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAnalyzingAI ? 'AI 正在研析圖面規範中...' : '進行 AI 深度工程分析'}</span>
                </button>
              </div>

              {aiAnalysisResult && (
                <div className="bg-[#12121A] border border-amber-500/20 rounded-xl p-4 text-xs text-zinc-200 space-y-2 leading-relaxed animate-in fade-in">
                  <div className="font-mono text-amber-400 border-b border-white/[0.08] pb-2 flex justify-between items-center">
                    <span>AI 研析報告建議書</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!responseContent) {
                          setResponseContent(aiAnalysisResult);
                        } else {
                          setResponseContent((prev) => prev + '\n\n' + aiAnalysisResult);
                        }
                      }}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      帶入回覆編輯框 ↵
                    </button>
                  </div>
                  <div className="whitespace-pre-wrap text-zinc-300 font-mono text-xs">{aiAnalysisResult}</div>
                </div>
              )}
            </div>

            {/* Official Response History */}
            {rfi.official_response && (
              <div className="border border-emerald-500/30 bg-emerald-500/[0.04] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 正式官方回覆記錄 (Official Response)
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    回覆者: {rfi.responder_name || '王顧問'} • {rfi.responded_at ? new Date(rfi.responded_at).toLocaleString('zh-TW') : ''}
                  </span>
                </div>
                <div className="p-3.5 bg-[#12121A] border border-emerald-500/20 rounded-lg text-xs sm:text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {rfi.official_response}
                </div>
              </div>
            )}

            {/* Response Form (for Reviewers, PM, Super Admin) */}
            {canRespond && rfi.status !== 'CLOSED' && (
              <div className="border border-white/[0.08] rounded-xl p-4 bg-[#1A1A24]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-amber-400" /> 提具審查意見或官方正式回覆
                  </label>
                  <span className="text-[11px] font-mono text-zinc-500">
                    當前身分：{currentUser.name} ({currentUser.role})
                  </span>
                </div>

                <textarea
                  id="rfi-response-textarea"
                  rows={4}
                  value={responseContent}
                  onChange={(e) => setResponseContent(e.target.value)}
                  placeholder="請輸入經技師/監造簽認之正式回覆意見（可點擊上方 AI 建議一鍵自動帶入）..."
                  className="w-full text-xs sm:text-sm text-white bg-[#12121A] border border-white/[0.08] rounded-xl p-3.5 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all leading-relaxed placeholder:text-zinc-600"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleRequestClarification}
                      className="text-xs text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors font-mono"
                    >
                      要求提問者補充資訊 (Clarification)
                    </button>
                    {rfi.status === 'SUBMITTED' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(rfi.id, 'IN_REVIEW')}
                        className="text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-colors font-mono"
                      >
                        標記為審查處理中 (In Review)
                      </button>
                    )}
                  </div>

                  <button
                    id="submit-rfi-response-btn"
                    type="button"
                    disabled={isSubmitting || !responseContent.trim()}
                    onClick={handleSendResponse}
                    className="text-xs font-medium text-[#0A0A0F] bg-amber-500 hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-[0.98] px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? '送出中...' : '發布官方回覆 (Answer RFI)'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] bg-[#12121A]">
          <div className="text-xs text-zinc-500 font-mono">
            {rfi.status === 'CLOSED' ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> 此工程疑義已正式核准結案
              </span>
            ) : (
              <span>流程狀態：{rfi.status}</span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {canClose && rfi.status !== 'CLOSED' && (
              <button
                id="close-rfi-approval-btn"
                type="button"
                onClick={handleCloseRFI}
                className="text-xs font-medium text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>核准並將此 RFI 結案</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-zinc-300 hover:text-white px-4 py-2 rounded-lg border border-white/15 hover:bg-white/5 active:scale-[0.98] transition-all"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
