import React from 'react';
import { X, Check, Bell, AlertCircle, MessageSquare, Clock } from 'lucide-react';
import { Notification } from '../types';

interface NotificationCenterProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
}

export function NotificationCenter({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationCenterProps) {
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div
      id="notification-modal-overlay"
      className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-[#0A0A0F]/70 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="notification-panel"
        className="w-full max-w-sm bg-[#12121A] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/[0.08] overflow-hidden mt-12 animate-in fade-in slide-in-from-top-4 duration-150 text-[#FAFAFA]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#12121A]">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3 className="font-display text-xs font-bold text-zinc-200">通知中心</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-mono bg-amber-500 text-[#0A0A0F] font-bold px-1.5 py-0.2 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-mono transition-colors"
              >
                全部標為已讀
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto divide-y divide-white/[0.04] text-xs">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-zinc-500 font-mono text-xs">目前沒有任何通知</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && onMarkAsRead(n.id)}
                className={`p-3.5 transition-all cursor-pointer flex items-start space-x-3 ${
                  n.is_read
                    ? 'bg-transparent hover:bg-white/[0.03] opacity-60'
                    : 'bg-amber-500/[0.05] hover:bg-amber-500/[0.09] border-l-2 border-amber-500'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {n.type === 'RFI_ASSIGNED' || n.type === 'RFI_ANSWERED' ? (
                    <div className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-200">{n.title}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(n.created_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">{n.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
