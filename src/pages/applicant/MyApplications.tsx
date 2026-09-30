import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  PlusCircle,
  ChevronRight,
  Clock,
  Sparkles,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { api } from '../../services/api';
import { Application } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RiskBadge } from '../../components/common/RiskBadge';

export const MyApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterScheme, setFilterScheme] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoading(true);
        const data = await api.getApplications();
        setApplications(data);
      } catch (err) {
        console.error('Failed to load applications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  const filteredApps = applications.filter((app) => {
    if (filterScheme !== 'all' && app.schemeId !== filterScheme) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        app.applicationNumber.toLowerCase().includes(q) ||
        app.schemeId.toLowerCase().includes(q) ||
        app.status.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Applications</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View, track, and manage all your scholarship & fellowship submissions.
          </p>
        </div>

        <Link
          to="/applicant/apply"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Application</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID or status..."
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-slate-500">Scheme:</span>
          <select
            value={filterScheme}
            onChange={(e) => setFilterScheme(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-600 font-medium"
          >
            <option value="all">All Schemes</option>
            <option value="scheme_nfst">NFST (Fellowship)</option>
            <option value="scheme_nos">NOS (Overseas)</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Clock className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
            <span>Loading applications...</span>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No applications found</h3>
            <p className="text-xs text-slate-500 mt-1">Start a new application for NFST or NOS.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Application ID</th>
                  <th className="py-3.5 px-4">Scheme</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4">Workflow Status</th>
                  <th className="py-3.5 px-4">Consistency & Risk</th>
                  <th className="py-3.5 px-4">Eligibility Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <Link
                        to={`/applicant/applications/${app.id}`}
                        className="text-indigo-700 hover:underline"
                      >
                        {app.applicationNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{app.schemeId.toUpperCase()}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Draft'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      {app.riskLevel ? (
                        <RiskBadge level={app.riskLevel} score={app.consistencyScore} />
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-semibold ${
                          app.eligibilityStatus === 'Eligible'
                            ? 'text-emerald-700'
                            : app.eligibilityStatus === 'Ineligible'
                            ? 'text-rose-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {app.eligibilityStatus || 'Requires review'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/applicant/applications/${app.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-semibold rounded-lg transition-colors shadow-2xs"
                      >
                        <span>View</span>
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
