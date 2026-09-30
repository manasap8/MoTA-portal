import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Layers,
  Users,
  ScrollText,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Award,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../../services/api';
import { TagBadge } from '../../components/common/TagBadge';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [schemeFilter, setSchemeFilter] = useState('all');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (schemeFilter !== 'all') params.scheme = schemeFilter;
      const res = await api.getAnalyticsDashboard(params);
      setData(res);
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [schemeFilter]);

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-xs text-slate-500">
        <Clock className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
        <span>Aggregating system analytics across schemes...</span>
      </div>
    );
  }

  const { kpis, byScheme, byState, statusDist, riskDist, deficiencyCategories, processingTimeDays } = data;

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-700/60 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ministry of Tribal Affairs • Super Administrator Console</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">System Analytics & Governance</h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time aggregate telemetry, compliance metrics, and stage processing durations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={schemeFilter}
            onChange={(e) => setSchemeFilter(e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-bold text-white focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Schemes Aggregated</option>
            <option value="scheme_nfst">NFST Fellowship</option>
            <option value="scheme_nos">NOS Overseas</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Total Applications</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{kpis.total}</div>
          <span className="text-[11px] text-slate-500">Live records on file</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Under Scrutiny</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{kpis.pending}</div>
          <span className="text-[11px] text-amber-700">Verification in progress</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Eligible Candidates</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{kpis.eligible}</div>
          <span className="text-[11px] text-emerald-700">Statutory rules satisfied</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-xs font-semibold text-slate-400">Final Selected Awards</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">{kpis.selected}</div>
          <span className="text-[11px] text-indigo-700">Fellowships sanctioned</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chart 1: Applications by State */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Geographic Distribution by State
            </h3>
            <span className="text-[11px] text-slate-400">Top Domicile States</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byState} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="state" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Status Distribution */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Workflow Status Distribution
            </h3>
            <span className="text-[11px] text-slate-400">Real-time Stage Counts</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDist.filter((s: any) => s.count > 0)}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry: any) => `${entry.name || entry.status || ''}: ${entry.value ?? entry.count ?? ''}`}
                >
                  {statusDist.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Advisory Risk Distribution */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Automated Document Risk Distribution
            </h3>
            <TagBadge type="ai" size="sm" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDist}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  label
                >
                  {riskDist.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Average Processing Time in Days by Stage */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Average Turnaround Time (Days by Stage)
            </h3>
            <span className="text-[11px] text-emerald-600 font-semibold">Under Statutory Target</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processingTimeDays} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="days" name="Actual Days" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="targetDays" name="SLA Target Days" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
