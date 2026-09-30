import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  AlertTriangle,
  X,
  FileCheck2,
} from 'lucide-react';
import { api } from '../../services/api';
import { Application, EligibilityResult, CriterionEvaluationResult } from '../../types';
import { TagBadge } from '../../components/common/TagBadge';

export const EligibilityResultPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCriterion, setSelectedCriterion] = useState<CriterionEvaluationResult | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const apps = await api.getApplications();
        setApplications(apps);
        if (apps.length > 0) {
          setSelectedAppId(apps[0].id);
          const details = await api.getApplicationById(apps[0].id);
          setEligibility(details.eligibility || null);
        }
      } catch (err) {
        console.error('Error loading eligibility:', err);
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
      const details = await api.getApplicationById(appId);
      setEligibility(details.eligibility || null);
    } catch (e) {
      //
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Explainable Statutory Eligibility</h1>
            <TagBadge type="rule" label="Rule-based result" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent, deterministic rule-engine evaluation against official Ministry guidelines.
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

      {!eligibility ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
          No eligibility evaluation on record for this application yet.
        </div>
      ) : (
        <>
          {/* Overall Status Banner */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall Status</span>
              <h2
                className={`text-xl font-black ${
                  eligibility.overallStatus === 'Eligible'
                    ? 'text-emerald-700'
                    : eligibility.overallStatus === 'Ineligible'
                    ? 'text-rose-700'
                    : 'text-amber-700'
                }`}
              >
                {eligibility.overallStatus}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xl">{eligibility.explanation}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs shrink-0 text-center sm:text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Evaluated Date</span>
              <span className="font-semibold text-slate-800">{new Date(eligibility.evaluatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Criteria Evaluation List */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Statutory Criteria Evaluation Matrix ({eligibility.criteriaResults.length})
            </h3>

            <div className="space-y-3">
              {eligibility.criteriaResults.map((c) => (
                <div
                  key={c.criterionId}
                  className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    c.status === 'FAIL'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                      : c.status === 'PENDING'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {c.status === 'PASS' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      {c.status === 'FAIL' && <XCircle className="w-5 h-5 text-rose-600" />}
                      {c.status === 'PENDING' && <Clock className="w-5 h-5 text-amber-600 animate-pulse" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{c.criterion}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/80 border border-current">
                          {c.type}
                        </span>
                      </div>
                      <p className="mt-1 opacity-90 leading-relaxed">Evidence: {c.evidence}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        c.status === 'PASS'
                          ? 'bg-emerald-200/80 text-emerald-900'
                          : c.status === 'FAIL'
                          ? 'bg-rose-200/80 text-rose-900'
                          : 'bg-amber-200/80 text-amber-900'
                      }`}
                    >
                      {c.status}
                    </span>

                    <button
                      onClick={() => setSelectedCriterion(c)}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 transition-colors shadow-2xs flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Why was this flagged?</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* "Why was this flagged?" Drawer */}
      {selectedCriterion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                  Rule Engine Explanation
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedCriterion.criterion}</h3>
              </div>
              <button
                onClick={() => setSelectedCriterion(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5">
              <div>
                <span className="font-bold text-slate-700 block">Status:</span>
                <span className="font-semibold text-slate-900">{selectedCriterion.status}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Supporting Evidence:</span>
                <span className="text-slate-800">{selectedCriterion.evidence}</span>
              </div>
              {selectedCriterion.conflictDetected && (
                <div>
                  <span className="font-bold text-rose-700 block">Conflict Detected:</span>
                  <span className="text-rose-900">{selectedCriterion.conflictDetected}</span>
                </div>
              )}
              <div>
                <span className="font-bold text-slate-700 block">Recommended Action:</span>
                <span className="text-indigo-700 font-semibold">{selectedCriterion.recommendedAction}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedCriterion(null)}
              className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Close Explanation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
