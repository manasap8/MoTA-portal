import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, CreditCard, Building2, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const ApplicantProfilePage: React.FC = () => {
  const { user, applicantProfile, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    dob: '',
    gender: 'Male',
    state: 'Jharkhand',
    district: 'Ranchi',
    category: 'ST',
    stCertNumber: '',
    stCertAuthority: '',
    stCertDate: '',
    qualification: "Master's degree",
    annualIncome: 320000,
    address: '',
    pincode: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (applicantProfile) {
      setFormData({
        fullName: applicantProfile.fullName || user?.fullName || '',
        email: applicantProfile.email || user?.email || '',
        mobile: applicantProfile.mobile || user?.mobile || '',
        dob: applicantProfile.dob || '1998-05-12',
        gender: applicantProfile.gender || 'Male',
        state: applicantProfile.state || 'Jharkhand',
        district: applicantProfile.district || 'Ranchi',
        category: 'ST',
        stCertNumber: applicantProfile.stCertNumber || '',
        stCertAuthority: applicantProfile.stCertAuthority || '',
        stCertDate: applicantProfile.stCertDate || '',
        qualification: applicantProfile.qualification || "Master's degree",
        annualIncome: applicantProfile.annualIncome || 320000,
        address: applicantProfile.address || '',
        pincode: applicantProfile.pincode || '',
        bankName: applicantProfile.bankName || '',
        accountNumber: applicantProfile.accountNumber || '',
        ifscCode: applicantProfile.ifscCode || '',
      });
    }
  }, [applicantProfile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile(formData);
    } catch (err) {
      //
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Applicant Profile</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain your verified demographic, scheduled tribe, and bank DBT credentials.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : 'Save Profile'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
            <User className="w-4 h-4 text-indigo-600" />
            <span>1. Identity Information</span>
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="w-full text-xs bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Scheduled Tribe Details */}
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>2. Scheduled Tribe Credentials</span>
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ST Certificate Number</label>
              <input
                type="text"
                value={formData.stCertNumber}
                onChange={(e) => setFormData({ ...formData, stCertNumber: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Issuing Authority</label>
              <input
                type="text"
                value={formData.stCertAuthority}
                onChange={(e) => setFormData({ ...formData, stCertAuthority: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State of Domicile</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Bank DBT Details */}
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>3. Direct Benefit Transfer (DBT) Bank Account</span>
          </h3>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="e.g. State Bank of India"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="e.g. 30987654321"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                placeholder="e.g. SBIN0001234"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Update & Save Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
