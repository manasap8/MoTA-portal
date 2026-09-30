import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Sparkles, CheckCircle2, Clock, XCircle, ArrowRight, FileCheck2, Compass } from 'lucide-react';
import { api } from '../../services/api';
import { Application } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TagBadge } from '../../components/common/TagBadge';

export const ApplicantSelectionResultPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoading(true);
        const apps = await api.getApplications();
        setApplications(apps);
        if (apps.length > 0) {
          // Prefer Selected or Shortlisted
          const priority = apps.find((a: any) => a.status === 'Selected' || a.status === 'Shortlisted') || apps[0];
          setSelectedApp(priority);
        }
      } catch (err) {
        console.error('Error fetching selection results:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading selection status...</div>;
  }

  if (!selectedApp) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        No applications available. Please apply for a scheme first.
      </div>
    );
  }

  const isSelected = selectedApp.status === 'Selected';
  const isShortlisted = selectedApp.status === 'Shortlisted';

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Official Selection Results</h1>
            <TagBadge type="human" label="Official decision (human)" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Decisions ratified by the Ministry Selection & Screening Committee.
          </p>
        </div>

        {applications.length > 1 && (
          <select
            value={selectedApp.id}
            onChange={(e) => {
              const found = applications.find((a) => a.id === e.target.value);
              if (found) setSelectedApp(found);
            }}
            className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-600"
          >
            {applications.map((a) => (
              <option key={a.id} value={a.id}>
                {a.applicationNumber} ({a.status})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Main Result Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Application Number</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{selectedApp.applicationNumber}</div>
            <p className="text-xs text-slate-500 mt-0.5">
              Candidate: <strong>{selectedApp.applicantName}</strong> • Scheme: {selectedApp.schemeId.toUpperCase()}
            </p>
          </div>

          <div>
            <StatusBadge status={selectedApp.status} size="lg" />
          </div>
        </div>

        {/* Content based on status */}
        {isSelected ? (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>Provisional Award Granted</span>
              </div>
              <p className="text-xs leading-relaxed">
                We are pleased to inform you that you have been provisionally selected for the{' '}
                <strong>{selectedApp.schemeId.toUpperCase()}</strong> fellowship award for the academic session 2025-26.
              </p>
              {selectedApp.officerRemarks && (
                <div className="text-xs mt-2 pt-2 border-t border-emerald-200 text-emerald-900">
                  <strong>Selection Committee Remarks:</strong> {selectedApp.officerRemarks}
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 block text-[11px] font-semibold">Award Amount</span>
                <span className="text-sm font-black text-slate-900 mt-1 block">
                  {selectedApp.schemeId === 'scheme_nos'
                    ? '100% Tuition + Living Stipend'
                    : '₹31,000 / month + HRA'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 block text-[11px] font-semibold">Duration</span>
                <span className="text-sm font-black text-slate-900 mt-1 block">
                  {selectedApp.schemeId === 'scheme_nos' ? '2 Years (Master\'s)' : '5 Years (Ph.D.)'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 block text-[11px] font-semibold">Next Action</span>
                <span className="text-sm font-black text-indigo-700 mt-1 block">
                  Post-Selection Submission
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                to="/applicant/post-selection"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Proceed to Post-Selection Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : isShortlisted ? (
          <div className="p-5 rounded-2xl bg-purple-50 border border-purple-300 text-purple-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Award className="w-5 h-5 text-purple-600" />
              <span>Application Shortlisted for Final Round</span>
            </div>
            <p className="text-xs leading-relaxed">
              Your application has met all statutory criteria and has been shortlisted by the screening committee based on academic ranking.
            </p>
            {selectedApp.screeningScore && (
              <p className="text-xs font-semibold mt-1">Screening Merit Score: {selectedApp.screeningScore} / 100</p>
            )}
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span>Under Committee Review</span>
            </div>
            <p className="leading-relaxed">
              Your application is currently progressing through the {selectedApp.currentStage} stage. Final selection results will be published here upon completion of scrutiny.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
