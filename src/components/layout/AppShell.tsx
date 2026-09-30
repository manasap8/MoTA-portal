import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  PlusCircle,
  FileText,
  FolderOpen,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Bell,
  MessageSquare,
  Award,
  Compass,
  HelpCircle,
  ListOrdered,
  ScanEye,
  SlidersHorizontal,
  Bot,
  BarChart3,
  Settings,
  Users,
  ScrollText,
  RotateCcw,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  Sparkles,
  ChevronDown,
  Layers,
  FilePlus,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DemoWalkthroughModal } from '../common/DemoWalkthroughModal';
import { AiQueryDrawer } from '../ai/AiQueryDrawer';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, quickLoginAsRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [openDeficienciesCount, setOpenDeficienciesCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);

  // Load badge counts
  useEffect(() => {
    let isMounted = true;
    const loadCounts = async () => {
      try {
        const notifRes = await api.getNotifications();
        if (isMounted) {
          setUnreadNotifs(notifRes.unreadCount || 0);
          setRecentNotifications(notifRes.notifications.slice(0, 5) || []);
        }

        const defRes = await api.getDeficiencies();
        if (isMounted) {
          const openDefs = (defRes || []).filter((d: any) => d.status === 'Open' || d.status === 'Resubmitted');
          setOpenDeficienciesCount(openDefs.length);
        }
      } catch (err) {
        // silent background poll error
      }
    };

    loadCounts();
    const interval = setInterval(loadCounts, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [location.pathname]);

  // Define sidebar sections based on active role
  const getNavSections = (): NavSection[] => {
    if (!user) return [];

    if (user.role === 'applicant') {
      return [
        {
          title: 'Overview',
          items: [
            { to: '/applicant/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/applicant/profile', label: 'My Profile', icon: User },
            { to: '/applicant/apply', label: 'Apply Now', icon: PlusCircle },
            { to: '/applicant/my-applications', label: 'My Applications', icon: FileText },
          ],
        },
        {
          title: 'Document & Scrutiny',
          items: [
            { to: '/applicant/documents', label: 'Documents', icon: FolderOpen },
            { to: '/applicant/document-analysis', label: 'Document Analysis', icon: ScanEye },
            { to: '/applicant/eligibility-result', label: 'Eligibility Result', icon: CheckCircle2 },
            {
              to: '/applicant/deficiencies',
              label: 'Deficiencies',
              icon: AlertTriangle,
              badge: openDeficienciesCount > 0 ? openDeficienciesCount : undefined,
            },
          ],
        },
        {
          title: 'Updates & Award',
          items: [
            {
              to: '/applicant/notifications',
              label: 'Notifications',
              icon: Bell,
              badge: unreadNotifs > 0 ? unreadNotifs : undefined,
            },
            { to: '/applicant/communication', label: 'Communication', icon: MessageSquare },
            { to: '/applicant/selection-result', label: 'Selection Result', icon: Award },
            { to: '/applicant/post-selection', label: 'Post-Selection', icon: Compass },
            { to: '/applicant/help', label: 'Help / FAQ', icon: HelpCircle },
          ],
        },
      ];
    }

    if (user.role === 'officer' || user.role === 'selection') {
      return [
        {
          title: 'Verification Desk',
          items: [
            { to: '/officer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/officer/queue', label: 'Application Queue', icon: ListOrdered },
            { to: '/officer/applications/app_1', label: 'Application Review', icon: FileText },
            { to: '/officer/documents', label: 'Document Verification', icon: FolderOpen },
            { to: '/officer/eligibility', label: 'Eligibility Review', icon: CheckCircle2 },
            {
              to: '/officer/deficiencies',
              label: 'Deficiency Mgmt',
              icon: AlertTriangle,
              badge: openDeficienciesCount > 0 ? openDeficienciesCount : undefined,
            },
          ],
        },
        {
          title: 'Screening & Decision',
          items: [
            { to: '/officer/screening', label: 'Screening Support', icon: SlidersHorizontal },
            { to: '/officer/selection', label: 'Selection Decision', icon: Award },
            { to: '/officer/communication', label: 'Communication', icon: MessageSquare },
          ],
        },
        {
          title: 'Intelligence & Reports',
          items: [
            { to: '/officer/ai-assistant', label: 'AI Query Assistant', icon: Bot },
            { to: '/officer/reports', label: 'Reports', icon: BarChart3 },
            {
              to: '/officer/notifications',
              label: 'Notifications',
              icon: Bell,
              badge: unreadNotifs > 0 ? unreadNotifs : undefined,
            },
          ],
        },
      ];
    }

    // Admin Role
    return [
      {
        title: 'Administration',
        items: [
          { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
          { to: '/admin/analytics', label: 'System Analytics', icon: BarChart3 },
          { to: '/admin/applications', label: 'Applications Search', icon: FileText },
        ],
      },
      {
        title: 'Scheme & Policy Setup',
        items: [
          { to: '/admin/schemes', label: 'Scheme Management', icon: Layers },
          { to: '/admin/rules', label: 'Rule Configuration', icon: Settings },
          { to: '/admin/documents', label: 'Document Config', icon: FolderOpen },
          { to: '/admin/workflows', label: 'Workflow Stages', icon: ListOrdered },
          { to: '/admin/templates', label: 'Notification Templates', icon: ScrollText },
        ],
      },
      {
        title: 'Governance & Tools',
        items: [
          { to: '/admin/users', label: 'User Management', icon: Users },
          { to: '/admin/reports', label: 'Reports Center', icon: BarChart3 },
          { to: '/admin/audit-logs', label: 'Audit Trail Logs', icon: ScrollText },
          { to: '/admin/ai-assistant', label: 'AI Investigation Desk', icon: Bot },
          { to: '/admin/demo-tools', label: 'Demo Data Tools', icon: RotateCcw },
        ],
      },
    ];
  };

  const navSections = getNavSections();

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (user?.role === 'applicant') {
      navigate(`/applicant/my-applications?search=${encodeURIComponent(searchQuery)}`);
    } else if (user?.role === 'admin') {
      navigate(`/admin/applications?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/officer/queue?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col font-sans text-slate-800">
      <div className="flex-1 flex overflow-hidden">
        {/* 2. Left Vertical Sidebar (Mandatory) */}
        <aside
          className={`bg-[#0F172A] text-slate-200 border-r border-slate-800 transition-all duration-300 ease-in-out shrink-0 flex flex-col z-40 ${
            collapsed ? 'w-[76px]' : 'w-[260px]'
          } ${mobileOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden lg:flex'}`}
        >
          {/* Logo & Portal Branding */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs">
                  MoTA
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-sm tracking-tight text-white leading-tight truncate">
                    Tribal Scholarship
                  </h1>
                  <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase block">
                    AI Administration
                  </span>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs mx-auto">
                MoTA
              </div>
            )}

            {/* Collapse toggle (desktop only) */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 hidden lg:block"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            {/* Mobile close */}
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {!collapsed && (
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                    {section.title}
                  </h3>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      title={collapsed ? item.label : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group relative ${
                          isActive
                            ? 'bg-indigo-700/90 text-white shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        } ${collapsed ? 'justify-center' : ''}`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                      {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                      {!collapsed && item.badge !== undefined && (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500 text-slate-950">
                          {item.badge}
                        </span>
                      )}
                      {collapsed && item.badge !== undefined && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bottom User Card */}
          {user && (
            <div className="p-3 border-t border-slate-800 bg-slate-950/60">
              <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {user.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded">
                        {user.role}
                      </span>
                    </div>
                  </div>
                )}
                {!collapsed && (
                  <button
                    onClick={logout}
                    title="Log Out"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* 3. Main Content Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar Header */}
          <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 lg:px-8 py-3 flex items-center justify-between gap-4 shadow-2xs">
            {/* Mobile menu trigger */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <span className="text-xs font-semibold text-indigo-700 tracking-wider uppercase">
                  National Digital Scholarship Portal
                </span>
                <h2 className="text-base lg:text-lg font-bold text-slate-900 leading-tight">
                  Ministry of Tribal Affairs (MoTA)
                </h2>
              </div>
            </div>

            {/* Global Search Bar */}
            <form onSubmit={handleGlobalSearch} className="hidden md:flex items-center flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search application ID, applicant name, scheme, status..."
                  className="w-full text-xs bg-slate-100/80 border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                />
              </div>
            </form>

            {/* Actions: Demo Script Drawer + AI Assistant + Notification Bell + Quick Role Picker */}
            <div className="flex items-center gap-2">
              {/* 26-Step Demo Walkthrough Launcher */}
              <button
                onClick={() => setShowDemoModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 rounded-xl shadow-2xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">26-Step Demo Walkthrough</span>
                <span className="sm:hidden">Demo</span>
              </button>

              {/* AI Assistant Button */}
              <button
                onClick={() => setShowAiDrawer(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200 rounded-xl shadow-2xs transition-colors"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">AI Assistant</span>
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl relative transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                  )}
                </button>

                {showNotificationsDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-900">Notifications ({unreadNotifs})</span>
                      <button
                        onClick={async () => {
                          await api.markAllNotificationsRead();
                          setUnreadNotifs(0);
                        }}
                        className="text-[11px] text-indigo-700 font-semibold hover:underline"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {recentNotifications.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">No new notifications</p>
                      ) : (
                        recentNotifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              api.markNotificationRead(n.id);
                              setShowNotificationsDropdown(false);
                              if (n.linkUrl) navigate(n.linkUrl);
                            }}
                            className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50/50 cursor-pointer text-xs transition-colors"
                          >
                            <p className="font-semibold text-slate-800">{n.title}</p>
                            <p className="text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-100 text-center">
                      <NavLink
                        to={user?.role === 'applicant' ? '/applicant/notifications' : '/officer/notifications'}
                        onClick={() => setShowNotificationsDropdown(false)}
                        className="text-xs font-semibold text-indigo-700 hover:underline"
                      >
                        View all notifications
                      </NavLink>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Role Switcher Chips (Judge Demo convenience) */}
              <div className="hidden xl:flex items-center gap-1 border-l border-slate-200 pl-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase mr-1">Switch:</span>
                <button
                  onClick={() => quickLoginAsRole('applicant')}
                  className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors ${
                    user?.role === 'applicant'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  Applicant
                </button>
                <button
                  onClick={() => quickLoginAsRole('officer')}
                  className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors ${
                    user?.role === 'officer'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  Verification
                </button>
                <button
                  onClick={() => quickLoginAsRole('selection')}
                  className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors ${
                    user?.role === 'selection'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  Selection
                </button>
                <button
                  onClick={() => quickLoginAsRole('admin')}
                  className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors ${
                    user?.role === 'admin'
                      ? 'bg-indigo-900 text-white border-indigo-900'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>
          </header>

          {/* Page Outlet */}
          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>

          {/* Footer Disclaimer (Section 4 & 21) */}
          <footer className="mt-auto border-t border-slate-200 bg-white py-3 px-6 text-center text-xs text-slate-400">
            <span>
              Ministry of Tribal Affairs (MoTA) Scholarship & Fellowship Prototype •{' '}
              <strong>Disclaimer:</strong> AI outputs are advisory. Final decisions rest with authorized officials.
            </span>
          </footer>
        </div>
      </div>

      {/* Floating Interactive 26-Step Demo Drawer */}
      <DemoWalkthroughModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />

      {/* Floating AI Query Assistant Drawer */}
      <AiQueryDrawer isOpen={showAiDrawer} onClose={() => setShowAiDrawer(false)} />
    </div>
  );
};
