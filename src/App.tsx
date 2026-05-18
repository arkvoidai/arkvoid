import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { MarketingLayout } from './layouts/MarketingLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Home } from './pages/marketing/Home';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { VerifyOtp } from './pages/auth/VerifyOtp';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { GitHubCallback } from './pages/auth/GitHubCallback';

// Lazy loaded dashboard pages
const Overview = lazy(() => import('./pages/dashboard/Overview').then(m => ({ default: m.Overview })));
const Agents = lazy(() => import('./pages/dashboard/Agents').then(m => ({ default: m.Agents })));
const AgentDetail = lazy(() => import('./pages/dashboard/AgentDetail').then(m => ({ default: m.AgentDetail })));
const Traces = lazy(() => import('./pages/dashboard/Traces').then(m => ({ default: m.Traces })));
const TraceDetail = lazy(() => import('./pages/dashboard/TraceDetail').then(m => ({ default: m.TraceDetail })));
const AuditLog = lazy(() => import('./pages/dashboard/AuditLog').then(m => ({ default: m.AuditLog })));
const Compliance = lazy(() => import('./pages/dashboard/Compliance').then(m => ({ default: m.Compliance })));
const Policies = lazy(() => import('./pages/dashboard/Policies').then(m => ({ default: m.Policies })));
const Reviews = lazy(() => import('./pages/dashboard/Reviews').then(m => ({ default: m.Reviews })));
const Webhooks = lazy(() => import('./pages/dashboard/Webhooks').then(m => ({ default: m.Webhooks })));
const Settings = lazy(() => import('./pages/dashboard/Settings').then(m => ({ default: m.Settings })));
const Admin = lazy(() => import('./pages/dashboard/Admin').then(m => ({ default: m.Admin })));
const ApiKeys = lazy(() => import('./pages/dashboard/ApiKeys').then(m => ({ default: m.ApiKeys })));
const Integrations = lazy(() => import('./pages/dashboard/Integrations').then(m => ({ default: m.Integrations })));

import { useAuth } from './hooks/useAuth';

import { Pricing } from './pages/marketing/Pricing';
import { About } from './pages/marketing/About';
import { Privacy } from './pages/marketing/Privacy';
import { Terms } from './pages/marketing/Terms';
import { Contact } from './pages/marketing/Contact';
import { Security } from './pages/marketing/Security';
import { StatusPage } from './pages/StatusPage';
import { Dpa } from './pages/marketing/Dpa';
import { Docs } from './pages/marketing/Docs';
import { Blog } from './pages/marketing/Blog';
import { BlogArticle } from './pages/marketing/BlogArticle';
import { AuthProvider } from './contexts/AuthContext';
import { SharedReport } from './pages/marketing/SharedReport';
import { OGImage } from './pages/OGImage';

import { PremiumGateProvider } from './hooks/usePremiumGate';

import { FeatureFlagProvider } from './hooks/useFeatureFlags';
import { ErrorTracker } from './hooks/ErrorTracker';
import { ErrorBoundary } from './components/ErrorBoundary';

import { AdminLogin } from './admin/AdminLogin';
import { AdminLayout } from './admin/AdminLayout';
import { AdminAuthGuard } from './admin/AdminAuthGuard';
import { 
  AdminDashboard, AdminAnalytics, AdminRealTimeMonitor, AdminUsers, AdminUserDetail,
  AdminUserLocations, AdminSubscriptions, AdminAgentsMonitor, AdminTraceAnalytics,
  AdminAPIUsage, AdminRevenue, AdminBilling, AdminLeads, AdminDeployments,
  AdminErrorLogs, AdminFeatureFlags, AdminSettings
} from './admin/AdminPagesPlaceholder';


import { Features } from './pages/marketing/Features';
import { HowItWorksPage } from './pages/marketing/HowItWorks';

// Generic Skeleton for Suspense fallback
function PageSkeleton() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex gap-4">
        <div className="h-20 w-48 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] skeleton animate-fadeInUp"></div>
        <div className="h-20 w-48 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] skeleton animate-fadeInUp" style={{ animationDelay: '30ms' }}></div>
      </div>
      <div className="h-[400px] w-full bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] skeleton animate-fadeInUp" style={{ animationDelay: '60ms' }}></div>
    </div>
  );
}

