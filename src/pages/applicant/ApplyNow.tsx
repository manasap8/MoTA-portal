import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileCheck2,
  HelpCircle,
  ShieldCheck,
  Check,
  X,
  FileText,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Scheme, Application, RequiredDocumentConfig, ApplicationDocument } from '../../types';
import { TagBadge } from '../../components/common/TagBadge';

export const ApplyNowPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, applicantProfile } = useAuth();
  const { showToast } = useToast();

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [activeApplication, setActiveApplication] = useState<Application | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string>('Just now');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [sampleDocsCatalog, setSampleDocsCatalog] = useState<any[]>([]);

  // Load schemes & sample docs catalog
  useEffect(() => {
    const init = async () => {
      try {
        const [schemeList, sampleDocs] = await Promise.all([
          api.getSchemes(),
          api.getSampleDocuments(),
        ]);
        setSchemes(schemeList);
        setSampleDocsCatalog(sampleDocs);

        const targetCode = searchParams.get('scheme') || 'NFST';
        const found = schemeList.find(
          (s: Scheme) => s.code.toLowerCase() === targetCode.toLowerCase()
        ) || schemeList[0];
        if (found) {
          selectScheme(found);
        }
      } catch (err) {
        console.error('Failed to initialize apply page:', err);
      }
    };
    init();
  }, []);

  const selectScheme = async (scheme: Scheme) => {
    setSelectedScheme(scheme);
    setCurrentSectionIndex(0);

    // Initial form data prefilled from applicant profile
    const initialValues: Record<string, any> = {
      fullName: user?.fullName || '',
      email: user?.email || '',
      mobile: user?.mobile || '',
      category: 'ST',
      subTribe: 'Santhal',
      stCertNumber: applicantProfile?.stCertNumber || 'ST/JH/2023/88492',
      stCertAuthority: applicantProfile?.stCertAuthority || 'Sub-Divisional Officer, Ranchi',
      stCertDate: applicantProfile?.stCertDate || '2023-04-15',
      dob: applicantProfile?.dob || '1998-05-12',
      highestQualification: applicantProfile?.qualification || "Master's degree",
      annualIncome: applicantProfile?.annualIncome || 320000,
      bankName: applicantProfile?.bankName || 'State Bank of India',
      accountNumber: applicantProfile?.accountNumber || '30987654321',
      ifscCode: applicantProfile?.ifscCode || 'SBIN0001234',
      enrolledInResearch: 'yes',
      researchInstitution: 'Delhi University',
      researchDepartment: 'Department of Anthropology',
      researchTopic: 'Ethnobotanical Traditions of Santhal Community in Chota Nagpur Plateau',
      postgraduateDegree: 'M.Sc. in Anthropology',
      postgraduatePercentage: 74.5,
      ugDegree: 'B.Sc. Anthropology',
      ugPercentage: 71.0,
      foreignOffer: 'yes',
      foreignUniversity: 'University of Edinburgh',
      foreignCountry: 'United Kingdom',
      degreeAbroad: "Master's",
      qsRanking: 27,
      qualifyingDegree: "Bachelor's degree",
      marksPercentage: 74.5,
      agreedTerms: false,
    };
    setFormData(initialValues);

    // Create a working Draft application in the backend
    try {
      const draftRes = await api.createApplication({
        schemeId: scheme.id,
        initialData: initialValues,
      });
      setActiveApplication(draftRes.application);
      setLastSaved('Draft initialized');
    } catch (err: any) {
      console.warn('Draft initialization error:', err);
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);

    // Debounced autosave
    if (activeApplication) {
      setSaving(true);
      setTimeout(async () => {
        try {
          await api.updateApplication(activeApplication.id, { data: updated });
          setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } catch (e) {
          // ignore autosave errors
        } finally {
          setSaving(false);
        }
      }, 800);
    }
  };

  const handleManualSave = async () => {
    if (!activeApplication) return;
    try {
      setSaving(true);
      await api.updateApplication(activeApplication.id, { data: formData });
      setLastSaved('Saved just now');
      showToast('Application draft saved successfully.', 'success');
    } catch (err: any) {
      showToast('Failed to save draft.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 1-Click Sample Document Attachment
  const handleAttachSampleDoc = async (docType: string, scenario: string = 'standard') => {
    if (!activeApplication) return;
    try {
      showToast(`Attaching sample document for ${docType}...`, 'info');
      const res = await api.attachSampleDoc({
        applicationId: activeApplication.id,
        docType,
        sampleScenario: scenario,
      });
      setDocuments((prev) => {
        const filtered = prev.filter((d) => d.docType !== docType);
        return [...filtered, res.document];
      });
      showToast(`Sample ${docType} attached & analyzed!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to attach sample document.', 'error');
    }
  };

  // Pre-submission validation checks
  const getValidationErrors = (): string[] => {
    const errors: string[] = [];
    if (!formData.agreedTerms) {
      errors.push('You must accept the statutory applicant declaration.');
    }
    if (!formData.fullName) errors.push('Full name is required.');
    if (!formData.category) errors.push('Tribal category is required.');
    if (!formData.annualIncome) errors.push('Annual family income is required.');

    // Check mandatory documents
    if (selectedScheme) {
      const uploadedDocTypes = new Set(documents.map((d) => d.docType));
      const missingMandatory = selectedScheme.requiredDocuments.filter(
        (r) => r.mandatory && !uploadedDocTypes.has(r.code)
      );
      if (missingMandatory.length > 0) {
        errors.push(`Missing mandatory documents: ${missingMandatory.map((m) => m.title).join(', ')}`);
      }
    }

    return errors;
  };

  const handleSubmit = async () => {
    if (!activeApplication) return;
    const errors = getValidationErrors();
    if (errors.length > 0) {
      showToast(`Submission blocked: ${errors[0]}`, 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.updateApplication(activeApplication.id, { data: formData });
      const submitRes = await api.submitApplication(activeApplication.id);
      showToast('Application successfully submitted! Verification scrutiny underway.', 'success');
      navigate(`/applicant/applications/${activeApplication.id}`);
    } catch (err: any) {
      showToast(err.message || 'Application submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedScheme) {
    return (
      <div className="py-12 text-center">
        <Clock className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-600 mt-2">Loading scholarship schemes...</p>
      </div>
    );
  }

  const sections = selectedScheme.formSections || [];
  const currentSection = sections[currentSectionIndex];
  const progressPercent = Math.round(((currentSectionIndex + 1) / (sections.length + 1)) * 100);
  const validationErrors = getValidationErrors();

  return (
    <div className="space-y-6">
      {/* Top Header & Scheme Switcher */}
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
              New Application Wizard
            </span>
            <span className="text-xs font-semibold text-slate-400">
              App ID: {activeApplication?.applicationNumber || 'Generating...'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">{selectedScheme.name}</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Scheme Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {schemes.map((s) => (
              <button
                key={s.id}
                onClick={() => selectScheme(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedScheme.id === s.id
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s.code}
              </button>
            ))}
          </div>

          {/* Autosave status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            <Save className={`w-3.5 h-3.5 ${saving ? 'text-amber-500 animate-spin' : 'text-emerald-500'}`} />
            <span>{saving ? 'Autosaving...' : `Saved: ${lastSaved}`}</span>
          </div>

          <button
            onClick={handleManualSave}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
          >
            Save Draft
          </button>
        </div>
      </div>

      {/* Wizard Progress Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-2xs">
        <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
          <span>
            Section {currentSectionIndex + 1} of {sections.length + 1}: {currentSection?.title || 'Review & Submit'}
          </span>
          <span className="text-indigo-700">{progressPercent}% Completed</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-700 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Section Pill Buttons */}
        <div className="flex gap-2 overflow-x-auto pt-3 pb-1">
          {sections.map((sec, idx) => (
            <button
              key={sec.key}
              onClick={() => setCurrentSectionIndex(idx)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                currentSectionIndex === idx
                  ? 'bg-indigo-700 text-white'
                  : idx < currentSectionIndex
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sec.title}
            </button>
          ))}
          <button
            onClick={() => setCurrentSectionIndex(sections.length)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              currentSectionIndex === sections.length
                ? 'bg-indigo-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Review & Submit
          </button>
        </div>
      </div>

      {/* Dynamic Form Sections */}
      {currentSectionIndex < sections.length ? (
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-2xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">{currentSection.title}</h2>
            {currentSection.description && (
              <p className="text-xs text-slate-500 mt-0.5">{currentSection.description}</p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {currentSection.fields.map((field) => (
              <div
                key={field.key}
                className={field.type === 'textarea' || field.type === 'checkbox' ? 'sm:col-span-2' : ''}
              >
                {field.type !== 'checkbox' && (
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                )}

                {field.type === 'select' ? (
                  <select
                    value={formData[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                  >
                    <option value="">Select option...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder || 'Enter details...'}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                  />
                ) : field.type === 'checkbox' ? (
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData[field.key]}
                      onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-800 leading-snug">
                      {field.label}
                    </span>
                  </label>
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.key] ?? ''}
                    onChange={(e) =>
                      handleFieldChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)
                    }
                    placeholder={field.placeholder || `Enter ${field.label}`}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Section Navigation Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
              disabled={currentSectionIndex === 0}
              className="px-4 py-2 border border-slate-300 disabled:opacity-40 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Section</span>
            </button>

            <button
              onClick={() => setCurrentSectionIndex(currentSectionIndex + 1)}
              className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Next: {sections[currentSectionIndex + 1]?.title || 'Review & Submit'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Review & Document Upload & Submit Section */
        <div className="space-y-6">
          {/* Document Upload Zone with 1-Click Sample Document Attach */}
          <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Required Document Attachments</h3>
                <p className="text-xs text-slate-500">
                  Upload certificates or attach preset sample documents for instant automated OCR & consistency testing.
                </p>
              </div>
              <TagBadge type="ai" label="OCR Document Intelligence" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {selectedScheme.requiredDocuments.map((reqDoc) => {
                const uploaded = documents.find((d) => d.docType === reqDoc.code);

                return (
                  <div
                    key={reqDoc.id}
                    className={`p-4 rounded-xl border transition-all ${
                      uploaded
                        ? 'bg-emerald-50/50 border-emerald-300'
                        : reqDoc.mandatory
                        ? 'bg-slate-50 border-slate-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{reqDoc.title}</h4>
                          {reqDoc.mandatory && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{reqDoc.description}</p>
                      </div>

                      {uploaded ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" />
                          Attached
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                          Pending
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2 flex-wrap">
                      <button
                        onClick={() => handleAttachSampleDoc(reqDoc.code, 'standard')}
                        className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Use Sample Document</span>
                      </button>

                      {/* File upload input */}
                      <label className="cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !activeApplication) return;
                            const fd = new FormData();
                            fd.append('file', file);
                            fd.append('applicationId', activeApplication.id);
                            fd.append('docType', reqDoc.code);
                            fd.append('title', reqDoc.title);
                            try {
                              showToast(`Uploading and running OCR on ${file.name}...`, 'info');
                              const res = await api.uploadDocument(fd);
                              setDocuments((prev) => [...prev.filter((d) => d.docType !== reqDoc.code), res.document]);
                              showToast(`${reqDoc.title} uploaded & analyzed!`, 'success');
                            } catch (err: any) {
                              showToast(err.message || 'Upload failed.', 'error');
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statutory Declaration */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Statutory Applicant Declaration
            </h3>
            <label className="flex items-start gap-3 p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.agreedTerms}
                onChange={(e) => handleFieldChange('agreedTerms', e.target.checked)}
                className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-800 leading-relaxed font-medium">
                I hereby declare that all statements made in this application are true, complete and correct. I am a bonafide member of the Scheduled Tribe community. I understand that any false declaration or forged certificate will lead to immediate cancellation and recovery proceedings under Government of India guidelines.
              </span>
            </label>
          </div>

          {/* Validation Warnings (if blocked) */}
          {validationErrors.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Please complete the following before final submission:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-2 text-amber-800">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Final Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentSectionIndex(sections.length - 1)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Form</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={submitting || validationErrors.length > 0}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <span>{submitting ? 'Submitting & Evaluating...' : 'Submit Application (Lock & Evaluate)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
