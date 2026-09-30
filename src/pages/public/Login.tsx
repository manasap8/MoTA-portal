import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Lock, Mail, ArrowRight, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Demo@123');

  const handleAutofill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Demo@123');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const ok = await login(email, password);
    if (ok) {
      if (email.includes('applicant')) navigate('/applicant/dashboard');
      else if (email.includes('admin')) navigate('/admin/dashboard');
      else navigate('/officer/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-900 text-amber-400 flex items-center justify-center mx-auto shadow-md">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
          Portal Sign In
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Ministry of Tribal Affairs • NFST & NOS Scholarship Administration
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Demo Credentials Quick Chips */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Demo Credential Chips (Click to Autofill)
            </span>
            <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
              Demo@123
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleAutofill('applicant@demo.com')}
              className={`p-2 rounded-xl text-left border transition-all ${
                email === 'applicant@demo.com'
                  ? 'bg-blue-100/80 border-blue-400 text-blue-900 font-bold shadow-2xs'
                  : 'bg-white border-amber-200 text-slate-700 hover:bg-amber-100/50'
              }`}
            >
              <span className="font-semibold block text-[11px] text-blue-800">Applicant</span>
              <span className="text-[10px] text-slate-500 truncate block">applicant@demo.com</span>
            </button>

            <button
              type="button"
              onClick={() => handleAutofill('officer@demo.com')}
              className={`p-2 rounded-xl text-left border transition-all ${
                email === 'officer@demo.com'
                  ? 'bg-amber-100/80 border-amber-400 text-amber-900 font-bold shadow-2xs'
                  : 'bg-white border-amber-200 text-slate-700 hover:bg-amber-100/50'
              }`}
            >
              <span className="font-semibold block text-[11px] text-amber-800">Verification Officer</span>
              <span className="text-[10px] text-slate-500 truncate block">officer@demo.com</span>
            </button>

            <button
              type="button"
              onClick={() => handleAutofill('selection@demo.com')}
              className={`p-2 rounded-xl text-left border transition-all ${
                email === 'selection@demo.com'
                  ? 'bg-purple-100/80 border-purple-400 text-purple-900 font-bold shadow-2xs'
                  : 'bg-white border-amber-200 text-slate-700 hover:bg-amber-100/50'
              }`}
            >
              <span className="font-semibold block text-[11px] text-purple-800">Selection Officer</span>
              <span className="text-[10px] text-slate-500 truncate block">selection@demo.com</span>
            </button>

            <button
              type="button"
              onClick={() => handleAutofill('admin@demo.com')}
              className={`p-2 rounded-xl text-left border transition-all ${
                email === 'admin@demo.com'
                  ? 'bg-indigo-100/80 border-indigo-400 text-indigo-900 font-bold shadow-2xs'
                  : 'bg-white border-amber-200 text-slate-700 hover:bg-amber-100/50'
              }`}
            >
              <span className="font-semibold block text-[11px] text-indigo-800">Super Admin</span>
              <span className="text-[10px] text-slate-500 truncate block">admin@demo.com</span>
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white py-6 px-6 sm:px-8 border border-slate-200 rounded-2xl shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Official / Applicant Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@demo.com"
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Verifying...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>New ST Applicant?</span>
            <Link to="/register" className="font-bold text-indigo-700 hover:underline">
              Create New Registration
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-800 underline">
            ← Return to Public Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};
