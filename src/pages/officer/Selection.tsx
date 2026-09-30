import React, { useState, useEffect } from 'react';
import { Award, Download, CheckCircle2, XCircle, Clock, Sparkles, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { api } from '../../services/api';
import { Application } from '../../types';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TagBadge } from '../../components/common/TagBadge';

export const OfficerSelectionPage: React.FC = () => {
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [decisionModal, setDecisionModal] = useState<any | null>(null);
  const [decisionType, setDecisionType] = useState<'Select' | 'Shortlist' | 'Reject' | 'Hold'>('Select');
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [savingDecision, setSavingDecision] = useState(false);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.getScreeningData();
      setCandidates(res.candidates);
    } catch (err) {
      console.error('Failed to load selection data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleOpenDecisionModal = (candidate: any, type: 'Select' | 'Shortlist' | 'Reject' | 'Hold') => {
    setDecisionModal(candidate);
    setDecisionType(type);
    setDecisionRemarks(
      type === 'Select'
        ? 'Selected under regular fellowship merit quota 2025-26.'
        : type === 'Shortlist'
        ? 'Shortlisted for committee review.'
        : ''
    );
  };

  const handleSaveDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionModal) return;

    if (decisionType === 'Reject' && !decisionRemarks.trim()) {
      showToast('Rejection requires a recorded official reason.', 'error');
      return;
    }

    try {
      setSavingDecision(true);
      await api.saveSelectionDecision({
        applicationId: decisionModal.applicationId,
        decision: decisionType,
        remarks: decisionRemarks,
        screeningScore: decisionModal.screeningScore,
      });
      showToast(`Decision "${decisionType}" recorded for ${decisionModal.applicantName}!`, 'success');
      setDecisionModal(null);
      await fetchCandidates();
    } catch (err: any) {
      showToast(err.message || 'Failed to save decision', 'error');
    } finally {
      setSavingDecision(false);
    }
  };

  const selectedCount = candidates.filter((c) => c.officerDecision === 'Select' || c.status === 'Selected').length;
  const totalQuota = 850; // NFST (750) + NOS (100)

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Official Selection & Award Adjudication</h1>
            <TagBadge type="human" label="Official decision (human)" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Adjudicate provisional fellowship selections, ratify merit lists, and export award gazette records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/selection/export-csv"
            download
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export Official Selection CSV</span>
          </a>
        </div>
      </div>

      {/* Quota Gauge Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
        <div className="flex justify-between text-xs font-bold text-slate-800">
          <span>Sanctioned Quota Allocation Status</span>
          <span className="text-indigo-700 font-bold">
            {selectedCount} Selected of {totalQuota} Available Slots
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (selectedCount / totalQuota) * 100)}%` }}
          />
        </div>
      </div>

      {/* Candidates List with Decision Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Eligible Candidates Ready for Final Selection ({candidates.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Application ID</th>
                <th className="py-3.5 px-4">Applicant Name</th>
                <th className="py-3.5 px-4">Scheme</th>
                <th className="py-3.5 px-4">Merit Score</th>
                <th className="py-3.5 px-4">AI Advisory</th>
                <th className="py-3.5 px-4">Current Decision</th>
                <th className="py-3.5 px-4 text-right">Adjudication Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {candidates.map((c) => (
                <tr key={c.applicationId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{c.applicationNumber}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{c.applicantName}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-600">{c.schemeCode}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-sm font-black text-indigo-700">{c.screeningScore}</span>
                    <span className="text-[10px] text-slate-400">/100</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-xs font-bold ${
                        c.aiRecommendation === 'Recommend shortlist'
                          ? 'text-emerald-700'
                          : c.aiRecommendation === 'Not recommended'
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {c.aiRecommendation}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={c.officerDecision !== 'Pending' ? c.officerDecision : c.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenDecisionModal(c, 'Select')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-2xs"
                      >
                        Select
                      </button>
                      <button
                        onClick={() => handleOpenDecisionModal(c, 'Shortlist')}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-colors shadow-2xs"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() => handleOpenDecisionModal(c, 'Reject')}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-xs transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Adjudication Modal */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  Human Officer Adjudication
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Record Decision: {decisionType} for {decisionModal.applicantName}
                </h3>
              </div>
              <button onClick={() => setDecisionModal(null)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              Candidate: <strong>{decisionModal.applicantName}</strong> ({decisionModal.applicationNumber}) • Merit Score:{' '}
              <strong className="text-indigo-700">{decisionModal.screeningScore} / 100</strong>
            </div>

            <form onSubmit={handleSaveDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Decision Remarks / Minute of Committee *
                </label>
                <textarea
                  rows={3}
                  required
                  value={decisionRemarks}
                  onChange={(e) => setDecisionRemarks(e.target.value)}
                  placeholder="Record formal selection committee reason or minute..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDecisionModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDecision}
                  className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow-xs text-white ${
                    decisionType === 'Select'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : decisionType === 'Reject'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {savingDecision ? 'Saving...' : `Ratify ${decisionType} Decision`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
