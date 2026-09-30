import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  UserCheck,
  X,
  Sparkles,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface DemoStep {
  step: number;
  role: UserRole;
  title: string;
  description: string;
  path: string;
  account: string;
}

const DEMO_STEPS: DemoStep[] = [
  { step: 1, role: 'applicant', title: 'Applicant logs in', description: 'Log in with applicant@demo.com / Demo@123', path: '/applicant/dashboard', account: 'applicant@demo.com' },
  { step: 2, role: 'applicant', title: 'Selects Scheme (NFST or NOS)', description: 'View schemes catalog and pick NFST or NOS', path: '/applicant/apply', account: 'applicant@demo.com' },
  { step: 3, role: 'applicant', title: 'Fills dynamic application form', description: '10 sections with inline validation and autosave', path: '/applicant/apply', account: 'applicant@demo.com' },
  { step: 4, role: 'applicant', title: 'Uploads / Attaches documents', description: 'Use sample document picker for 1-click test certificates', path: '/applicant/apply', account: 'applicant@demo.com' },
  { step: 5, role: 'applicant', title: 'System processes uploads', description: 'Staged progress: reading, extracting, analyzing', path: '/applicant/documents', account: 'applicant@demo.com' },
  { step: 6, role: 'applicant', title: 'OCR extracts certificate fields', description: 'Extracts name, DOB, cert number, authority, marks', path: '/applicant/document-analysis', account: 'applicant@demo.com' },
  { step: 7, role: 'applicant', title: 'Extracted data compared with form', description: 'Cross-document consistency engine execution', path: '/applicant/document-analysis', account: 'applicant@demo.com' },
  { step: 8, role: 'applicant', title: 'Consistency engine flags findings', description: 'Weighted 0-100% score and LOW/MED/HIGH advisory badge', path: '/applicant/document-analysis', account: 'applicant@demo.com' },
  { step: 9, role: 'applicant', title: 'Rule engine evaluates eligibility', description: 'Deterministic evaluation of statutory criteria', path: '/applicant/eligibility-result', account: 'applicant@demo.com' },
  { step: 10, role: 'applicant', title: 'Explainable eligibility result', description: 'Plain-language explanation with "Why was this flagged?"', path: '/applicant/eligibility-result', account: 'applicant@demo.com' },
  { step: 11, role: 'applicant', title: 'Application submitted', description: 'Statutory declaration accepted and record locked', path: '/applicant/my-applications', account: 'applicant@demo.com' },
  { step: 12, role: 'officer', title: 'Verification Officer logs in', description: 'Switch to officer@demo.com', path: '/officer/dashboard', account: 'officer@demo.com' },
  { step: 13, role: 'officer', title: 'Sees application queue', description: 'Filter queue by scheme, risk level, deficiency', path: '/officer/queue', account: 'officer@demo.com' },
  { step: 14, role: 'officer', title: 'Opens 3-Column Review page', description: 'Applicant profile, documents, and sticky AI panel', path: '/officer/applications/app_1', account: 'officer@demo.com' },
  { step: 15, role: 'officer', title: 'Inspects OCR and AI flags', description: 'Side-by-side preview, consistency gauge, risk findings', path: '/officer/applications/app_3', account: 'officer@demo.com' },
  { step: 16, role: 'officer', title: 'Requests clarification / raises deficiency', description: 'Creates structured deficiency with due date and category', path: '/officer/deficiencies', account: 'officer@demo.com' },
  { step: 17, role: 'applicant', title: 'Applicant receives notification', description: 'In-app notification and message thread in bell and center', path: '/applicant/notifications', account: 'applicant@demo.com' },
  { step: 18, role: 'applicant', title: 'Applicant resubmits corrected doc', description: 'Uploads corrected version under Deficiencies tab', path: '/applicant/deficiencies', account: 'applicant@demo.com' },
  { step: 19, role: 'officer', title: 'Officer verifies document & resolves', description: 'Marks Verified, resolves deficiency, audit logged', path: '/officer/applications/app_1', account: 'officer@demo.com' },
  { step: 20, role: 'officer', title: 'Application approved for next stage', description: 'Stage transitions from Verification to Screening', path: '/officer/queue', account: 'officer@demo.com' },
  { step: 21, role: 'selection', title: 'Selection Officer reviews candidates', description: 'Switch to selection@demo.com to view eligible candidates', path: '/officer/screening', account: 'selection@demo.com' },
  { step: 22, role: 'selection', title: 'Screening criteria & candidate compare', description: 'Weighted merit score, seat quota gauge, fairness note', path: '/officer/screening', account: 'selection@demo.com' },
  { step: 23, role: 'selection', title: 'Officer makes final decision', description: 'Shortlist / Select / Reject with recorded reason', path: '/officer/selection', account: 'selection@demo.com' },
  { step: 24, role: 'applicant', title: 'Applicant receives selection award notice', description: 'Award notification and official selection record', path: '/applicant/selection-result', account: 'applicant@demo.com' },
  { step: 25, role: 'applicant', title: 'Selected applicant in Post-Selection', description: 'Joining reports, undertaking, and Ph.D. progress records', path: '/applicant/post-selection', account: 'applicant@demo.com' },
  { step: 26, role: 'admin', title: 'Admin views analytics & audit reports', description: 'Recharts analytics, Live Reports, and Audit Trail CSV', path: '/admin/dashboard', account: 'admin@demo.com' },
];

interface DemoWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoWalkthroughModal: React.FC<DemoWalkthroughModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, quickLoginAsRole } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

  if (!isOpen) return null;

  const toggleStep = (stepNum: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNum) ? prev.filter((s) => s !== stepNum) : [...prev, stepNum]
    );
  };

  const handleGoToStep = async (step: DemoStep) => {
    if (user?.role !== step.role) {
      await quickLoginAsRole(step.role);
    }
    navigate(step.path);
    if (!completedSteps.includes(step.step)) {
      setCompletedSteps((prev) => [...prev, step.step]);
    }
    onClose();
  };

  const progressPercent = Math.round((completedSteps.length / DEMO_STEPS.length) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">26-Step End-to-End Demo Script</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Step-by-step hackathon jury presentation walkthrough with 1-click role switching.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex-1 mr-4">
            <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
              <span>Demo Completion</span>
              <span>{completedSteps.length} of {DEMO_STEPS.length} steps ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-700 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => setCompletedSteps([])}
            title="Reset Checklist"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {DEMO_STEPS.map((s) => {
            const isDone = completedSteps.includes(s.step);
            const isCurrentRole = user?.role === s.role;

            return (
              <div
                key={s.step}
                className={`p-3.5 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-slate-50/60 border-slate-200 text-slate-600'
                    : 'bg-white border-slate-200 hover:border-indigo-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleStep(s.step)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-slate-400">Step {s.step}</span>
                      <span
                        className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                          s.role === 'applicant'
                            ? 'bg-blue-100 text-blue-800'
                            : s.role === 'officer'
                            ? 'bg-amber-100 text-amber-800'
                            : s.role === 'selection'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {s.role}
                      </span>
                      {isCurrentRole && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Active Role
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 mt-1">{s.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
                  </div>

                  <button
                    onClick={() => handleGoToStep(s)}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors"
                  >
                    <span>Run</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>All credentials: password is <code className="bg-slate-200 px-1 rounded">Demo@123</code></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-medium text-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
