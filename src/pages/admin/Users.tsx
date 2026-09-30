import React, { useState, useEffect } from 'react';
import { Users, Shield, KeyRound, Check, X, Search, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const AdminUsersPage: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (user: any) => {
    try {
      await api.updateUser(user.id, { active: !user.active });
      showToast(`User ${user.fullName} is now ${!user.active ? 'Active' : 'Deactivated'}.`, 'success');
      await fetchUsers();
    } catch (err: any) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    try {
      await api.resetPassword(userId, 'Demo@123');
      showToast(`Password for ${email} reset to "Demo@123".`, 'success');
    } catch (err: any) {
      showToast('Password reset failed', 'error');
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User & Access Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage administrative officers, applicants, role authorization, and credential resets.
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          Total Registered Users: <strong>{users.length}</strong>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.fullName}</td>
                    <td className="py-3 px-4">{u.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          u.role === 'admin'
                            ? 'bg-indigo-100 text-indigo-900'
                            : u.role === 'officer'
                            ? 'bg-amber-100 text-amber-900'
                            : u.role === 'selection'
                            ? 'bg-purple-100 text-purple-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          u.active ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleResetPassword(u.id, u.email)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                        >
                          Reset Pass
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            u.active
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
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
