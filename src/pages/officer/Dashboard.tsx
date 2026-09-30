import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ListOrdered,
  FileCheck2,
  AlertTriangle,
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Search,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '../../services/api';
import { Application } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RiskBadge } from '../../components/common/RiskBadge';

export const OfficerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashRes, appsRes] = await Promise.all([
          api.getAnalyticsDashboard(),
          api.getApplications(),
        ]);
        setStats(dashRes.kpis);
        setApplications(appsRes);
      } catch (err) {
        console.error('Error loading officer dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pendingApps = applications.filter(
    (a) => a.status === 'Submitted' || a.status === 'Under Verification' || a.riskLevel === 'HIGH'
  );

  return (
    <div className="space-y-6">
      {/* Officer Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ministry Verification & Selection Desk</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Officer Workstation</h1>
          <p className="text-xs text-slate-300 mt-1">
            Review incoming ST applications, inspect automated OCR extractions, adjudicate deficiencies, and formulate merit selection lists.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/officer/queue"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <ListOrdered className="w-4 h-4" />
            <span>Open Application Queue</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-500">Pending Verification</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{stats?.pending ?? 0}</div>
          <p className="text-[11px] text-amber-700 mt-1">Requires document scrutiny</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-500">Open Deficiencies</span>
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{stats?.deficient ?? 0}</div>
          <p className="text-[11px] text-orange-700 mt-1">Awaiting applicant correction</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-500">Eligible Candidates</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{stats?.eligible ?? 0}</div>
          <p className="text-[11px] text-emerald-700 mt-1">Statutory criteria fulfilled</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-500">Shortlisted / Selected</span>
            <Award className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {(stats?.shortlisted ?? 0) + (stats?.selected ?? 0)}
          </div>
          <p className="text-[11px] text-purple-700 mt-1">In merit ranking / award</p>
        </div>
      </div>

      {/* Priority Action Queue */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Priority Application Scrutiny Queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Applications requiring immediate document verification or flagged with consistency warnings.
            </p>
          </div>

          <Link
            to="/officer/queue"
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
          >
            <span>View Full Queue ({applications.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Applicant Name</th>
                <th className="py-3 px-4">Scheme</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {pendingApps.slice(0, 6).map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <Link to={`/officer/applications/${app.id}`} className="text-indigo-700 hover:underline">
                      {app.applicationNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{app.applicantName}</td>
                  <td className="py-3 px-4 font-bold text-slate-600">{app.schemeId.toUpperCase()}</td>
                  <td className="py-3 px-4">{app.data?.state || 'Jharkhand'}</td>
                  <td className="py-3 px-4">
                    {app.riskLevel && <RiskBadge level={app.riskLevel} score={app.consistencyScore} />}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={app.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/officer/applications/${app.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg text-xs transition-colors shadow-2xs"
                    >
                      <span>Open 3-Col Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Desk Shortcuts */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link
          to="/officer/screening"
          className="p-5 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl shadow-2xs transition-all group"
        >
          <SlidersHorizontal className="w-6 h-6 text-purple-700 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-sm font-bold text-slate-900">Candidate Screening Support</h3>
          <p className="text-xs text-slate-500 mt-1">
            Weighted criteria scoring, candidate comparison mode, and merit ranking.
          </p>
        </Link>

        <Link
          to="/officer/selection"
          className="p-5 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl shadow-2xs transition-all group"
        >
          <Award className="w-6 h-6 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-sm font-bold text-slate-900">Selection List & Decisions</h3>
          <p className="text-xs text-slate-500 mt-1">
            Adjudicate final awards, record official decisions, and export selection lists.
          </p>
        </Link>

        <Link
          to="/officer/ai-assistant"
          className="p-5 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl shadow-2xs transition-all group"
        >
          <Sparkles className="w-6 h-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-sm font-bold text-slate-900">AI Application Intelligence</h3>
          <p className="text-xs text-slate-500 mt-1">
            Query inconsistencies, check missing files, and analyze candidate metrics.
          </p>
        </Link>
      </div>
    </div>
  );
};
