import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Upload,
  Sparkles,
  FileText,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck2,
} from 'lucide-react';
import { api } from '../../services/api';
import { Application, ApplicationDocument } from '../../types';
import { useToast } from '../../context/ToastContext';
import { TagBadge } from '../../components/common/TagBadge';

export const ApplicantDocumentsPage: React.FC = () => {
  const { showToast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [sampleDocsCatalog, setSampleDocsCatalog] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [apps, catalog] = await Promise.all([
          api.getApplications(),
          api.getSampleDocuments(),
        ]);
        setApplications(apps);
        setSampleDocsCatalog(catalog);
        if (apps.length > 0) {
          setSelectedAppId(apps[0].id);
          const appDetails = await api.getApplicationById(apps[0].id);
          setDocuments(appDetails.documents || []);
        }
      } catch (err) {
        console.error('Error loading documents page:', err);
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
      const res = await api.getApplicationById(appId);
      setDocuments(res.documents || []);
    } catch (e) {
      //
    } finally {
      setLoading(false);
    }
  };

  const handleAttachSample = async (docType: string, scenario: string) => {
    if (!selectedAppId) return;
    try {
      showToast('Attaching sample document...', 'info');
      const res = await api.attachSampleDoc({
        applicationId: selectedAppId,
        docType,
        sampleScenario: scenario,
      });
      setDocuments((prev) => [...prev.filter((d) => d.docType !== docType), res.document]);
      showToast('Sample document attached & OCR processed successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to attach sample doc', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Document Management Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your statutory certificates, inspect extracted OCR data, and resolve document requests.
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

      {/* Preset Sample Documents Library */}
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1-Click Sample Test Documents
            </h3>
          </div>
          <TagBadge type="ai" label="Instant OCR Parsing" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => handleAttachSample('st_certificate', 'matching')}
            className="p-3 text-left rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors shadow-2xs"
          >
            <span className="text-xs font-bold text-indigo-900 block">ST Certificate (Matching)</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Consistent name, DOB and tribe</span>
          </button>

          <button
            onClick={() => handleAttachSample('st_certificate', 'mismatch_name')}
            className="p-3 text-left rounded-xl border border-amber-200 bg-amber-50/30 hover:bg-amber-100/50 transition-colors shadow-2xs"
          >
            <span className="text-xs font-bold text-amber-900 block">ST Cert (Name Mismatch)</span>
            <span className="text-[11px] text-amber-700/80 mt-0.5 block">"Rahul K." instead of "Rahul Kumar"</span>
          </button>

          <button
            onClick={() => handleAttachSample('income_certificate', 'expired')}
            className="p-3 text-left rounded-xl border border-rose-200 bg-rose-50/30 hover:bg-rose-100/50 transition-colors shadow-2xs"
          >
            <span className="text-xs font-bold text-rose-900 block">Income Cert (Expired)</span>
            <span className="text-[11px] text-rose-700/80 mt-0.5 block">Validity lapsed in FY 2023</span>
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Uploaded Files on Record ({documents.length})
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No documents uploaded for this application yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div key={doc.id} className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{doc.title}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      v{doc.version}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
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

                  <p className="text-xs text-slate-500">
                    Filename: <strong>{doc.originalFileName}</strong> • Size: {(doc.fileSize / 1024).toFixed(1)} KB • Uploaded:{' '}
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>

                  {/* Extracted Fields Table */}
                  {doc.extractedData && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="font-bold text-slate-700 mb-2 flex items-center justify-between">
                        <span>Extracted Intelligence Fields:</span>
                        <span className="text-[10px] text-slate-400 uppercase">Provider: {doc.extractedData.provider}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {doc.extractedData.name && (
                          <div>
                            <span className="text-[10px] text-slate-400 block">Name:</span>
                            <span className="font-semibold text-slate-800">{doc.extractedData.name}</span>
                          </div>
                        )}
                        {doc.extractedData.dob && (
                          <div>
                            <span className="text-[10px] text-slate-400 block">DOB:</span>
                            <span className="font-semibold text-slate-800">{doc.extractedData.dob}</span>
                          </div>
                        )}
                        {doc.extractedData.certificateNumber && (
                          <div>
                            <span className="text-[10px] text-slate-400 block">Cert No:</span>
                            <span className="font-semibold text-slate-800">{doc.extractedData.certificateNumber}</span>
                          </div>
                        )}
                        {doc.extractedData.issuingAuthority && (
                          <div>
                            <span className="text-[10px] text-slate-400 block">Authority:</span>
                            <span className="font-semibold text-slate-800">{doc.extractedData.issuingAuthority}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/api/documents/${doc.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl inline-flex items-center gap-1 shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View File</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
