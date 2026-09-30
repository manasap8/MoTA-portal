import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  FolderOpen,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  XCircle,
  HelpCircle,
  Clock,
  Send,
  History,
  Check,
  X,
  FileCheck2,
  UserCheck,
  Award,
  Edit2,
  Save,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RiskBadge } from '../../components/common/RiskBadge';
import { TagBadge } from '../../components/common/TagBadge';

export const OfficerReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'data' | 'documents' | 'timeline' | 'deficiencies' | 'communication' | 'audit'>('data');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [editingExtraction, setEditingExtraction] = useState(false);
  const [extractionForm, setExtractionForm] = useState<any>({});

  // Modals
  const [showDeficiencyModal, setShowDeficiencyModal] = useState(false);
  const [defCategory, setDefCategory] = useState<string>('Document Mismatch');
  const [defTitle, setDefTitle] = useState('');
  const [defDescription, setDefDescription] = useState('');
  const [defDueDate, setDefDueDate] = useState('');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [selectedFlag, setSelectedFlag] = useState<any>(null);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const targetId = id || 'app_1';
      const res = await api.getApplicationById(targetId);
      setData(res);
      if (res.documents?.length > 0 && !selectedDocId) {
        setSelectedDocId(res.documents[0].id);
        setExtractionForm(res.documents[0].extractedData || {});
      }
    } catch (err) {
      console.error('Failed to load application:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-500">
        <Clock className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
        <span>Loading 3-Column Officer Workstation...</span>
      </div>
    );
  }

  if (!data?.application) {
    return (
      <div className="py-20 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Application not found</h2>
        <Link to="/officer/queue" className="text-xs text-indigo-700 font-semibold hover:underline mt-2 inline-block">
          ← Back to Queue
        </Link>
      </div>
    );
  }

  const { application, scheme, documents, deficiencies, consistency, eligibility, selection } = data;
  const appData = application.data || {};
  const currentDoc = documents?.find((d: any) => d.id === selectedDocId) || documents?.[0];
  const openDeficiencies = (deficiencies || []).filter((d: any) => d.status === 'Open' || d.status === 'Resubmitted');

  // Officer Actions
  const handleVerifyDoc = async (docId: string) => {
    try {
      await api.verifyDoc(docId, 'Verified authentic by officer.');
      showToast('Document verified successfully.', 'success');
      await fetchApplication();
    } catch (err: any) {
      showToast(err.message || 'Verification failed', 'error');
    }
  };

  const handleRejectDoc = async () => {
    if (!currentDoc || !rejectReason.trim()) return;
    try {
      await api.rejectDoc(currentDoc.id, rejectReason.trim());
      showToast('Document marked as Rejected and deficiency raised.', 'success');
      setShowRejectModal(false);
      setRejectReason('');
      await fetchApplication();
    } catch (err: any) {
      showToast(err.message || 'Rejection failed', 'error');
    }
  };

  const handleRaiseDeficiency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defTitle.trim() || !defDescription.trim()) return;

    try {
      await api.raiseDeficiency({
        applicationId: application.id,
        documentId: currentDoc?.id,
        category: defCategory,
        title: defTitle,
        description: defDescription,
        linkedField: currentDoc?.docType || 'general',
        dueDate: defDueDate || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      showToast('Deficiency raised and applicant notified.', 'success');
      setShowDeficiencyModal(false);
      setDefTitle('');
      setDefDescription('');
      await fetchApplication();
    } catch (err: any) {
      showToast(err.message || 'Failed to raise deficiency', 'error');
    }
  };

  const handleApproveNextStage = async () => {
    if (openDeficiencies.length > 0) {
      showToast(`Cannot advance: ${openDeficiencies.length} open deficiency items pending resolution!`, 'error');
      return;
    }

    try {
      const nextStage =
        application.currentStage === 'DOC_VERIF'
          ? 'ELIG_EVAL'
          : application.currentStage === 'ELIG_EVAL'
          ? 'SCREENING'
          : 'FINAL_DECISION';

      await api.transitionStage(application.id, {
        targetStage: nextStage,
        targetStatus: 'Eligible',
        remarks: 'Document verification and statutory checks completed.',
      });
      showToast(`Application successfully advanced to ${nextStage}!`, 'success');
      await fetchApplication();
    } catch (err: any) {
      showToast(err.message || 'Failed to transition stage', 'error');
    }
  };

  const handleShortlist = async () => {
    try {
      await api.saveSelectionDecision({
        applicationId: application.id,
        decision: 'Shortlist',
        remarks: 'Candidate shortlisted based on verified academic merit.',
      });
      showToast('Candidate successfully shortlisted!', 'success');
      await fetchApplication();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleSaveExtraction = async () => {
    if (!currentDoc) return;
    try {
      await api.editExtraction(currentDoc.id, extractionForm);
      showToast('Extracted OCR fields updated and consistency recalculated.', 'success');
      setEditingExtraction(false);
      await fetchApplication();
    } catch (err: any) {
      showToast(err.message || 'Failed to update extraction', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Sticky Action Bar */}
      <div className="sticky top-14 z-20 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/officer/queue"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">{application.applicationNumber}</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800">
                {application.schemeId.toUpperCase()}
              </span>
              <StatusBadge status={application.status} size="sm" />
            </div>
            <p className="text-xs text-slate-500">
              Stage: <strong>{application.currentStage}</strong> • Applicant: {application.applicantName}
            </p>
          </div>
        </div>

        {/* Action Buttons with Contextual Enabling and Tooltips */}
        <div className="flex items-center gap-2 flex-wrap">
          {currentDoc && (
            <>
              <button
                onClick={() => handleVerifyDoc(currentDoc.id)}
                disabled={currentDoc.verificationStatus === 'Verified'}
                title={currentDoc.verificationStatus === 'Verified' ? 'Document is already verified' : 'Mark document Verified'}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Verify Doc</span>
              </button>

              <button
                onClick={() => setShowRejectModal(true)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject Doc</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              setDefTitle(`Deficiency on ${currentDoc?.title || 'Application'}`);
              setDefDescription('');
              setDefDueDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
              setShowDeficiencyModal(true);
            }}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Raise Deficiency</span>
          </button>

          <button
            onClick={handleApproveNextStage}
            disabled={openDeficiencies.length > 0}
            title={openDeficiencies.length > 0 ? `Blocked by ${openDeficiencies.length} open deficiencies` : 'Advance stage'}
            className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Approve for Next Stage</span>
          </button>

          <button
            onClick={handleShortlist}
            className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Shortlist</span>
          </button>
        </div>
      </div>

      {/* 3-Column Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMN 1: Applicant Profile Card (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs space-y-4">
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-indigo-900 text-amber-400 font-black text-lg flex items-center justify-center mx-auto shadow-sm">
                {application.applicantName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
              </div>
              <h2 className="text-sm font-bold text-slate-900 mt-2">{application.applicantName}</h2>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                Category: Scheduled Tribe (ST)
              </span>
            </div>

            <div className="text-xs space-y-2 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Email & Contact:</span>
                <span className="font-semibold text-slate-800 truncate block">{application.applicantEmail}</span>
                <span className="text-slate-500">{appData.mobile || '9876543210'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Date of Birth & Age:</span>
                <span className="font-semibold text-slate-800">{appData.dob || '1998-05-12'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Domicile State & District:</span>
                <span className="font-semibold text-slate-800">{appData.state || 'Jharkhand'}, {appData.district || 'Ranchi'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">ST Certificate No:</span>
                <span className="font-semibold text-slate-800">{appData.stCertNumber || 'ST/JH/2023/88492'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Annual Family Income:</span>
                <span className="font-semibold text-slate-800">₹{Number(appData.annualIncome || 320000).toLocaleString('en-IN')}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Postgraduate Marks:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {appData.postgraduatePercentage || appData.marksPercentage || '74.5'}%
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Total Documents:</span>
              <span className="font-bold text-slate-800">{documents?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Workstation Center Tabs (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            {/* Tab navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50/60 overflow-x-auto px-2 pt-2">
              {[
                { key: 'data', label: 'Application Data', icon: FileText },
                { key: 'documents', label: `Documents (${documents?.length || 0})`, icon: FolderOpen },
                { key: 'deficiencies', label: `Deficiencies (${deficiencies?.length || 0})`, icon: AlertTriangle },
                { key: 'communication', label: 'Comments / Messages', icon: MessageSquare },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-indigo-700 text-indigo-900 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content Body */}
            <div className="p-5">
              {activeTab === 'data' && (
                <div className="space-y-4 text-xs">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                    Submitted Application Form Data
                  </h3>
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {Object.entries(appData).map(([k, v]) => (
                      <div key={k} className="overflow-hidden">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">{k}:</span>
                        <span className="font-medium text-slate-800 truncate block">
                          {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-4">
                  {/* Document Selector Pills */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {documents?.map((d: any) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          setSelectedDocId(d.id);
                          setExtractionForm(d.extractedData || {});
                          setEditingExtraction(false);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                          currentDoc?.id === d.id
                            ? 'bg-indigo-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>{d.title}</span>
                        {d.verificationStatus === 'Verified' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : d.verificationStatus === 'Rejected' ? (
                          <X className="w-3 h-3 text-rose-400" />
                        ) : null}
                      </button>
                    ))}
                  </div>

                  {currentDoc && (
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{currentDoc.title}</h4>
                          <p className="text-[11px] text-slate-500">
                            Version {currentDoc.version} • {currentDoc.originalFileName}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`/api/documents/${currentDoc.id}/file`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </a>
                        </div>
                      </div>

                      {/* OCR Extracted Fields & Officer Edit */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            Extracted Certificate Fields (OCR Intelligence):
                          </span>
                          {!editingExtraction ? (
                            <button
                              onClick={() => setEditingExtraction(true)}
                              className="text-indigo-700 hover:underline font-semibold flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit Values</span>
                            </button>
                          ) : (
                            <button
                              onClick={handleSaveExtraction}
                              className="text-emerald-700 hover:underline font-semibold flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              <span>Save Extraction</span>
                            </button>
                          )}
                        </div>

                        {editingExtraction ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block">Extracted Name:</label>
                              <input
                                type="text"
                                value={extractionForm.name || ''}
                                onChange={(e) => setExtractionForm({ ...extractionForm, name: e.target.value })}
                                className="w-full text-xs border rounded-lg px-2 py-1 mt-0.5"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block">Extracted DOB:</label>
                              <input
                                type="text"
                                value={extractionForm.dob || ''}
                                onChange={(e) => setExtractionForm({ ...extractionForm, dob: e.target.value })}
                                className="w-full text-xs border rounded-lg px-2 py-1 mt-0.5"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block">Certificate Number:</label>
                              <input
                                type="text"
                                value={extractionForm.certificateNumber || ''}
                                onChange={(e) => setExtractionForm({ ...extractionForm, certificateNumber: e.target.value })}
                                className="w-full text-xs border rounded-lg px-2 py-1 mt-0.5"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block">Issuing Authority:</label>
                              <input
                                type="text"
                                value={extractionForm.issuingAuthority || ''}
                                onChange={(e) => setExtractionForm({ ...extractionForm, issuingAuthority: e.target.value })}
                                className="w-full text-xs border rounded-lg px-2 py-1 mt-0.5"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 text-slate-700">
                            <div>Name: <strong>{currentDoc.extractedData?.name || 'N/A'}</strong></div>
                            <div>DOB: <strong>{currentDoc.extractedData?.dob || 'N/A'}</strong></div>
                            <div>Cert No: <strong>{currentDoc.extractedData?.certificateNumber || 'N/A'}</strong></div>
                            <div>Authority: <strong>{currentDoc.extractedData?.issuingAuthority || 'N/A'}</strong></div>
                            <div>Marks / Percentage: <strong>{currentDoc.extractedData?.marksPercentage ?? 'N/A'}%</strong></div>
                            <div>Expiry Date: <strong>{currentDoc.extractedData?.expiryDate || 'Active / Lifetime'}</strong></div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'deficiencies' && (
                <div className="space-y-3">
                  {deficiencies?.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No deficiency items logged.</p>
                  ) : (
                    deficiencies.map((d: any) => (
                      <div key={d.id} className="p-3.5 rounded-xl border border-orange-200 bg-orange-50/40 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-orange-950">{d.title}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                            {d.status}
                          </span>
                        </div>
                        <p className="text-orange-900">{d.description}</p>
                        <div className="text-[11px] text-orange-700 pt-1 flex justify-between">
                          <span>Due: {d.dueDate}</span>
                          <span>Raised by: {d.raisedBy}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'communication' && (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-500">Official comments thread regarding this application.</p>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-700 block">Internal Officer Note:</span>
                    <p className="text-slate-600">
                      Application passed initial screening. ST Certificate verified against district portal record.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 3: Sticky AI Intelligence Panel (3 cols) */}
        <div className="lg:col-span-3 space-y-4 sticky top-36">
          {/* Consistency Gauge Card */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Automated Consistency
              </h3>
              <TagBadge type="ai" size="sm" />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-3xl font-black text-slate-900">{consistency?.score || 85}%</span>
              <div className="mt-1">
                <RiskBadge level={consistency?.riskLevel || 'LOW'} />
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              {consistency?.plainExplanation || 'All cross-document identity and academic metrics match.'}
            </p>

            {/* Findings preview */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Flagged Checks ({consistency?.findings?.length || 0})
              </span>
              {consistency?.findings?.map((f: any) => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFlag(f)}
                  className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-100 cursor-pointer text-[11px] flex items-center justify-between transition-colors"
                >
                  <span className="font-semibold text-slate-800 truncate mr-1">{f.title}</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0 ${
                      f.status === 'FAIL' ? 'text-rose-700 bg-rose-100' : f.status === 'WARNING' ? 'text-amber-700 bg-amber-100' : 'text-emerald-700 bg-emerald-100'
                    }`}
                  >
                    {f.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Statutory Eligibility Card */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Statutory Eligibility
              </h3>
              <TagBadge type="rule" size="sm" />
            </div>

            <div className="text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Rule Engine Result:</span>
              <span className="font-bold text-emerald-800 text-sm">{eligibility?.overallStatus || 'Eligible'}</span>
            </div>

            <div className="space-y-1.5 pt-1 text-xs">
              {eligibility?.criteriaResults?.slice(0, 4).map((c: any) => (
                <div key={c.criterionId} className="flex items-center justify-between py-1 border-b border-slate-100 text-[11px]">
                  <span className="truncate text-slate-600 mr-2">{c.criterion}</span>
                  <span className={`font-bold ${c.status === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Raise Deficiency Modal */}
      {showDeficiencyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-bold text-slate-900">Raise Statutory Deficiency</h3>
              <button onClick={() => setShowDeficiencyModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRaiseDeficiency} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deficiency Category *</label>
                <select
                  value={defCategory}
                  onChange={(e) => setDefCategory(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                >
                  <option value="Document Mismatch">Document Mismatch</option>
                  <option value="Missing Document">Missing Document</option>
                  <option value="Expired Certificate">Expired Certificate</option>
                  <option value="Clarification Required">Clarification Required</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deficiency Title *</label>
                <input
                  type="text"
                  required
                  value={defTitle}
                  onChange={(e) => setDefTitle(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Officer Description & Requirements *</label>
                <textarea
                  rows={3}
                  required
                  value={defDescription}
                  onChange={(e) => setDefDescription(e.target.value)}
                  placeholder="Clearly state what the applicant must upload or clarify..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={defDueDate}
                  onChange={(e) => setDefDueDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeficiencyModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Raise Deficiency & Notify Applicant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Document Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-rose-900">Reject Document: {currentDoc?.title}</h3>
            <p className="text-xs text-slate-600">
              Rejecting this document will mark it as Rejected and automatically create an open deficiency for the applicant.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Rejection Reason *</label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="State why document was rejected (e.g. illegible seal, expired validity, wrong name)..."
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectDoc}
                disabled={!rejectReason.trim()}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "Why was this flagged?" Modal */}
      {selectedFlag && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  AI Explainability Panel
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedFlag.title}</h3>
              </div>
              <button onClick={() => setSelectedFlag(null)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div>
                <span className="font-bold text-slate-700 block">Conflict Details:</span>
                <span className="text-slate-800">{selectedFlag.details}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Deduction Impact:</span>
                <span className="text-slate-600">-{selectedFlag.weightDeduction} points from score breakdown.</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedFlag(null)}
              className="w-full py-2 bg-indigo-700 text-white font-bold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
