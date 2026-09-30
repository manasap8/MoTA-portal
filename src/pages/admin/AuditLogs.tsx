import React, { useState, useEffect } from 'react';
import { ScrollText, Download, Search, Clock, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((l) => {
    if (filterAction !== 'all' && l.action !== filterAction) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.action.toLowerCase().includes(q) ||
        l.userEmail.toLowerCase().includes(q) ||
        l.entityId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">System Audit Trail Log</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              Append-Only Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of all user registrations, logins, application submissions, document verifications, and policy modifications.
          </p>
        </div>

        <a
          href="/api/audit-logs/export-csv"
          download
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit CSV</span>
        </a>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, action, ID..."
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Action Filter:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-medium"
          >
            <option value="all">All Actions</option>
            <option value="SUBMIT_APPLICATION">SUBMIT_APPLICATION</option>
            <option value="VERIFY_DOCUMENT">VERIFY_DOCUMENT</option>
            <option value="REJECT_DOCUMENT">REJECT_DOCUMENT</option>
            <option value="RAISE_DEFICIENCY">RAISE_DEFICIENCY</option>
            <option value="RESOLVE_DEFICIENCY">RESOLVE_DEFICIENCY</option>
            <option value="TRANSITION_STAGE">TRANSITION_STAGE</option>
            <option value="OFFICER_SELECTION_DECISION">OFFICER_SELECTION_DECISION</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit trail...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No audit records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details / Delta</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleDateString()} {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{l.userEmail}</td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-500">{l.userRole}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{l.entityType}</span>:{' '}
                      <span className="text-slate-500">{l.entityId}</span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-[11px] text-slate-600">
                      {JSON.stringify(l.newValue || l.previousValue || '')}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">{l.ipAddress}</td>
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
