import React, { useState } from 'react';
import { Bot, Send, X, Sparkles, Database, HelpCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface AiQueryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: string[];
  suggestedQuestions?: string[];
  timestamp: string;
}

const DEFAULT_SUGGESTIONS = [
  'Why is application NFST-2025-003 pending?',
  'What documents are missing for NOS-2025-002?',
  'Show all high-risk applications',
  'How many applications are pending document verification?',
  'Which criteria failed for NOS-2025-009?',
];

export const AiQueryDrawer: React.FC<AiQueryDrawerProps> = ({ isOpen, onClose, initialQuery }) => {
  const [query, setQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello, I am the **MoTA Scholarship AI Assistant**. I can help you cross-verify document consistency, inspect eligibility criteria, check missing files, and analyze candidate metrics based on live records.',
      sources: ['system_knowledge'],
      suggestedQuestions: DEFAULT_SUGGESTIONS.slice(0, 3),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async (qToSend?: string) => {
    const textToSend = qToSend || query;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
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
      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        sources: res.sources,
        suggestedQuestions: res.suggestedQuestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `Error processing query: ${err.message || 'Unable to retrieve records.'}`,
        sources: ['error'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-700/80 border border-indigo-500/50 flex items-center justify-center text-amber-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Application Intelligence Assistant</h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded font-medium">
                  Advisory
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                Grounded query router querying live database & rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-indigo-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-indigo-700 text-white rounded-tr-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>

                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Database className="w-3 h-3 text-indigo-500" />
                    <span>Based on: {m.sources.join(', ')}</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>

              {m.suggestedQuestions && m.suggestedQuestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
                  {m.suggestedQuestions.map((sq, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(sq)}
                      className="text-xs bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300 px-2.5 py-1 rounded-full text-left transition-colors font-medium shadow-2xs"
                    >
                      {sq}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs max-w-xs">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Analyzing application records and rule matrix...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about application inconsistencies, missing files, or metrics..."
              className="flex-1 text-sm bg-slate-100 border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="p-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-2 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>AI outputs are advisory. Official decisions belong to authorized officers.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
