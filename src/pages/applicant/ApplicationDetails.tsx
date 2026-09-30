import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  FolderOpen,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  Calendar,
  Check,
  X,
  FileCheck2,
} from 'lucide-react';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RiskBadge } from '../../components/common/RiskBadge';
import { TagBadge } from '../../components/common/TagBadge';

export const ApplicationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'data' | 'documents' | 'consistency' | 'eligibility' | 'deficiencies'>('data');

  useEffect(() => {
    const fetchApp = async () => {
      try {
        setLoading(true);
        if (id) {
          const res = await api.getApplicationById(id);
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load application details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [id]);

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-500">
        <Clock className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
        <span>Loading application record...</span>
      </div>
    );
  }

  if (!data?.application) {
    return (
      <div className="py-16 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Application not found</h2>
        <Link to="/applicant/my-applications" className="text-xs text-indigo-700 font-semibold hover:underline mt-2 inline-block">
          ← Back to My Applications
        </Link>
      </div>
    );
  }

  const { application, scheme, documents, deficiencies, consistency, eligibility } = data;
  const appData = application.data || {};

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              to="/applicant/my-applications"
              className="text-xs text-slate-400 hover:text-indigo-700 font-semibold flex items-center gap-1 mb-1.5"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to My Applications</span>
            </Link>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{application.applicationNumber}</h1>
              <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded">
                {scheme?.code || application.schemeId.toUpperCase()}
              </span>
              <StatusBadge status={application.status} size="sm" />
              {application.riskLevel && (
                <RiskBadge level={application.riskLevel} score={application.consistencyScore} />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Applicant: <strong>{application.applicantName}</strong> • Submitted:{' '}
              {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : 'Draft'} • Stage:{' '}
              <span className="font-semibold text-slate-700">{application.currentStage}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/applicant/deficiencies"
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-2xs transition-colors"
            >
              Manage Deficiencies
            </Link>
            <Link
              to="/applicant/communication"
              className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors"
            >
              Message Desk
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-t border-slate-100 mt-5 pt-3 overflow-x-auto">
          {[
            { key: 'data', label: 'Application Data', icon: FileText },
            { key: 'documents', label: `Documents (${documents?.length || 0})`, icon: FolderOpen },
            { key: 'consistency', label: 'Consistency & AI Risk', icon: Sparkles },
            { key: 'eligibility', label: 'Statutory Eligibility', icon: ShieldCheck },
            {
              key: 'deficiencies',
              label: `Deficiencies (${deficiencies?.filter((d: any) => d.status !== 'Resolved').length || 0})`,
              icon: AlertTriangle,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'data' && (
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-2xs space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                1. Personal & Tribal Details
              </h3>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <dt className="text-slate-400">Full Name:</dt>
                <dd className="font-semibold text-slate-800">{appData.fullName || application.applicantName}</dd>
                <dt className="text-slate-400">Father's Name:</dt>
                <dd className="font-semibold text-slate-800">{appData.fatherName || 'Ramesh Kumar Soren'}</dd>
                <dt className="text-slate-400">Date of Birth:</dt>
                <dd className="font-semibold text-slate-800">{appData.dob || '1998-05-12'}</dd>
                <dt className="text-slate-400">Category:</dt>
                <dd className="font-semibold text-slate-800">Scheduled Tribe (ST)</dd>
                <dt className="text-slate-400">ST Certificate No:</dt>
                <dd className="font-semibold text-slate-800">{appData.stCertNumber || 'ST/JH/2023/88492'}</dd>
                <dt className="text-slate-400">Issuing Authority:</dt>
                <dd className="font-semibold text-slate-800">{appData.stCertAuthority || 'Sub-Divisional Officer'}</dd>
              </dl>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                2. Academic & Research Programme
              </h3>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <dt className="text-slate-400">Highest Degree:</dt>
                <dd className="font-semibold text-slate-800">{appData.highestQualification || "Master's degree"}</dd>
                <dt className="text-slate-400">Degree Title:</dt>
                <dd className="font-semibold text-slate-800">{appData.postgraduateDegree || appData.qualifyingDegree || 'M.Sc. Anthropology'}</dd>
                <dt className="text-slate-400">Aggregate Score:</dt>
                <dd className="font-semibold text-slate-800">{appData.postgraduatePercentage || appData.marksPercentage || '74.5'}%</dd>
                <dt className="text-slate-400">Research Institution:</dt>
                <dd className="font-semibold text-slate-800">{appData.researchInstitution || appData.foreignUniversity || 'Delhi University'}</dd>
                <dt className="text-slate-400">Thesis Topic:</dt>
                <dd className="font-semibold text-slate-800 col-span-2 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {appData.researchTopic || 'Ethnobotanical Traditions of Santhal Community in Chota Nagpur Plateau'}
                </dd>
              </dl>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                3. Financial & Income Details
              </h3>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <dt className="text-slate-400">Annual Family Income:</dt>
                <dd className="font-semibold text-slate-800">₹{Number(appData.annualIncome || 320000).toLocaleString('en-IN')}</dd>
                <dt className="text-slate-400">Income Certificate:</dt>
                <dd className="font-semibold text-slate-800">{appData.incomeCertNumber || 'INC/2024/77481'}</dd>
              </dl>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                4. Bank Account (Direct Benefit Transfer)
              </h3>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <dt className="text-slate-400">Bank Name:</dt>
                <dd className="font-semibold text-slate-800">{appData.bankName || 'State Bank of India'}</dd>
                <dt className="text-slate-400">Account Number:</dt>
                <dd className="font-semibold text-slate-800">{appData.accountNumber || '30987654321'}</dd>
                <dt className="text-slate-400">IFSC Code:</dt>
                <dd className="font-semibold text-slate-800">{appData.ifscCode || 'SBIN0001234'}</dd>
              </dl>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Uploaded Documents & OCR Extractions</h3>
            <TagBadge type="ai" label="OCR Document Intelligence" />
          </div>

          <div className="divide-y divide-slate-100">
            {documents?.map((doc: any) => (
              <div key={doc.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{doc.title}</h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      v{doc.version}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        doc.verificationStatus === 'Verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.verificationStatus === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {doc.verificationStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    File: {doc.originalFileName} ({(doc.fileSize / 1024).toFixed(1)} KB) • Uploaded:{' '}
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>

                  {/* OCR Extracted details snippet */}
                  {doc.extractedData && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2 space-y-0.5">
                      <span className="font-semibold text-slate-700 block">Extracted Certificate Information:</span>
                      <div>Name: <strong>{doc.extractedData.name || 'N/A'}</strong></div>
                      {doc.extractedData.certificateNumber && (
                        <div>Cert No: <strong>{doc.extractedData.certificateNumber}</strong></div>
                      )}
                      {doc.extractedData.issuingAuthority && (
                        <div>Authority: <strong>{doc.extractedData.issuingAuthority}</strong></div>
                      )}
                    </div>
                  )}
                </div>

                <a
                  href={`/api/documents/${doc.id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-1 shrink-0 shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Document</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'consistency' && consistency && (
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Document Consistency & Risk Evaluation</h3>
              <p className="text-xs text-slate-500">Cross-checked across identity, tribal credentials and marks.</p>
            </div>
            <TagBadge type="ai" label="AI-assisted finding" />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-3xl font-black text-slate-900">{consistency.score}/100</div>
              <div className="mt-1">
                <RiskBadge level={consistency.riskLevel} />
              </div>
            </div>
            <p className="text-xs text-slate-600 max-w-lg leading-relaxed">{consistency.plainExplanation}</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Automated Consistency Findings</h4>
            <div className="space-y-2">
              {consistency.findings.map((finding: any) => (
                <div
                  key={finding.id}
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
                    finding.status === 'FAIL'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : finding.status === 'WARNING'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {finding.status === 'FAIL' && <X className="w-4 h-4 text-rose-600" />}
                    {finding.status === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    {finding.status === 'PASS' && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold block">{finding.title}</span>
                    <span className="mt-0.5 block opacity-90">{finding.details}</span>
                  </div>
                  {finding.weightDeduction > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/70 border border-current shrink-0">
                      -{finding.weightDeduction} pts
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'eligibility' && eligibility && (
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Statutory Eligibility Evaluation</h3>
              <p className="text-xs text-slate-500">Pure rule-based deterministic evaluation against scheme guidelines.</p>
            </div>
            <TagBadge type="rule" label="Rule-based result" />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Result:</span>
            <div className="text-base font-bold text-slate-900 mt-0.5">{eligibility.overallStatus}</div>
            <p className="text-xs text-slate-600 mt-1">{eligibility.explanation}</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Criteria Breakdown</h4>
            <div className="space-y-2">
              {eligibility.criteriaResults.map((c: any) => (
                <div key={c.criterionId} className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{c.criterion}</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        c.status === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'FAIL'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1">{c.evidence}</p>
                  <p className="text-[11px] text-indigo-700 font-semibold mt-1">Recommended Action: {c.recommendedAction}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'deficiencies' && (
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Deficiency Items</h3>
            <Link
              to="/applicant/deficiencies"
              className="text-xs font-bold text-indigo-700 hover:underline"
            >
              Open Deficiency Resolution Center →
            </Link>
          </div>

          {deficiencies?.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No deficiency items recorded. All requirements satisfied!
            </div>
          ) : (
            <div className="space-y-3">
              {deficiencies.map((d: any) => (
                <div key={d.id} className="p-4 rounded-xl border border-orange-200 bg-orange-50/50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-orange-950">{d.title}</span>
                    <span className="font-semibold text-orange-800 bg-orange-100 px-2 py-0.5 rounded">
                      Status: {d.status}
                    </span>
                  </div>
                  <p className="text-orange-900 mt-1">{d.description}</p>
                  <div className="text-[11px] text-orange-700 mt-2 font-medium">
                    Due Date: {d.dueDate} • Raised By: {d.raisedBy}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
