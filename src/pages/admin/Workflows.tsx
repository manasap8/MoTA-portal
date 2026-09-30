import React, { useState } from 'react';
import { ListOrdered, CheckCircle2, ArrowRight } from 'lucide-react';

export const AdminWorkflowsPage: React.FC = () => {
  const stages = [
    { order: 1, code: 'SUBMITTED', name: 'Application Submitted', role: 'Applicant', desc: 'Applicant finishes dynamic form, statutory declaration, and initial sanity checks.' },
    { order: 2, code: 'DOC_VERIF', name: 'Document Scrutiny', role: 'Verification Officer', desc: 'OCR verification, certificate authenticity cross-check, deficiency detection.' },
    { order: 3, code: 'ELIG_EVAL', name: 'Eligibility Review', role: 'Verification Officer', desc: 'Rule engine statutory evaluation and officer sign-off.' },
    { order: 4, code: 'SCREENING', name: 'Merit Screening', role: 'Selection Officer', desc: 'Weighted score calculation across academic merit and research topic.' },
    { order: 5, code: 'FINAL_DECISION', name: 'Final Award Adjudication', role: 'Selection Committee', desc: 'Ratify final award recipients and gazette list generation.' },
    { order: 6, code: 'POST_SELECTION', name: 'Post-Selection Monitoring', role: 'Verification Officer', desc: 'Joining documents, PFMS mandate, semi-annual research progress tracking.' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs">
        <h1 className="text-xl font-bold text-slate-900">Statutory Workflow Stage Configuration</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Workflow stage sequence, role authorization bindings, and progression gating.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden divide-y divide-slate-100">
        {stages.map((stg) => (
          <div key={stg.code} className="p-5 flex items-start gap-4 text-xs">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-black text-sm flex items-center justify-center shrink-0">
              {stg.order}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">{stg.name}</h3>
                <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                  {stg.code}
                </code>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                  Role: {stg.role}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">{stg.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
