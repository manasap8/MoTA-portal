import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  Check,
  X,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';
import { Deficiency } from '../../types';
import { useToast } from '../../context/ToastContext';

export const OfficerDeficienciesPage: React.FC = () => {
  const { showToast } = useToast();
  const [deficiencies, setDeficiencies] = useState<Deficiency[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [historyDef, setHistoryDef] = useState<Deficiency | null>(null);

  const [rejectingDef, setRejectingDef] = useState<Deficiency | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');

  const fetchDeficiencies = async () => {
    try {
      setLoading(true);
      const data = await api.getDeficiencies();
      setDeficiencies(data);
    } catch (err) {
      console.error('Failed to load deficiencies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeficiencies();
  }, []);

  const handleResolveDeficiency = async (defId: string) => {
    try {
      await api.resolveDeficiency(defId, 'Verified and approved by officer.');
      showToast('Deficiency marked as Resolved and application status updated.', 'success');
      await fetchDeficiencies();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleRejectResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingDef || !rejectRemarks.trim()) return;

    try {
      await api.rejectResolution(rejectingDef.id, rejectRemarks.trim());
      showToast('Resolution rejected. Deficiency returned to Open status.', 'success');
      setRejectingDef(null);
      setRejectRemarks('');
      await fetchDeficiencies();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const filtered = deficiencies.filter((d) => {
    if (filterStatus === 'all') return true;
    return d.status.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Deficiency Adjudication Desk</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review applicant resubmissions, accept or reject clarifications, and audit deficiency lifecycles.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          {['all', 'open', 'resubmitted', 'resolved'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                filterStatus === s ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Deficiencies Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading deficiencies...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No deficiency items in this view.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((def) => (
              <div key={def.id} className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-950 bg-indigo-50 px-2 py-0.5 rounded">
                      {def.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{def.title}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        def.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : def.status === 'Resubmitted'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {def.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                    {def.description}
                  </p>

                  <div className="text-[11px] text-slate-400 flex items-center gap-3">
                    <span>Due: <strong className="text-rose-700">{def.dueDate}</strong></span>
                    <span>Raised: {new Date(def.raisedAt).toLocaleDateString()} by {def.raisedBy}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => setHistoryDef(def)}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-2xs"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Audit Trail</span>
                  </button>

                  {def.status !== 'Resolved' && (
                    <>
                      <button
                        onClick={() => handleResolveDeficiency(def.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept & Resolve</span>
                      </button>

                      <button
                        onClick={() => {
                          setRejectingDef(def);
                          setRejectRemarks('');
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject Resolution</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Resolution Modal */}
      {rejectingDef && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-rose-900">Reject Deficiency Resolution</h3>
            <p className="text-xs text-slate-600">
              Provide clarification remarks explaining why the applicant's resubmitted certificate or information remains insufficient.
            </p>

            <form onSubmit={handleRejectResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Rejection *</label>
                <textarea
                  rows={3}
                  required
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="e.g. Scanned copy is blurry, issue date is illegible..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingDef(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyDef && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Lifecycle Audit History
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{historyDef.title}</h3>
              </div>
              <button onClick={() => setHistoryDef(null)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto p-1 text-xs">
              {historyDef.history.map((h, i) => (
                <div key={h.id || i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{h.action}</span>
                    <span className="text-[10px] text-slate-400">{new Date(h.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-600">{h.remarks}</p>
                  <p className="text-[10px] text-slate-400">By: {h.actorName} ({h.actorRole})</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setHistoryDef(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
