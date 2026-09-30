import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, CheckCircle2, ShieldCheck, User, Mail, Phone, Lock, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const STATE_DISTRICTS: Record<string, string[]> = {
  Jharkhand: ['Ranchi', 'Khunti', 'Dumka', 'East Singhbhum', 'Gumla', 'Lohardaga'],
  Odisha: ['Mayurbhanj', 'Sundargarh', 'Koraput', 'Rayagada', 'Keonjhar'],
  'Madhya Pradesh': ['Mandla', 'Dindori', 'Jhabua', 'Barwani', 'Chhindwara'],
  Chhattisgarh: ['Bastar', 'Dantewada', 'Kanker', 'Sukma', 'Surajpur'],
  Rajasthan: ['Udaipur', 'Banswara', 'Dungarpur', 'Pratapgarh', 'Sirohi'],
  Gujarat: ['Chhota Udaipur', 'Tapi', 'Narmada', 'Dangs', 'Dahod'],
  Assam: ['Lakhimpur', 'Karbi Anglong', 'Dima Hasao', 'Kokrajhar', 'Baksa'],
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    dob: '1998-05-12',
    gender: 'Male',
    state: 'Jharkhand',
    district: 'Ranchi',
    category: 'ST',
    stCertNumber: '',
    stCertAuthority: '',
    stCertDate: '',
    qualification: "Master's degree",
    password: '',
  });

  const districts = STATE_DISTRICTS[formData.state] || [];

  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = calculatePasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await register(formData);
    if (ok) {
      navigate('/applicant/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Banner */}
      <div className="fixed top-0 inset-x-0 bg-amber-400 text-amber-950 font-bold text-xs py-1.5 px-4 text-center tracking-wide border-b border-amber-500 z-50">
        PROTOTYPE / DEMONSTRATION. All data shown is DEMO DATA for Ministry of Tribal Affairs (MoTA).
      </div>

      <div className="max-w-2xl mx-auto mt-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-900 text-amber-400 flex items-center justify-center mx-auto shadow-md">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            Applicant Portal Registration
          </h2>
          <p className="text-xs text-slate-500">
            For Scheduled Tribe candidates seeking NFST fellowship or NOS overseas scholarship.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 border border-slate-200 rounded-2xl shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identity Information */}
            <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              1. Basic Personal Information
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (as in Aadhaar / ST cert) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Rahul Kumar Soren"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@domain.com"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (10 digits) *
                </label>
                <input
                  type="tel"
                  required
                  pattern="[6-9][0-9]{9}"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="9876543210"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Highest Educational Qualification *
                </label>
                <select
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                >
                  <option value="Master's degree">Master's degree</option>
                  <option value="M.Phil">M.Phil</option>
                  <option value="Bachelor's degree">Bachelor's degree</option>
                </select>
              </div>
            </div>

            {/* Domicile & Tribal Credentials */}
            <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider pt-3 pb-1 border-b border-slate-100 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              2. Domicile & Scheduled Tribe Details
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State of Domicile *
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => {
                    const newState = e.target.value;
                    setFormData({
                      ...formData,
                      state: newState,
                      district: STATE_DISTRICTS[newState]?.[0] || '',
                    });
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                >
                  {Object.keys(STATE_DISTRICTS).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  District (Dependent Dropdown) *
                </label>
                <select
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                >
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ST Certificate Number
                </label>
                <input
                  type="text"
                  value={formData.stCertNumber}
                  onChange={(e) => setFormData({ ...formData, stCertNumber: e.target.value })}
                  placeholder="e.g. ST/JH/2023/88492"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Issuing Authority
                </label>
                <input
                  type="text"
                  value={formData.stCertAuthority}
                  onChange={(e) => setFormData({ ...formData, stCertAuthority: e.target.value })}
                  placeholder="e.g. Sub-Divisional Officer, Ranchi"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Password with Strength Indicator */}
            <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider pt-3 pb-1 border-b border-slate-100 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-indigo-600" />
              3. Security Password
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password (minimum 8 characters, mixed case/numbers) *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create strong password"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              />

              {/* Password Strength Meter */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 grid grid-cols-4 gap-1 h-1.5">
                  <div className={`rounded-full ${strength >= 1 ? 'bg-rose-500' : 'bg-slate-200'}`} />
                  <div className={`rounded-full ${strength >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                  <div className={`rounded-full ${strength >= 3 ? 'bg-sky-500' : 'bg-slate-200'}`} />
                  <div className={`rounded-full ${strength >= 4 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  {strength <= 1 ? 'Weak' : strength === 2 ? 'Fair' : strength === 3 ? 'Good' : 'Strong'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Creating Account...' : 'Complete Registration & Open Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-indigo-700 hover:underline">
              Sign In with Existing Credentials
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
