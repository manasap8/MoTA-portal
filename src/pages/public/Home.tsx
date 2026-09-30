import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Users,
  Compass,
  CheckCircle2,
  ChevronDown,
  Globe2,
  BookOpen,
  Building2,
  Bot,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, quickLoginAsRole } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleExploreRole = async (role: UserRole) => {
    await quickLoginAsRole(role);
    if (role === 'applicant') navigate('/applicant/dashboard');
    else if (role === 'admin') navigate('/admin/dashboard');
    else navigate('/officer/dashboard');
  };

  const faqs = [
    {
      q: 'Who is eligible to apply under the NFST fellowship?',
      a: 'ST candidates enrolled in regular M.Phil or Ph.D. programmes in recognized Indian Universities/Institutes with a minimum of 55% marks in their Postgraduate examination and annual family income within INR 6,00,000.',
    },
    {
      q: 'What is the National Overseas Scholarship (NOS) scheme?',
      a: 'The NOS provides financial support to selected Scheduled Tribe candidates to pursue Master’s and Ph.D. courses abroad in specified subjects at world-ranking universities.',
    },
    {
      q: 'How does the AI-Assisted Document Intelligence function?',
      a: 'The system automatically extracts identity, caste, and income data from uploaded certificates, runs multi-document consistency cross-checks, and flags formatting differences or expiry dates for human officer verification. AI outputs are advisory; official decisions remain with government officers.',
    },
    {
      q: 'What happens if a document has an inconsistency or is missing?',
      a: 'An automated or officer-raised deficiency is generated. The applicant receives a notification and can upload a corrected certificate or clarification directly through the portal without starting a new application.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-800">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center text-amber-400 shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-widest block">
                Ministry of Tribal Affairs (MoTA)
              </span>
              <span className="text-base font-bold text-slate-900 leading-tight">
                Tribal Scholarship & Fellowship Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => {
                  if (user.role === 'applicant') navigate('/applicant/dashboard');
                  else if (user.role === 'admin') navigate('/admin/dashboard');
                  else navigate('/officer/dashboard');
                }}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <span>Go to Dashboard ({user.role})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors"
                >
                  Portal Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Applicant Registration
                </button>
              </>
            )}
          </div>
        </div>
        {/* Subtle tri-band accent line (saffron, white, green) allowed in header only */}
        <div className="h-1 w-full flex">
          <div className="w-1/3 bg-amber-500" />
          <div className="w-1/3 bg-slate-100" />
          <div className="w-1/3 bg-emerald-600" />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-14 lg:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          AI-Assisted Digital Scholarship & Fellowship Administration
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Configurable, transparent, and explainable workflow management system for the National Fellowship for Scheduled Tribe (NFST) and National Overseas Scholarship (NOS).
        </p>

        {/* 1-Click Role Exploration Box (Judge Demo Tool) */}
        <div className="mt-10 p-6 bg-white border border-slate-200 rounded-2xl shadow-xl max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Explore Live Prototype as Demo Role</span>
              </h3>
              <p className="text-xs text-slate-500">1-click login into pre-configured accounts with live scenario applications.</p>
            </div>
            <span className="text-[11px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">Password: Demo@123</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => handleExploreRole('applicant')}
              className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-left transition-all group"
            >
              <span className="text-xs font-bold text-blue-900 block group-hover:text-blue-700">Applicant</span>
              <span className="text-[11px] text-blue-700/80 mt-1 block">Rahul Kumar Soren</span>
              <span className="text-[10px] text-slate-400 mt-2 block">NFST & NOS Applications</span>
            </button>

            <button
              onClick={() => handleExploreRole('officer')}
              className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-left transition-all group"
            >
              <span className="text-xs font-bold text-amber-900 block group-hover:text-amber-700">Verification Officer</span>
              <span className="text-[11px] text-amber-700/80 mt-1 block">Dr. Anita Meena</span>
              <span className="text-[10px] text-slate-400 mt-2 block">Scrutiny & 3-Col Review</span>
            </button>

            <button
              onClick={() => handleExploreRole('selection')}
              className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-left transition-all group"
            >
              <span className="text-xs font-bold text-purple-900 block group-hover:text-purple-700">Selection Officer</span>
              <span className="text-[11px] text-purple-700/80 mt-1 block">Shri Rajesh Gond</span>
              <span className="text-[10px] text-slate-400 mt-2 block">Merit Screening & Lists</span>
            </button>

            <button
              onClick={() => handleExploreRole('admin')}
              className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 text-left transition-all group"
            >
              <span className="text-xs font-bold text-indigo-900 block group-hover:text-indigo-700">Super Admin</span>
              <span className="text-[11px] text-indigo-700/80 mt-1 block">System Administrator</span>
              <span className="text-[10px] text-slate-400 mt-2 block">Rules, Schemes, Audit</span>
            </button>
          </div>
        </div>
      </section>

      {/* Schemes Grid */}
      <section className="py-12 bg-white border-y border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-slate-900">Configured Scholarship Schemes</h2>
            <p className="text-xs text-slate-500 mt-1.5">
              Configured as demonstration rules. Fully functional dynamic form and rule engines.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* NFST Card */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-indigo-300 transition-all shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  NFST • 750 Slots
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Applications Open
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">National Fellowship for ST Students</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed flex-1">
                Fellowship support for Scheduled Tribe candidates pursuing M.Phil and Ph.D. degrees in Indian universities. Includes monthly stipend of ₹31,000 + HRA and annual contingency.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200 text-xs space-y-1.5 text-slate-500">
                <div className="flex justify-between">
                  <span>Eligibility Qualification:</span>
                  <span className="font-semibold text-slate-800">Master's / M.Phil (≥55%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Family Income Ceiling:</span>
                  <span className="font-semibold text-slate-800">INR 6,00,000 / year</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/applicant/apply')}
                className="mt-5 w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Apply for NFST</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* NOS Card */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-indigo-300 transition-all shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  NOS • 100 Slots
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Applications Open
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">National Overseas Scholarship</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed flex-1">
                Provides financial assistance to selected ST candidates for pursuing Master’s level courses and Ph.D. abroad in prestigious global universities. Covers 100% tuition and living allowance.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200 text-xs space-y-1.5 text-slate-500">
                <div className="flex justify-between">
                  <span>Age Limit:</span>
                  <span className="font-semibold text-slate-800">≤ 35 years as on cutoff</span>
                </div>
                <div className="flex justify-between">
                  <span>Qualifying Marks:</span>
                  <span className="font-semibold text-slate-800">Bachelor's / PG (≥60%)</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/applicant/apply')}
                className="mt-5 w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Apply for NOS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6-Step How It Works */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-slate-900">How the Digital Administration Works</h2>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end transparent lifecycle from registration to post-selection continuation.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { step: '01', title: 'Registration & Profile', desc: 'Aadhaar, ST certificate and bank DBT seeding' },
            { step: '02', title: 'Dynamic Form', desc: '10 section application with pre-submission checks' },
            { step: '03', title: 'Document OCR', desc: 'Certificate extraction and cross-check matching' },
            { step: '04', title: 'Scrutiny & Deficiencies', desc: 'Fuzzy name check and 1-click resubmissions' },
            { step: '05', title: 'Merit Screening', desc: 'Weighted scoring matrix and human officer decision' },
            { step: '06', title: 'Post-Selection', desc: 'Joining reports and Ph.D. semester progress tracking' },
          ].map((s, idx) => (
            <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs text-center">
              <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mb-2">
                {s.step}
              </span>
              <h4 className="text-xs font-bold text-slate-900 leading-snug">{s.title}</h4>
              <p className="text-[11px] text-slate-500 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-white border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500 mt-1">Clarifications on scheme guidelines and portal verification.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-slate-200 rounded-xl overflow-hidden transition-colors bg-slate-50/50"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-5 py-3.5 text-left font-semibold text-sm text-slate-900 flex items-center justify-between hover:bg-slate-100/60"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed bg-white border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