// Protected Route wrapper
function ProtectedRoute({ children, requireAdmin = false, requireUser = false }: { children: React.ReactNode, requireAdmin?: boolean, requireUser?: boolean }) {
  const { user, loading, isAdmin, isGuest } = useAuth();
  const location = useLocation();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]"><div className="animate-spin h-8 w-8 border-[3px] border-[rgba(255,255,255,0.2)] border-t-[var(--text-primary)] rounded-full" /></div>;
  if (!user && !isGuest) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/login?returnUrl=${returnUrl}`} replace />;
  }
  if (requireUser && isGuest) return <Navigate to="/dashboard/overview" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard/overview" replace />;
  
  return <>{children}</>;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function GlobalGuestModal() {
  const { showGuestExpiredModal } = useAuth();
  if (!showGuestExpiredModal) return null;
  
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-2xl rounded-2xl w-full max-w-md p-6 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--accent-amber)]/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h3 className="text-[20px] font-bold text-white mb-2">Guest Access Expired</h3>
          <p className="text-[14px] text-[var(--text-secondary)] mb-6 leading-relaxed">
            Your guest access has expired. Create a free account to continue using ARKVOID and unlock all features.
          </p>
          <div className="flex flex-col gap-3">
            <Link 
              to="/auth/signup" 
              className="w-full bg-[var(--accent-amber)] hover:bg-[var(--accent-amber-hover)] text-black font-semibold text-[14px] py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              Create Account <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
            </Link>
            <Link 
              to="/auth/login" 
              className="w-full bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-white border border-[var(--border-default)] font-semibold text-[14px] py-2.5 rounded-lg transition-colors flex justify-center items-center"
            >
              Login
            </Link>
          </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <Analytics />
      <Helmet titleTemplate="%s" defaultTitle="ARKVOID Trust Layer for Autonomous AI Agents" />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <ErrorTracker />
          <FeatureFlagProvider>
          <PremiumGateProvider>
            <GlobalGuestModal />
            <ErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
            <Routes>
          <Route element={<MarketingLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogArticle />} />
          <Route path="/security" element={<Security />} />
          <Route path="/dpa" element={<Dpa />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/status" element={<StatusPage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/verify" element={<VerifyOtp />} />
          <Route path="/verify-otp" element={<Navigate to="/auth/verify" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/github/callback" element={<GitHubCallback />} />
        </Route>
        
        <Route path="/report/:token" element={<SharedReport />} />
        <Route path="/og-preview" element={<OGImage />} />

        {/* Admin routing */}
        <Route path="/admin/manish/nine-heaven/access-voidsoul" element={<AdminLogin />} />
        
        <Route path="/admin/manish/nine-heaven/access-voidsoul/*" element={<AdminAuthGuard><AdminLayout /></AdminAuthGuard>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="monitor" element={<AdminRealTimeMonitor />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetail />} />
          <Route path="locations" element={<AdminUserLocations />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="agents" element={<AdminAgentsMonitor />} />
          <Route path="traces" element={<AdminTraceAnalytics />} />
          <Route path="api-usage" element={<AdminAPIUsage />} />
          <Route path="revenue" element={<AdminRevenue />} />
          <Route path="billing" element={<AdminBilling />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="deployments" element={<AdminDeployments />} />
          <Route path="errors" element={<AdminErrorLogs />} />
          <Route path="features" element={<AdminFeatureFlags />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="" element={<Navigate to="dashboard" replace />} />
        </Route>

        <Route path="/admin/*" element={<Navigate to="/" replace />} />

  {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="agents" element={<Agents />} />
          <Route path="agents/:slug" element={<AgentDetail />} />
          <Route path="traces" element={<Traces />} />
          <Route path="traces/:id" element={<TraceDetail />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="compliance" element={<Compliance />} />
          <Route path="policies" element={<Policies />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="api-keys" element={<ProtectedRoute requireUser><ApiKeys /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute requireUser><Settings /></ProtectedRoute>} />
          <Route path="integrations" element={<ProtectedRoute requireUser><Integrations /></ProtectedRoute>} />
          <Route path="webhooks" element={<ProtectedRoute requireUser><Webhooks /></ProtectedRoute>} />
          <Route path="admin" element={<ProtectedRoute requireAdmin requireUser><Admin /></ProtectedRoute>} />
        </Route>
      </Routes>
      </Suspense>
      </ErrorBoundary>
      </PremiumGateProvider>
      </FeatureFlagProvider>
      </AuthProvider>
    </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
