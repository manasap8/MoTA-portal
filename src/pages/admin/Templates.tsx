import React, { useState } from 'react';
import { ScrollText, Save, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const AdminTemplatesPage: React.FC = () => {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState([
    {
      id: 'tpl_submit',
      name: 'Application Submission Confirmation',
      trigger: 'On Successful Submission',
      subject: 'Application {{applicationNumber}} Received - Ministry of Tribal Affairs',
      body: 'Dear {{applicantName}}, your application {{applicationNumber}} under {{schemeName}} has been registered and forwarded for Document Scrutiny.',
    },
    {
      id: 'tpl_deficiency',
      name: 'Deficiency Notice to Applicant',
      trigger: 'When Deficiency Raised by Officer',
      subject: 'Action Required: Deficiency Raised on Application {{applicationNumber}}',
      body: 'Dear {{applicantName}}, a deficiency was raised: {{deficiencyDescription}}. Please upload corrected documents before {{dueDate}}.',
    },
    {
      id: 'tpl_selected',
      name: 'Provisional Award Sanction Letter',
      trigger: 'On Selection Finalization',
      subject: 'Congratulations: Selection for {{schemeName}} Fellowship 2025-26',
      body: 'Dear {{applicantName}}, you have been provisionally selected for the {{schemeName}} fellowship. Please submit your joining report under Post-Selection.',
    },
  ]);

  const handleSave = () => {
    showToast('Notification templates updated successfully.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notification & SMS Templates</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dynamic placeholders like <code>{`{{applicantName}}`}</code> and <code>{`{{applicationNumber}}`}</code>.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Templates</span>
        </button>
      </div>

      <div className="space-y-4">
        {templates.map((tpl, i) => (
          <div key={tpl.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">{tpl.name}</span>
              <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded">
                Trigger: {tpl.trigger}
              </span>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Subject Line:</label>
              <input
                type="text"
                value={tpl.subject}
                onChange={(e) => {
                  const updated = [...templates];
                  updated[i].subject = e.target.value;
                  setTemplates(updated);
                }}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Message Body Template:</label>
              <textarea
                rows={2}
                value={tpl.body}
                onChange={(e) => {
                  const updated = [...templates];
                  updated[i].body = e.target.value;
                  setTemplates(updated);
                }}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
