import React, { useState } from 'react';
import { RotateCcw, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const AdminDemoToolsPage: React.FC = () => {
  const { showToast } = useToast();
  const [resetting, setResetting] = useState(false);

  const handleResetData = async () => {
    if (!window.confirm('Are you sure you want to reset all demo data back to default pristine seed state?')) {
      return;
    }

    try {
      setResetting(true);
      await api.resetDemoData();
      showToast('Demo data successfully reset! 11 scenario applications restored.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Reset failed', 'error');
    } finally {
      setResetting(false);
    }
  };

  const scenarios = [
    { num: 1, id: 'app_1', code: 'NFST-2025-001', name: 'Rahul Kumar Soren', desc: 'Fully eligible, high consistency 96% LOW risk, verified, ready for screening', tag: 'Eligible (NFST)' },
    { num: 2, id: 'app_2', code: 'NOS-2025-002', name: 'Sunita Kerketta', desc: 'Missing document (passport missing), deficiency raised with due date', tag: 'Deficient (NOS)' },
    { num: 3, id: 'app_3', code: 'NFST-2025-003', name: 'Bikash Oraon', desc: 'Name mismatch: "Rahul K." on cert vs "Rahul Kumar", MEDIUM risk score 72%', tag: 'Name Mismatch' },
    { num: 4, id: 'app_4', code: 'NOS-2025-004', name: 'Pooja Maravi', desc: 'DOB mismatch (1998-05-12 vs 1998-05-21), HIGH risk score 58%', tag: 'DOB Mismatch' },
    { num: 5, id: 'app_5', code: 'NFST-2025-005', name: 'Kishan Munda', desc: 'Expired income certificate (expired on 2023-03-31), deficiency raised', tag: 'Expired Cert' },
    { num: 6, id: 'app_6', code: 'NFST-2025-006', name: 'Anjali Bhil', desc: 'Pending verification: newly submitted, no documents verified yet', tag: 'Pending Scrutiny' },
    { num: 7, id: 'app_7', code: 'NOS-2025-007', name: 'Lalit Rathwa', desc: 'High consistency 93%, LOW risk, Bachelor\'s 62%, eligible', tag: 'Eligible (NOS)' },
    { num: 8, id: 'app_8', code: 'NFST-2025-008', name: 'Priya Nayak', desc: 'Medium risk score 68%, minor university name variation', tag: 'Medium Risk' },
    { num: 9, id: 'app_9', code: 'NOS-2025-009', name: 'Vikram Jamatia', desc: 'Ineligible: annual income ₹8,50,000 > ₹6,00,000, age 37 > 35, FAIL criteria', tag: 'Ineligible' },
    { num: 10, id: 'app_10', code: 'NFST-2025-010', name: 'Kavita Deori', desc: 'Shortlisted candidate with screening score 88.5 / 100', tag: 'Shortlisted' },
    { num: 11, id: 'app_11', code: 'NFST-2025-011', name: 'Rahul Kumar Soren', desc: 'Finalized "Selected" candidate in Post-Selection with ₹31,000/mo fellowship and progress reports', tag: 'Selected (Post-Selection)' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Demo Data & Jury Presentation Tools</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Reset database state, inspect seeded edge cases, and run live verification tests.
          </p>
        </div>

        <button
          onClick={handleResetData}
          disabled={resetting}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Resetting Database...' : 'Reset Demo Data to Initial State'}</span>
        </button>
      </div>

      {/* 11 Seeded Scenarios Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Seeded Test Scenarios (Section 17 Requirements)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-configured records demonstrating every statutory and edge-case lifecycle stage.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {scenarios.map((s) => (
            <div
              key={s.num}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-2 text-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    #{s.num}. {s.code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                    {s.tag}
                  </span>
                </div>
                <div className="font-semibold text-slate-700 mt-1">{s.name}</div>
                <p className="text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                <Link
                  to={`/officer/applications/${s.id}`}
                  className="px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-700 font-bold border border-slate-200 rounded-lg inline-flex items-center gap-1 shadow-2xs"
                >
                  <span>Open in 3-Col Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
