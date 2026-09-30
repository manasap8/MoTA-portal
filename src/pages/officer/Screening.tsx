import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  Award,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Columns,
  Sparkles,
  Search,
} from 'lucide-react';
import { api } from '../../services/api';
import { RiskBadge } from '../../components/common/RiskBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TagBadge } from '../../components/common/TagBadge';

export const OfficerScreeningPage: React.FC = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [fairnessNote, setFairnessNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [schemeId, setSchemeId] = useState('all');
  const [state, setState] = useState('all');
  const [minMarks, setMinMarks] = useState('');

  // Side-by-side comparison mode
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);

  const fetchScreening = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (schemeId !== 'all') params.schemeId = schemeId;
      if (state !== 'all') params.state = state;
      if (minMarks) params.minMarks = minMarks;

      const res = await api.getScreeningData(params);
      setCandidates(res.candidates);
      setStats(res.stats);
      setFairnessNote(res.fairnessNote);
    } catch (err) {
      console.error('Failed to load screening data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreening();
  }, [schemeId, state, minMarks]);

  const toggleSelect = (appId: string) => {
    setSelectedIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const comparedCandidates = candidates.filter((c) => selectedIds.includes(c.applicationId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Merit Screening Support Desk</h1>
            <TagBadge type="ai" label="Configured Screening Support" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Objective candidate ranking based strictly on configured academic and research criteria weights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setCompareMode(!compareMode)}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Columns className="w-4 h-4" />
              <span>{compareMode ? 'Exit Compare' : `Compare Selected (${selectedIds.length})`}</span>
            </button>
          )}

          <Link
            to="/officer/selection"
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Award className="w-4 h-4" />
            <span>Go to Final Selection</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
            <span className="text-xs font-semibold text-slate-400">Total Applications</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalApplications}</div>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
            <span className="text-xs font-semibold text-slate-400">Eligible for Screening</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{stats.eligible}</div>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
            <span className="text-xs font-semibold text-slate-400">Shortlisted Candidates</span>
            <div className="text-2xl font-black text-purple-700 mt-1">{stats.shortlisted}</div>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
            <span className="text-xs font-semibold text-slate-400">Final Selected Slots</span>
            <div className="text-2xl font-black text-emerald-800 mt-1">{stats.selected}</div>
          </div>
        </div>
      )}

      {/* Fairness Note (Section 12 requirement) */}
      {fairnessNote && (
        <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-indigo-950">
            <ShieldCheck className="w-4 h-4 text-indigo-700" />
            <span>Algorithmic Fairness & Non-Discrimination Policy</span>
          </div>
          <p className="text-indigo-900 leading-relaxed">{fairnessNote.message}</p>
          <div className="pt-1 text-[11px] text-indigo-700 font-medium">
            Authorized Attributes: {fairnessNote.consideredFields?.join(' • ')}
          </div>
        </div>
      )}

      {/* Side-by-Side Candidate Comparison View */}
      {compareMode && comparedCandidates.length > 0 && (
        <div className="bg-white p-6 border-2 border-purple-300 rounded-2xl shadow-lg space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Columns className="w-4 h-4 text-purple-700" />
              <span>Side-by-Side Candidate Comparison ({comparedCandidates.length})</span>
            </h3>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-rose-600 font-semibold hover:underline"
            >
              Clear Comparison
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparedCandidates.map((c) => (
              <div key={c.applicationId} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="border-b pb-2">
                  <span className="font-bold text-sm text-slate-900 block">{c.applicantName}</span>
                  <span className="text-[11px] text-slate-500">{c.applicationNumber} • {c.schemeCode}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Screening Merit Score:</span>
                  <span className="text-xl font-black text-indigo-700">{c.screeningScore} / 100</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Postgraduate Marks:</span>
                  <span className="font-bold text-slate-800 text-sm">{c.academicMarks}%</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Document Risk Level:</span>
                  <RiskBadge level={c.riskLevel} score={c.consistencyScore} />
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Advisory Recommendation:</span>
                  <span className="font-bold text-purple-800 block">{c.aiRecommendation}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">{c.aiRecommendationReason}</span>
                </div>

                <Link
                  to={`/officer/applications/${c.applicationId}`}
                  className="w-full py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-center rounded-lg block transition-colors mt-2"
                >
                  Review Record
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Candidate Ranking Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Ranked Candidate Matrix ({candidates.length})
          </span>

          <div className="flex items-center gap-3">
            <select
              value={schemeId}
              onChange={(e) => setSchemeId(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-medium"
            >
              <option value="all">All Schemes</option>
              <option value="scheme_nfst">NFST</option>
              <option value="scheme_nos">NOS</option>
            </select>

            <input
              type="number"
              placeholder="Min Marks %"
              value={minMarks}
              onChange={(e) => setMinMarks(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 w-28"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">Compare</th>
                <th className="py-3 px-4">Rank / ID</th>
                <th className="py-3 px-4">Applicant Name</th>
                <th className="py-3 px-4">Scheme</th>
                <th className="py-3 px-4">Academic Marks</th>
                <th className="py-3 px-4">Screening Score</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">AI Advisory Recommendation</th>
                <th className="py-3 px-4 text-right">Official Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {candidates.map((c, i) => (
                <tr key={c.applicationId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(c.applicationId)}
                      onChange={() => toggleSelect(c.applicationId)}
                      className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                    />
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <span className="text-slate-400 font-normal mr-1">#{i + 1}</span>
                    <Link to={`/officer/applications/${c.applicationId}`} className="text-indigo-700 hover:underline">
                      {c.applicationNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{c.applicantName}</td>
                  <td className="py-3 px-4 font-bold text-slate-600">{c.schemeCode}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{c.academicMarks}%</td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-black text-indigo-700">{c.screeningScore}</span>
                    <span className="text-[10px] text-slate-400">/100</span>
                  </td>
                  <td className="py-3 px-4">
                    <RiskBadge level={c.riskLevel} score={c.consistencyScore} />
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold text-xs ${
                        c.aiRecommendation === 'Recommend shortlist'
                          ? 'text-emerald-700'
                          : c.aiRecommendation === 'Not recommended'
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {c.aiRecommendation}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <StatusBadge status={c.officerDecision !== 'Pending' ? c.officerDecision : c.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
