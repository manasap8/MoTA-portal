import React, { useState, useEffect } from 'react';
import { FolderOpen, PlusCircle, Check, X, Save } from 'lucide-react';
import { api } from '../../services/api';
import { Scheme, RequiredDocumentConfig } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminDocumentsConfigPage: React.FC = () => {
  const { showToast } = useToast();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState('scheme_nfst');
  const [docs, setDocs] = useState<RequiredDocumentConfig[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const list = await api.getSchemes();
        setSchemes(list);
        if (list.length > 0) {
          setSelectedSchemeId(list[0].id);
          setDocs(list[0].requiredDocuments || []);
        }
      } catch (e) {}
    };
    fetch();
  }, []);

  const handleSelectScheme = (sId: string) => {
    setSelectedSchemeId(sId);
    const found = schemes.find((s) => s.id === sId);
    if (found) setDocs(found.requiredDocuments || []);
  };

  const handleToggleMandatory = async (docId: string) => {
    const updated = docs.map((d) => (d.id === docId ? { ...d, mandatory: !d.mandatory } : d));
    setDocs(updated);
    try {
      setSaving(true);
      await api.updateDocs(selectedSchemeId, updated);
      showToast('Document requirement configuration saved.', 'success');
    } catch (err) {
      showToast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Required Document Configuration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define mandatory certificates, allowed MIME formats, and size ceilings per scheme.
          </p>
        </div>

        <select
          value={selectedSchemeId}
          onChange={(e) => handleSelectScheme(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-indigo-900"
        >
          {schemes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code}: {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Required Certificates Matrix ({docs.length})
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {docs.map((doc) => (
            <div key={doc.id} className="p-4 flex items-center justify-between gap-4 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{doc.title}</span>
                  <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                    {doc.code}
                  </code>
                </div>
                <p className="text-slate-500 mt-0.5">{doc.description}</p>
                <span className="text-[11px] text-slate-400">
                  Allowed: {doc.allowedFormats.join(', ')} • Max: {doc.maxSizeMB} MB
                </span>
              </div>

              <button
                onClick={() => handleToggleMandatory(doc.id)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                  doc.mandatory
                    ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {doc.mandatory ? 'Mandatory (Required)' : 'Optional Upload'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
