import React, { useState, useEffect } from 'react';
import {
  Compass,
  FileCheck2,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlusCircle,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import { api } from '../../services/api';
import { PostSelectionRecord, ProgressRecord, Application } from '../../types';
import { useToast } from '../../context/ToastContext';

export const ApplicantPostSelectionPage: React.FC = () => {
  const { showToast } = useToast();
  const [record, setRecord] = useState<PostSelectionRecord | null>(null);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [application, setApplication] = useState<Application | null>(null);
  const [disclaimer, setDisclaimer] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // New progress submission form state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [semesterOrYear, setSemesterOrYear] = useState('Semester 2 (Feb 2025 - Jul 2025)');
  const [progressTitle, setProgressTitle] = useState('');
  const [researchSummary, setResearchSummary] = useState('');
  const [supervisorRemarks, setSupervisorRemarks] = useState('');
  const [submittingProgress, setSubmittingProgress] = useState(false);

  const fetchPostSelection = async () => {
    try {
      setLoading(true);
      const res = await api.getPostSelection();
      setRecord(res.record);
      setProgressRecords(res.progressRecords || []);
      setApplication(res.application || null);
      setDisclaimer(res.disclaimer || '');
    } catch (err) {
      console.warn('Post selection record error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostSelection();
  }, []);

  const handleDocumentSubmit = async (docCode: string, title: string) => {
    if (!record) return;
    try {
      showToast(`Submitting ${title}...`, 'info');
      const res = await api.submitPostSelectionDoc({
        applicationId: record.applicationId,
        docCode,
        title,
      });
      setRecord(res.record);
      showToast(`${title} submitted for verification.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error');
    }
  };

  const handleCreateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record || !researchSummary.trim()) return;

    try {
      setSubmittingProgress(true);
      const res = await api.submitProgress({
        applicationId: record.applicationId,
        semesterOrYear,
        progressTitle: progressTitle || 'Semester Progress Report',
        researchSummary,
        supervisorRemarks: supervisorRemarks || 'Candidate work satisfactory.',
      });
      setProgressRecords((prev) => [...prev, res.progressRecord]);
      setShowProgressModal(false);
      setProgressTitle('');
      setResearchSummary('');
      setSupervisorRemarks('');
      showToast('Semester progress report submitted to Ministry officer.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setSubmittingProgress(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading post-selection records...</div>;
  }

  if (!record) {
    return (
      <div className="bg-white p-8 border border-slate-200 rounded-2xl text-center space-y-3">
        <Compass className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">No Active Post-Selection Record Found</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Post-selection management is accessible for applicants who have been provisionally selected by the Selection Committee.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Post-Selection & Fellowship Portal</h1>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              Status: {record.joiningStatus}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage joining documents, compliance undertakings, and semester academic progress submissions.
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          Fellow: <strong>{record.applicantName}</strong> • {record.schemeId.toUpperCase()}
        </div>
      </div>

      {/* Award Specs Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs grid sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-400 block text-[11px] font-semibold">Sanctioned Fellowship Amount</span>
          <span className="text-base font-black text-slate-900 mt-1 block">{record.awardAmount}</span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-400 block text-[11px] font-semibold">Approved Duration</span>
          <span className="text-base font-black text-slate-900 mt-1 block">{record.durationYears} Years</span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-400 block text-[11px] font-semibold">Commencement Date</span>
          <span className="text-base font-black text-slate-900 mt-1 block">{record.startDate}</span>
        </div>
      </div>

      {/* Required Post-Selection Documents */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Mandatory Post-Selection Documents
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload institutional joining documents to activate fellowship disbursement records.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {record.requiredDocuments.map((doc: any) => (
            <div key={doc.code} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-800 block text-sm">{doc.title}</span>
                <span className="text-slate-500 text-[11px] mt-0.5 block">{doc.remarks || 'Standard requirement'}</span>
              </div>

              <div className="flex items-center gap-3">
                {doc.verified ? (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                ) : doc.submitted ? (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 font-semibold rounded-full flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Awaiting Officer Review</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleDocumentSubmit(doc.code, doc.title)}
                    className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload & Submit</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Records for Continuation (NFST) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Fellowship Academic Progress Records
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Semi-annual research progress reports for continuation approval.
            </p>
          </div>

          <button
            onClick={() => setShowProgressModal(true)}
            className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Submit Progress Report</span>
          </button>
        </div>

        {progressRecords.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No progress records submitted yet. First semester report due after 6 months.
          </div>
        ) : (
          <div className="space-y-3">
            {progressRecords.map((prog) => (
              <div key={prog.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{prog.semesterOrYear}</span>
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded-full ${
                      prog.officerApprovalStatus === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : prog.officerApprovalStatus === 'Rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Approval: {prog.officerApprovalStatus}
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block">Title: {prog.progressTitle}</span>
                  <p className="text-slate-600 mt-0.5">{prog.researchSummary}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Supervisor Remarks: {prog.supervisorRemarks}</span>
                  {prog.officerRemarks && <span className="font-semibold text-indigo-700">Officer: {prog.officerRemarks}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      {disclaimer && (
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{disclaimer}</span>
        </div>
      )}

      {/* Progress Report Submission Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Submit Semester Progress Report</h3>

            <form onSubmit={handleCreateProgress} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Semester / Reporting Period *
                </label>
                <input
                  type="text"
                  required
                  value={semesterOrYear}
                  onChange={(e) => setSemesterOrYear(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Progress Report Title *
                </label>
                <input
                  type="text"
                  required
                  value={progressTitle}
                  onChange={(e) => setProgressTitle(e.target.value)}
                  placeholder="e.g. Field Investigation & Specimen Archival"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Research Summary & Achievements *
                </label>
                <textarea
                  rows={4}
                  required
                  value={researchSummary}
                  onChange={(e) => setResearchSummary(e.target.value)}
                  placeholder="Summarize research progress, papers drafted, or field surveys conducted..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supervisor Endorsement Remarks
                </label>
                <input
                  type="text"
                  value={supervisorRemarks}
                  onChange={(e) => setSupervisorRemarks(e.target.value)}
                  placeholder="e.g. Progress verified on track with doctoral synopsis."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowProgressModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingProgress || !researchSummary.trim()}
                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  {submittingProgress ? 'Submitting...' : 'Submit Report for Officer Sign-off'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
