import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  HelpCircle,
  Clock,
  Info,
  ChevronRight,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { Application, ConsistencyResult, ConsistencyFinding } from '../../types';
import { RiskBadge } from '../../components/common/RiskBadge';
import { TagBadge } from '../../components/common/TagBadge';

export const DocumentAnalysisPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [consistency, setConsistency] = useState<ConsistencyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState<ConsistencyFinding | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const apps = await api.getApplications();
        setApplications(apps);
        if (apps.length > 0) {
          setSelectedAppId(apps[0].id);
          const details = await api.getApplicationById(apps[0].id);
          setConsistency(details.consistency || null);
        }
      } catch (err) {
        console.error('Error loading analysis:', err);
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
      setConsistency(details.consistency || null);
    } catch (err) {
      //
    } finally {
      setLoading(false);
    }
  };

  const breakdown = consistency?.scoreBreakdown || {
    nameMatching: 20,
    dobMatching: 20,
    categoryCert: 15,
    institution: 15,
    course: 10,
    validityExpiry: 10,
    completeness: 10,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Document Consistency & Risk Intelligence</h1>
            <TagBadge type="ai" label="AI-assisted finding" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent cross-document identity verification, format validation, and expiry detection.
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

      {!consistency ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
          No automated analysis results available for this record yet.
        </div>
      ) : (
        <>
          {/* Consistency Score Gauge & Risk Banner */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs grid md:grid-cols-3 gap-6 items-center">
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Consistency Score
              </span>
              <div className="text-4xl font-black text-slate-900 mt-1">{consistency.score}%</div>
              <div className="mt-2">
                <RiskBadge level={consistency.riskLevel} />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <h3 className="text-sm font-bold text-slate-800">Automated Cross-Check Summary</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{consistency.plainExplanation}</p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                <span>
                  <strong>Guideline:</strong> Never classifies documents as fraudulent. Potential inconsistencies trigger manual human scrutiny.
                </span>
              </div>
            </div>
          </div>

          {/* Visible Weight Breakdown */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Scoring Weight Breakdown (How is this score calculated?)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">Name Matching</span>
                <span className="text-sm font-black text-slate-900 mt-1 block">{breakdown.nameMatching} / 20</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">DOB Matching</span>
                <span className="text-sm font-black text-slate-900 mt-1 block">{breakdown.dobMatching} / 20</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">Category / ST Cert</span>
                <span className="text-sm font-black text-slate-900 mt-1 block">{breakdown.categoryCert} / 15</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">Institution Match</span>
                <span className="text-sm font-black text-slate-900 mt-1 block">{breakdown.institution} / 15</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">Course Match</span>
                <span className="text-sm font-black text-slate-900 mt-1 block">{breakdown.course} / 10</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">Validity & Expiry</span>
                <span className="text-sm font-black text-slate-900 mt-1 block">{breakdown.validityExpiry} / 10</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">Completeness</span>
                <span className="text-sm font-black text-slate-900 mt-1 block">{breakdown.completeness} / 10</span>
              </div>
            </div>
          </div>

          {/* Detailed Findings List */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Itemized Cross-Check Findings ({consistency.findings.length})
            </h3>

            <div className="space-y-3">
              {consistency.findings.map((f) => (
                <div
                  key={f.id}
                  className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    f.status === 'FAIL'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                      : f.status === 'WARNING'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : f.status === 'INFO'
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {f.status === 'FAIL' && <XCircle className="w-5 h-5 text-rose-600" />}
                      {f.status === 'WARNING' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                      {f.status === 'PASS' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      {f.status === 'INFO' && <Info className="w-5 h-5 text-slate-400" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{f.title}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/80 border border-current">
                          {f.category}
                        </span>
                      </div>
                      <p className="mt-1 opacity-90 leading-relaxed">{f.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {f.weightDeduction > 0 && (
                      <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-lg">
                        -{f.weightDeduction} pts
                      </span>
                    )}

                    <button
                      onClick={() => setSelectedFinding(f)}
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

      {/* "Why was this flagged?" Modal/Drawer */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  AI Explainability Drawer
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedFinding.title}</h3>
              </div>
              <button
                onClick={() => setSelectedFinding(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div>
                <span className="font-bold text-slate-700 block">Finding Category:</span>
                <span className="text-slate-600">{selectedFinding.category} (Field: {selectedFinding.field})</span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Conflict Detected:</span>
                <span className="text-slate-800">{selectedFinding.details}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Impact on Evaluation:</span>
                <span className="text-slate-600">
                  {selectedFinding.weightDeduction > 0
                    ? `Deducted ${selectedFinding.weightDeduction} points from consistency score. Advisory status marked for human verification.`
                    : 'Information check confirmed consistent.'}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Recommended Action:</span>
                <span className="text-indigo-700 font-medium">
                  {selectedFinding.status === 'PASS'
                    ? 'No action required.'
                    : 'Check certificate spelling or upload affidavit/updated certificate via the Deficiency Resolution center.'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 text-center">
              AI-assisted finding • Advisory output subject to official officer review
            </div>

            <button
              onClick={() => setSelectedFinding(null)}
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
