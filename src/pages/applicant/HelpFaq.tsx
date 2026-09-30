import React, { useState } from 'react';
import { HelpCircle, ChevronDown, BookOpen, Mail, Phone, ExternalLink } from 'lucide-react';

export const ApplicantHelpFaqPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What should I do if my document shows a "Potential Inconsistency Detected" warning?',
      a: 'A warning indicates a minor variation, such as an abbreviated name or initials (e.g., "Rahul K." instead of "Rahul Kumar"). Verification officers will manually scrutinize the certificate. You do not need to resubmit unless a deficiency is officially raised by the officer.',
    },
    {
      q: 'How long do I have to resolve a raised deficiency?',
      a: 'Each deficiency carries a specified due date (normally 10 to 14 calendar days from the date raised). Ensure you upload the requested document or corrected data before the due date.',
    },
    {
      q: 'Can I edit my application after submission?',
      a: 'Once submitted, application data is locked to maintain administrative integrity. However, if an officer raises a deficiency on a specific field or document, that item becomes editable for resubmission.',
    },
    {
      q: 'Is the AI eligibility score final?',
      a: 'No. Automated rules and AI findings provide advisory assistance to accelerate processing. Final award decisions belong strictly to authorized Ministry human officials.',
    },
    {
      q: 'How do I submit Ph.D. semester progress reports after selection?',
      a: 'Go to the "Post-Selection" tab from the sidebar. You can upload your semi-annual progress report and supervisor remarks there for officer approval and continuation.',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs">
        <h1 className="text-xl font-bold text-slate-900">Applicant Help Desk & FAQ</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Guidance on NFST & NOS scheme rules, document requirements, and deficiency resolution.
        </p>
      </div>

      {/* FAQs Accordion */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-700" />
          <span>Frequently Asked Questions</span>
        </h2>

        {faqs.map((faq, i) => (
          <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full px-4 py-3.5 text-left font-semibold text-xs text-slate-900 flex items-center justify-between hover:bg-slate-100/60"
            >
              <span>{faq.q}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
            </button>
            {openFaq === i && (
              <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed bg-white border-t border-slate-100">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Mail className="w-4 h-4 text-indigo-600" />
            <span>Official Helpdesk Email</span>
          </div>
          <p className="text-slate-500">fellowship-tribal@gov.in (Demo Desk)</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Phone className="w-4 h-4 text-indigo-600" />
            <span>MoTA National Helpline</span>
          </div>
          <p className="text-slate-500">1800-11-2025 (Toll-Free, 9:30 AM - 5:30 PM)</p>
        </div>
      </div>
    </div>
  );
};
