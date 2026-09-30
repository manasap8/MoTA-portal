import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowRight,
  Clock,
  AlertTriangle,
  FolderOpen,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { Application } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RiskBadge } from '../../components/common/RiskBadge';

export const OfficerQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [scheme, setScheme] = useState('all');
  const [status, setStatus] = useState('all');
  const [risk, setRisk] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoading(true);
        const data = await api.getApplications();
        setApplications(data);
      } catch (err) {
        console.error('Error fetching queue:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

  const filtered = applications.filter((app) => {
    if (scheme !== 'all' && app.schemeId !== scheme) return false;
    if (status !== 'all' && app.status.toLowerCase() !== status.toLowerCase()) return false;
    if (risk !== 'all' && app.riskLevel !== risk) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        app.applicationNumber.toLowerCase().includes(q) ||
        app.applicantName.toLowerCase().includes(q) ||
        app.applicantEmail.toLowerCase().includes(q) ||
        (app.data?.state || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Application Scrutiny Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter and prioritize applications for document verification, consistency scrutiny, and eligibility assessment.
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          Showing <strong>{filtered.length}</strong> of {applications.length} applications
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-2xs grid sm:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID, name, email..."
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
          />
        </div>

        <div>
          <select
            value={scheme}
            onChange={(e) => setScheme(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-600"
          >
            <option value="all">All Schemes</option>
            <option value="scheme_nfst">NFST (Fellowship)</option>
            <option value="scheme_nos">NOS (Overseas)</option>
          </select>
        </div>

        <div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-600"
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

        <div>
          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-600"
          >
            <option value="all">All Risk Levels</option>
            <option value="HIGH">HIGH Risk (&lt;60% or critical)</option>
            <option value="MEDIUM">MEDIUM Risk (60-84%)</option>
            <option value="LOW">LOW Risk (≥85%)</option>
          </select>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Clock className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
            <span>Loading application queue...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No applications match your filter criteria</h3>
            <p className="text-xs text-slate-500 mt-1">Try resetting filters to show all applications.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Application ID</th>
                  <th className="py-3.5 px-4">Applicant Name</th>
                  <th className="py-3.5 px-4">Scheme</th>
                  <th className="py-3.5 px-4">State</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">Consistency & Risk</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <Link to={`/officer/applications/${app.id}`} className="text-indigo-700 hover:underline">
                        {app.applicationNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{app.applicantName}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-600">{app.schemeId.toUpperCase()}</td>
                    <td className="py-3.5 px-4">{app.data?.state || 'Jharkhand'}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-semibold">{app.currentStage}</td>
                    <td className="py-3.5 px-4">
                      {app.riskLevel && <RiskBadge level={app.riskLevel} score={app.consistencyScore} />}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/officer/applications/${app.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg text-xs transition-colors shadow-2xs"
                      >
                        <span>3-Col Review</span>
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
