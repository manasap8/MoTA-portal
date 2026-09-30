import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';

// Public Pages
import { HomePage } from './pages/public/Home';
import { LoginPage } from './pages/public/Login';
import { RegisterPage } from './pages/public/Register';
import { ApplicantHelpFaqPage } from './pages/applicant/HelpFaq';

// Applicant Pages
import { ApplicantDashboard } from './pages/applicant/Dashboard';
import { ApplicantProfilePage } from './pages/applicant/Profile';
import { ApplyNowPage } from './pages/applicant/ApplyNow';
import { MyApplicationsPage } from './pages/applicant/MyApplications';
import { ApplicationDetailsPage } from './pages/applicant/ApplicationDetails';
import { ApplicantDocumentsPage } from './pages/applicant/Documents';
import { DocumentAnalysisPage } from './pages/applicant/DocumentAnalysis';
import { EligibilityResultPage } from './pages/applicant/EligibilityResult';
import { DeficienciesPage } from './pages/applicant/Deficiencies';
import { ApplicantNotificationsPage } from './pages/applicant/Notifications';
import { ApplicantCommunicationPage } from './pages/applicant/Communication';
import { ApplicantSelectionResultPage } from './pages/applicant/SelectionResult';
import { ApplicantPostSelectionPage } from './pages/applicant/PostSelection';

// Officer Pages
import { OfficerDashboard } from './pages/officer/Dashboard';
import { OfficerQueuePage } from './pages/officer/Queue';
import { OfficerReviewPage } from './pages/officer/Review';
import { OfficerScreeningPage } from './pages/officer/Screening';
import { OfficerSelectionPage } from './pages/officer/Selection';
import { OfficerDeficienciesPage } from './pages/officer/Deficiencies';
import { OfficerAiAssistantPage } from './pages/officer/AiAssistant';
import { OfficerReportsPage } from './pages/officer/Reports';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminApplicationsPage } from './pages/admin/Applications';
import { AdminSchemesPage } from './pages/admin/Schemes';
import { AdminRulesPage } from './pages/admin/Rules';
import { AdminDocumentsConfigPage } from './pages/admin/DocumentsConfig';
import { AdminWorkflowsPage } from './pages/admin/Workflows';
import { AdminTemplatesPage } from './pages/admin/Templates';
import { AdminUsersPage } from './pages/admin/Users';
import { AdminAuditLogsPage } from './pages/admin/AuditLogs';
import { AdminDemoToolsPage } from './pages/admin/DemoTools';

import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { UserRole } from './types';

// Route Guards
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] text-xs font-semibold text-slate-500">
        Loading session...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <AppShell>{children}</AppShell>;
};

const RoleGuard: React.FC<{ allowedRoles: UserRole[]; children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const { user, quickLoginAsRole } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">403 Forbidden - Role Restricted</h2>
        <p className="text-xs text-slate-500 max-w-md">
          This area is restricted to [{allowedRoles.join(', ')}]. You are currently authenticated as{' '}
          <strong>{user?.fullName}</strong> with role <strong>{user?.role}</strong>.
        </p>

        <div className="flex gap-2 pt-2">
          {allowedRoles.map((r) => (
            <button
              key={r}
              onClick={() => quickLoginAsRole(r)}
              className="px-4 py-2 bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-800 transition-colors"
            >
              Switch to {r} Demo Account
            </button>
          ))}
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/help" element={<ApplicantHelpFaqPage />} />

            {/* Applicant Protected Routes */}
            <Route
              path="/applicant/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['applicant']}>
                    <ApplicantDashboard />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/applicant/profile"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['applicant']}>
                    <ApplicantProfilePage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/applicant/apply"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['applicant']}>
                    <ApplyNowPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/applicant/my-applications"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['applicant']}>
                    <MyApplicationsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/applicant/applications/:id"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['applicant']}>
                    <ApplicationDetailsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/applicant/documents"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['applicant']}>
                    <ApplicantDocumentsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/applicant/document-analysis"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['applicant']}>
                    <DocumentAnalysisPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/applicant/eligibility-result"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['applicant']}>
                    <EligibilityResultPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/applicant/deficiencies"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['applicant']}>
                    <DeficienciesPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/applicant/notifications"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['applicant']}>
                    <ApplicantNotificationsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/applicant/communication"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['applicant']}>
                    <ApplicantCommunicationPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/applicant/selection-result"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['applicant']}>
                    <ApplicantSelectionResultPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/applicant/post-selection"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['applicant']}>
                    <ApplicantPostSelectionPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/applicant/help"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['applicant']}>
                    <ApplicantHelpFaqPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />

            {/* Officer Protected Routes */}
            <Route
              path="/officer/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['officer', 'selection', 'admin']}>
                    <OfficerDashboard />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/queue"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['officer', 'selection', 'admin']}>
                    <OfficerQueuePage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/applications/:id"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['officer', 'selection', 'admin']}>
                    <OfficerReviewPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/documents"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['officer', 'selection', 'admin']}>
                    <OfficerReviewPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/eligibility"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['officer', 'selection', 'admin']}>
                    <OfficerReviewPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/deficiencies"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['officer', 'selection', 'admin']}>
                    <OfficerDeficienciesPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/screening"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['officer', 'selection', 'admin']}>
                    <OfficerScreeningPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/selection"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['officer', 'selection', 'admin']}>
                    <OfficerSelectionPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/communication"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['officer', 'selection', 'admin']}>
                    <ApplicantCommunicationPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/ai-assistant"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['officer', 'selection', 'admin']}>
                    <OfficerAiAssistantPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/reports"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['officer', 'selection', 'admin']}>
                    <OfficerReportsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/notifications"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['officer', 'selection', 'admin']}>
                    <ApplicantNotificationsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminDashboard />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminDashboard />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/applications"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminApplicationsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/schemes"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminSchemesPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/rules"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminRulesPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/documents"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminDocumentsConfigPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/workflows"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminWorkflowsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/templates"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminTemplatesPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminUsersPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <OfficerReportsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminAuditLogsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/ai-assistant"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <OfficerAiAssistantPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/demo-tools"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminDemoToolsPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
