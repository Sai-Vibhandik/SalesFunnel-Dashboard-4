import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { Layout } from '@/components/layout';

// Auth pages
import { LoginPage, RegisterPage } from '@/pages/auth';

// Dashboard
import { DashboardPage } from '@/pages/dashboard';

// Projects
import { ProjectsListPage, CreateProjectPage, ProjectDetailPage, TeamAssignmentPage } from '@/pages/projects';
import ProjectAssetsPage from '@/pages/projects/ProjectAssetsPage';

// Stages
import {
  MarketResearchPage,
  OfferEngineeringPage,
  TrafficStrategyPage,
  LandingPageStrategyPage,
  CreativeStrategyPage,
} from '@/pages/stages';
import LandingPagesListPage from '@/pages/stages/LandingPagesListPage';

// Tasks
import { TasksPage } from '@/pages/tasks';
import TesterReviewPage from '@/pages/tasks/TesterReviewPage';
import MarketerApprovalPage from '@/pages/tasks/MarketerApprovalPage';
import TaskDetailPage from '@/pages/tasks/TaskDetailPage';
import ApprovedAssetsPage from '@/pages/tasks/ApprovedAssetsPage';

// Team
import { TeamManagementPage } from '@/pages/team';

// Admin
import { ClientsPage, SOPLibraryPage } from '@/pages/admin';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Admin Route wrapper
function AdminRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Team Route wrapper (NOT admin - for performance marketers, designers, developers, testers)
function TeamRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin cannot access strategy stages
  if (user?.role === 'admin') {
    return <Navigate to="/projects" replace />;
  }

  return children;
}

// Marketer Route wrapper (admin or performance_marketer only - for strategy editing)
function MarketerRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Only admin and performance_marketer can access
  if (user?.role !== 'admin' && user?.role !== 'performance_marketer') {
    return <Navigate to="/projects" replace />;
  }

  return children;
}

// Public Route wrapper (redirect if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <SocketProvider>
              <NotificationProvider>
                <ProjectProvider>
                  <Layout />
                </ProjectProvider>
              </NotificationProvider>
            </SocketProvider>
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route path="/" element={<DashboardPage />} />

        {/* Projects */}
        <Route path="/projects" element={<ProjectsListPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/projects/:id/assets" element={<ProjectAssetsPage />} />

        {/* Create Project - Admin only */}
        <Route
          path="/projects/new"
          element={
            <AdminRoute>
              <CreateProjectPage />
            </AdminRoute>
          }
        />

        {/* Team Assignment - Admin only */}
        <Route
          path="/projects/:id/assign-team"
          element={
            <AdminRoute>
              <TeamAssignmentPage />
            </AdminRoute>
          }
        />

        {/* Stage routes - Only admin and performance_marketer can edit */}
        <Route
          path="/market-research"
          element={
            <MarketerRoute>
              <MarketResearchPage />
            </MarketerRoute>
          }
        />
        <Route
          path="/offer-engineering"
          element={
            <MarketerRoute>
              <OfferEngineeringPage />
            </MarketerRoute>
          }
        />
        <Route
          path="/traffic-strategy"
          element={
            <MarketerRoute>
              <TrafficStrategyPage />
            </MarketerRoute>
          }
        />
        <Route
          path="/landing-pages"
          element={
            <MarketerRoute>
              <LandingPagesListPage />
            </MarketerRoute>
          }
        />
        <Route
          path="/landing-page-strategy"
          element={
            <MarketerRoute>
              <LandingPageStrategyPage />
            </MarketerRoute>
          }
        />
        <Route
          path="/creative-strategy"
          element={
            <MarketerRoute>
              <CreativeStrategyPage />
            </MarketerRoute>
          }
        />

        {/* Tasks */}
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/:taskId" element={<TaskDetailPage />} />

        {/* Tester Review - Tester/Admin only */}
        <Route
          path="/tasks/review"
          element={
            <ProtectedRoute>
              {(() => {
                const { user } = useAuth();
                if (user?.role === 'tester' || user?.role === 'admin') {
                  return <TesterReviewPage />;
                }
                return <Navigate to="/tasks" replace />;
              })()}
            </ProtectedRoute>
          }
        />

        {/* Marketer Approval - Performance Marketer/Admin only */}
        <Route
          path="/tasks/approval"
          element={
            <ProtectedRoute>
              {(() => {
                const { user } = useAuth();
                if (user?.role === 'performance_marketer' || user?.role === 'admin') {
                  return <MarketerApprovalPage />;
                }
                return <Navigate to="/tasks" replace />;
              })()}
            </ProtectedRoute>
          }
        />

        {/* Approved Assets - Tester only */}
        <Route
          path="/tasks/approved"
          element={
            <ProtectedRoute>
              {(() => {
                const { user } = useAuth();
                if (user?.role === 'tester' || user?.role === 'admin') {
                  return <ApprovedAssetsPage />;
                }
                return <Navigate to="/tasks" replace />;
              })()}
            </ProtectedRoute>
          }
        />

        {/* Team Management (Admin only) */}
        <Route
          path="/team"
          element={
            <AdminRoute>
              <TeamManagementPage />
            </AdminRoute>
          }
        />

        {/* Clients (Admin only) */}
        <Route
          path="/clients"
          element={
            <AdminRoute>
              <ClientsPage />
            </AdminRoute>
          }
        />

        {/* SOP Library (Admin only) */}
        <Route
          path="/sop-library"
          element={
            <AdminRoute>
              <SOPLibraryPage />
            </AdminRoute>
          }
        />

        {/* Reports (placeholder) */}
        <Route
          path="/reports"
          element={
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
              <p className="text-gray-600 mt-2">Coming soon...</p>
            </div>
          }
        />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}