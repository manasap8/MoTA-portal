import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, ChevronRight, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { Application } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RiskBadge } from '../../components/common/RiskBadge';

export const AdminApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [scheme, setScheme] = useState('all');
  const [status, setStatus] = useState('all');

  const fetchApps = async () => {
    try {
      setLoading(true);
      const data = await api.getApplications();
      setApplications(data);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const filtered = applications.filter((a) => {
    if (scheme !== 'all' && a.schemeId !== scheme) return false;
    if (status !== 'all' && a.status.toLowerCase() !== status.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.applicationNumber.toLowerCase().includes(q) ||
        a.applicantName.toLowerCase().includes(q) ||
        a.applicantEmail.toLowerCase().includes(q) ||
        (a.data?.state || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Global Applications Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, filter, and inspect all applications filed across NFST and NOS schemes.
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          Showing <strong>{filtered.length}</strong> of {applications.length} applications
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-2xs grid sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, name, email, or state..."
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2"
          />
        </div>

        <div>
          <select
            value={scheme}
            onChange={(e) => setScheme(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
          >
            <option value="all">All Schemes</option>
            <option value="scheme_nfst">NFST</option>
            <option value="scheme_nos">NOS</option>
          </select>
        </div>

        <div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under verification">Under Verification</option>
            <option value="deficient">Deficient</option>
            <option value="eligible">Eligible</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="selected">Selected</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Application ID</th>
                  <th className="py-3.5 px-4">Applicant Name</th>
                  <th className="py-3.5 px-4">Scheme</th>
                  <th className="py-3.5 px-4">State</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4">Risk Level</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{app.applicationNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{app.applicantName}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-600">{app.schemeId.toUpperCase()}</td>
                    <td className="py-3.5 px-4">{app.data?.state || 'Jharkhand'}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Draft'}
                    </td>
                    <td className="py-3.5 px-4">
                      {app.riskLevel && <RiskBadge level={app.riskLevel} score={app.consistencyScore} />}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/officer/applications/${app.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold rounded-lg transition-colors shadow-2xs"
                      >
                        <span>Open</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
