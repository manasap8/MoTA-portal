import React, { useState } from 'react';
import { Bot, Send, Sparkles, Database, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { TagBadge } from '../../components/common/TagBadge';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: string[];
  suggestedQuestions?: string[];
  timestamp: string;
}

const PRESET_QUERIES = [
  'Why is application NFST-2025-003 pending?',
  'What documents are missing for NOS-2025-002?',
  'Show all high-risk applications',
  'How many applications are pending document verification?',
  'Which criteria failed for NOS-2025-009?',
  'Give me an executive summary of current scheme applications',
];

export const OfficerAiAssistantPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Welcome to the **MoTA AI Investigation Desk**. I am connected directly to the scheme rules and database repository. You can investigate specific application numbers (e.g. `NFST-2025-003`, `NOS-2025-002`), check missing statutory certificates, inspect consistency score point deductions, or request aggregate statistics.',
      sources: ['system_knowledge'],
      suggestedQuestions: PRESET_QUERIES.slice(0, 4),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleSend = async (qToSend?: string) => {
    const textToSend = qToSend || query;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.queryAi(textToSend);
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        sources: res.sources,
        suggestedQuestions: res.suggestedQuestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `Error processing query: ${err.message || 'Unable to retrieve live records.'}`,
        sources: ['error'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">AI Investigation & Query Desk</h1>
            <TagBadge type="ai" label="AI-Assisted Investigation" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Query live application records, consistency engine deductions, and scheme eligibility statuses.
          </p>
        </div>
      </div>

      {/* Main Chat Workstation */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col h-[600px]">
        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-indigo-700 text-white rounded-tr-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>

                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Database className="w-3 h-3 text-indigo-500" />
                    <span>Live Database Sources: {m.sources.join(', ')}</span>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>

              {m.suggestedQuestions && m.suggestedQuestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-w-xl">
                  {m.suggestedQuestions.map((sq, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(sq)}
                      className="text-xs bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300 px-3 py-1.5 rounded-full transition-colors font-medium shadow-2xs"
                    >
                      {sq}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs max-w-sm">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Analyzing live database and rule engine matrix...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask: 'Why is NFST-2025-003 pending?' or 'What documents are missing for NOS-2025-002?'..."
              className="flex-1 text-sm bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="px-5 py-3 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>Ask Assistant</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-2 text-[11px] text-slate-400 text-center">
            Advisory Assistant grounded in live database • Final decisions belong to authorized officers
          </div>
        </div>
      </div>
    </div>
  );
};
