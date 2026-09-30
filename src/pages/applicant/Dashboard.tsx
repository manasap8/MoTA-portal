import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  FolderOpen,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Application, Deficiency, Notification } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RiskBadge } from '../../components/common/RiskBadge';

const STAGES = [
  { code: 'DRAFT', label: 'Draft' },
  { code: 'SUBMITTED', label: 'Submitted' },
  { code: 'DOC_VERIF', label: 'Document Scrutiny' },
  { code: 'ELIG_EVAL', label: 'Eligibility Review' },
  { code: 'SCREENING', label: 'Merit Screening' },
  { code: 'FINAL_DECISION', label: 'Selection Decision' },
  { code: 'POST_SELECTION', label: 'Post-Selection' },
];

export const ApplicantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, applicantProfile } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [deficiencies, setDeficiencies] = useState<Deficiency[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [apps, defs, notifs] = await Promise.all([
          api.getApplications(),
          api.getDeficiencies(),
          api.getNotifications(),
        ]);
        setApplications(apps);
        setDeficiencies(defs.filter((d: any) => d.status === 'Open' || d.status === 'Resubmitted'));
        setNotifications(notifs.notifications.slice(0, 4));
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const profileComplete = applicantProfile?.profileCompleted ?? false;
  const draftCount = applications.filter((a) => a.status === 'Draft').length;
  const submittedCount = applications.filter((a) => a.status !== 'Draft').length;
  const openDeficiencies = deficiencies.filter((d) => d.status === 'Open');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-700/60 text-amber-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tribal Scholarship Administration Portal (MoTA)</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome, {user?.fullName || 'Applicant'}!
            </h1>
            <p className="text-xs text-indigo-200 mt-1 max-w-xl">
              Track your NFST fellowship or NOS scholarship applications, review automated document scrutiny results, and manage your statutory submissions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/applicant/apply"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Apply for New Scheme</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Deficiency Alert Banner if open deficiencies exist */}
      {openDeficiencies.length > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-orange-100 text-orange-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-orange-950 uppercase tracking-wider">
                Action Required: {openDeficiencies.length} Open Deficiency Item(s)
              </h3>
              <p className="text-xs text-orange-800 mt-0.5">
                The verification officer requested document resubmissions or clarifications. Please resolve them promptly to prevent delays.
              </p>
            </div>
          </div>
          <Link
            to="/applicant/deficiencies"
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0 text-center"
          >
            Resolve Deficiencies Now
          </Link>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-500">Total Applications</span>
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{applications.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">NFST & NOS Records</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-500">Active / Submitted</span>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{submittedCount}</div>
          <p className="text-[11px] text-emerald-600 mt-1">Under Scrutiny or Selection</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-500">Open Deficiencies</span>
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{openDeficiencies.length}</div>
          <p className="text-[11px] text-orange-600 mt-1">Awaiting your response</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-500">Profile Completion</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{profileComplete ? '100%' : '75%'}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            <Link to="/applicant/profile" className="text-indigo-700 font-semibold hover:underline">
              {profileComplete ? 'Verified ST Profile' : 'Complete Bank DBT'}
            </Link>
          </p>
        </div>
      </div>

      {/* Active Applications with 8-Stage Horizontal Stepper */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Active Applications</h2>
            <p className="text-xs text-slate-500">Live progress tracking across all statutory stages.</p>
          </div>
          <Link
            to="/applicant/my-applications"
            className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="py-12 text-center">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No applications filed yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Start your application for the National Fellowship (NFST) or Overseas Scholarship (NOS).
            </p>
            <Link
              to="/applicant/apply"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Apply Now</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.slice(0, 3).map((app) => {
              // Determine active stage index
              const currentStageCode = app.currentStage || 'SUBMITTED';
              let currentStageIndex = STAGES.findIndex((s) => s.code === currentStageCode);
              if (currentStageIndex === -1) {
                if (app.status === 'Draft') currentStageIndex = 0;
                else if (app.status === 'Submitted') currentStageIndex = 1;
                else if (app.status === 'Under Verification') currentStageIndex = 2;
                else if (app.status === 'Eligible') currentStageIndex = 3;
                else if (app.status === 'Shortlisted') currentStageIndex = 4;
                else if (app.status === 'Selected') currentStageIndex = 6;
                else currentStageIndex = 2;
              }

              return (
                <div key={app.id} className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{app.applicationNumber}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          {app.schemeId.toUpperCase()}
                        </span>
                        <StatusBadge status={app.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Submitted: {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Draft'} • Last updated: {new Date(app.lastUpdatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {app.riskLevel && <RiskBadge level={app.riskLevel} score={app.consistencyScore} />}
                      <Link
                        to={`/applicant/applications/${app.id}`}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 hover:text-indigo-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* 8-Stage Horizontal Visual Stepper */}
                  <div className="pt-2 overflow-x-auto pb-1">
                    <div className="min-w-[620px] flex items-center justify-between relative">
                      {/* Connecting Line */}
                      <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-slate-200 -z-0" />
                      <div
                        className="absolute top-3.5 left-4 h-0.5 bg-indigo-700 -z-0 transition-all duration-300"
                        style={{
                          width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%`,
                        }}
                      />

                      {STAGES.map((stg, i) => {
                        const isCompleted = i < currentStageIndex;
                        const isCurrent = i === currentStageIndex;

                        return (
                          <div key={stg.code} className="flex flex-col items-center relative z-10">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                isCompleted
                                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-100'
                                  : isCurrent
                                  ? 'bg-indigo-700 text-white ring-4 ring-indigo-100 scale-110'
                                  : 'bg-white border-2 border-slate-300 text-slate-400'
                              }`}
                            >
                              {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : i + 1}
                            </div>
                            <span
                              className={`text-[11px] font-semibold mt-1.5 text-center whitespace-nowrap ${
                                isCurrent ? 'text-indigo-900 font-bold' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                              }`}
                            >
                              {stg.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Grid: Quick Actions & Recent Notifications */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/applicant/apply"
              className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-colors"
            >
              <PlusCircle className="w-5 h-5 text-indigo-700 mb-1.5" />
              <h4 className="text-xs font-bold text-slate-800">Apply for Scheme</h4>
              <p className="text-[11px] text-slate-500">NFST Fellowship or NOS Overseas</p>
            </Link>

            <Link
              to="/applicant/documents"
              className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-colors"
            >
              <FolderOpen className="w-5 h-5 text-indigo-700 mb-1.5" />
              <h4 className="text-xs font-bold text-slate-800">Document Center</h4>
              <p className="text-[11px] text-slate-500">Upload or attach sample files</p>
            </Link>

            <Link
              to="/applicant/document-analysis"
              className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-colors"
            >
              <Sparkles className="w-5 h-5 text-purple-700 mb-1.5" />
              <h4 className="text-xs font-bold text-slate-800">Document Analysis</h4>
              <p className="text-[11px] text-slate-500">View 0-100% consistency score</p>
            </Link>

            <Link
              to="/applicant/communication"
              className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-colors"
            >
              <MessageSquare className="w-5 h-5 text-amber-700 mb-1.5" />
              <h4 className="text-xs font-bold text-slate-800">Communication Desk</h4>
              <p className="text-[11px] text-slate-500">Message verification officers</p>
            </Link>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Notifications</h3>
            <Link to="/applicant/notifications" className="text-xs font-semibold text-indigo-700 hover:underline">
              View all
            </Link>
          </div>

          <div className="flex-1 space-y-2.5">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No notifications received</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>{n.title}</span>
                    <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
