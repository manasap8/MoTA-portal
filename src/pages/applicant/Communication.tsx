import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { Application, Communication } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const ApplicantCommunicationPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [messages, setMessages] = useState<Communication[]>([]);
  const [replyText, setReplyText] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const apps = await api.getApplications();
        setApplications(apps);
        if (apps.length > 0) {
          setSelectedAppId(apps[0].id);
          const comms = await api.getCommunications(apps[0].id);
          setMessages(comms);
        }
      } catch (err) {
        console.error('Error loading communication:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSelectApp = async (appId: string) => {
    setSelectedAppId(appId);
    try {
      setLoading(true);
      const comms = await api.getCommunications(appId);
      setMessages(comms);
    } catch (e) {
      //
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !replyText.trim() || sending) return;

    try {
      setSending(true);
      const res = await api.sendMessage({
        applicationId: selectedAppId,
        message: replyText.trim(),
      });
      setMessages((prev) => [...prev, res.communication]);
      setReplyText('');
      showToast('Message sent to verification desk.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Communication Desk</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct secure communication thread with verification officers and selection committee.
          </p>
        </div>

        {applications.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Application:</span>
            <select
              value={selectedAppId}
              onChange={(e) => handleSelectApp(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-600"
            >
              {applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.applicationNumber} ({a.schemeId.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Message Thread */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
              <span>No communication history for this application yet.</span>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === user?.id || m.senderRole === 'applicant';

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[11px] font-bold text-slate-700">{m.senderName}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        isMe ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {m.senderRole}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs shadow-xs leading-relaxed ${
                      isMe
                        ? 'bg-indigo-700 text-white rounded-tr-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                    }`}
                  >
                    {m.message}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your message or clarification response to the verification desk..."
            className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!replyText.trim() || sending}
            className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
