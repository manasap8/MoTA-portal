import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Upload,
  Sparkles,
  History,
  X,
  FileCheck2,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { Deficiency, DeficiencyHistoryItem } from '../../types';
import { useToast } from '../../context/ToastContext';

export const DeficienciesPage: React.FC = () => {
  const { showToast } = useToast();
  const [deficiencies, setDeficiencies] = useState<Deficiency[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingDef, setResolvingDef] = useState<Deficiency | null>(null);
  const [historyDef, setHistoryDef] = useState<Deficiency | null>(null);

  // Resolution form state
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [correctedValue, setCorrectedValue] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);

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

  const handleOpenResolve = (def: Deficiency) => {
    setResolvingDef(def);
    setResolutionRemarks('');
    setCorrectedValue('');
  };

  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingDef) return;

    try {
      setSubmittingResolution(true);
      await api.resubmitDeficiency(resolvingDef.id, {
        remarks: resolutionRemarks,
        correctedValue: correctedValue || undefined,
      });
      showToast('Deficiency resolution submitted. Officer will review.', 'success');
      setResolvingDef(null);
      await fetchDeficiencies();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit resolution.', 'error');
    } finally {
      setSubmittingResolution(false);
    }
  };

  const handleAttachQuickCorrection = async (scenario: string) => {
    if (!resolvingDef) return;
    try {
      showToast('Attaching corrected sample document...', 'info');
      await api.attachSampleDoc({
        applicationId: resolvingDef.applicationId,
        docType: resolvingDef.linkedField || 'st_certificate',
        sampleScenario: scenario,
      });
      showToast('Corrected document attached!', 'success');
      setResolutionRemarks(`Uploaded corrected certificate (${scenario}) to resolve deficiency.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to attach correction', 'error');
    }
  };

  const openList = deficiencies.filter((d) => d.status === 'Open' || d.status === 'Resubmitted');
  const resolvedList = deficiencies.filter((d) => d.status === 'Resolved');

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Deficiency Resolution Center</h1>
            {openList.length > 0 && (
              <span className="text-xs font-bold text-orange-800 bg-orange-100 px-2.5 py-0.5 rounded-full">
                {openList.length} Action(s) Required
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Resolve officer requests, upload clarified certificates, and track deficiency audit history.
          </p>
        </div>
      </div>

      {/* Open Deficiencies Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-600" />
          <span>Pending Deficiencies & Resubmissions ({openList.length})</span>
        </h2>

        {openList.length === 0 ? (
          <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-2xs text-center text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <span className="font-bold text-slate-800 block text-sm">No open deficiencies!</span>
            <span>All document checks and field submissions are in satisfactory state.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {openList.map((def) => (
              <div
                key={def.id}
                className="p-5 bg-white border border-orange-200 rounded-2xl shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-orange-900 bg-orange-100 px-2 py-0.5 rounded">
                        {def.category}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          def.status === 'Resubmitted'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Status: {def.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{def.title}</h3>
                  </div>

                  <div className="text-right sm:text-right text-xs">
                    <span className="text-slate-400 block text-[11px]">Due Date:</span>
                    <span className="font-bold text-rose-700">{def.dueDate}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                  {def.description}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="text-slate-400 text-[11px]">
                    Raised by: <strong>{def.raisedBy}</strong> on {new Date(def.raisedAt).toLocaleDateString()}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHistoryDef(def)}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold flex items-center gap-1 shadow-2xs"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>History ({def.history.length})</span>
                    </button>

                    <button
                      onClick={() => handleOpenResolve(def)}
                      className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <span>Resolve Deficiency</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Deficiencies Section */}
      {resolvedList.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Resolved Deficiencies ({resolvedList.length})</span>
          </h2>

          <div className="space-y-2.5">
            {resolvedList.map((def) => (
              <div
                key={def.id}
                className="p-4 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{def.title}</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Resolved
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5">{def.description}</p>
                  {def.resolutionRemarks && (
                    <p className="text-emerald-700 mt-1 font-medium">Remarks: {def.resolutionRemarks}</p>
                  )}
                </div>

                <button
                  onClick={() => setHistoryDef(def)}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shrink-0 font-medium flex items-center gap-1"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Audit History</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Drawer / Modal */}
      {resolvingDef && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                  Deficiency Resubmission
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{resolvingDef.title}</h3>
              </div>
              <button
                onClick={() => setResolvingDef(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-orange-50/80 rounded-xl border border-orange-200 text-xs text-orange-950">
              <span className="font-bold block mb-0.5">Officer Requirement:</span>
              <span>{resolvingDef.description}</span>
            </div>

            <form onSubmit={handleSubmitResolution} className="space-y-4">
              {/* Quick sample doc attachment helper */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Option A: Quick Attach Corrected Sample Document
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAttachQuickCorrection('matching')}
                    className="flex-1 py-2 px-3 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Attach Valid ST Cert</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAttachQuickCorrection('valid')}
                    className="flex-1 py-2 px-3 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Attach Valid Income Cert</span>
                  </button>
                </div>
              </div>

              {/* Corrected Field input if linked */}
              {resolvingDef.linkedField && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Option B: Correct Application Field ({resolvingDef.linkedField})
                  </label>
                  <input
                    type="text"
                    value={correctedValue}
                    onChange={(e) => setCorrectedValue(e.target.value)}
                    placeholder={`Enter updated value for ${resolvingDef.linkedField}`}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                  />
                </div>
              )}

              {/* Applicant Explanation Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Applicant Explanation / Clarification Remarks *
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionRemarks}
                  onChange={(e) => setResolutionRemarks(e.target.value)}
                  placeholder="Explain the correction or details of updated document..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingDef(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingResolution || !resolutionRemarks.trim()}
                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>{submittingResolution ? 'Submitting...' : 'Submit Resolution to Officer'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Drawer */}
      {historyDef && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Lifecycle Audit History
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{historyDef.title}</h3>
              </div>
              <button
                onClick={() => setHistoryDef(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto p-1">
              {historyDef.history.map((h, i) => (
                <div key={h.id || i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
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
              Close History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
