import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, Info, Check, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { Notification } from '../../types';
import { useToast } from '../../context/ToastContext';

export const ApplicantNotificationsPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: string, linkUrl?: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      if (linkUrl) navigate(linkUrl);
    } catch (e) {
      //
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast('All notifications marked as read.', 'success');
    } catch (e) {
      //
    }
  };

  const filtered = notifications.filter((n) => {
    if (filterType === 'unread') return !n.isRead;
    if (filterType !== 'all') return n.type === filterType;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official announcements, deficiency alerts, and statutory stage progression updates.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors self-start sm:self-auto"
        >
          Mark All as Read
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'unread', 'warning', 'success', 'danger', 'info'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
              filterType === t
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No notifications in this category.
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkRead(n.id, n.linkUrl)}
              className={`p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50/80 cursor-pointer transition-colors ${
                !n.isRead ? 'bg-indigo-50/30' : ''
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {n.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {n.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {n.type === 'danger' && <AlertCircle className="w-5 h-5 text-rose-600" />}
                {n.type === 'info' && <Info className="w-5 h-5 text-indigo-600" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-xs sm:text-sm font-bold ${!n.isRead ? 'text-indigo-950 font-black' : 'text-slate-800'}`}>
                    {n.title}
                  </h3>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {n.linkUrl && (
                <span className="shrink-0 text-slate-400 hover:text-indigo-600 p-1">
                  <ExternalLink className="w-4 h-4" />
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
