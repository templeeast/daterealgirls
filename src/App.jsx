import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Landing from '@/pages/Landing';
import Onboarding from '@/pages/Onboarding';
import Browse from '@/pages/Browse';
import ViewProfile from '@/pages/ViewProfile';
import MyProfile from '@/pages/MyProfile';
import Messages from '@/pages/Messages';
import Chat from '@/pages/Chat';
import Favorites from '@/pages/Favorites';
import Support from '@/pages/Support';
import Winks from '@/pages/Winks';
import ReportProfile from '@/pages/ReportProfile';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import TestPlan from '@/pages/admin/TestPlan';
import ContentReview from '@/pages/admin/ContentReview';
import AdminTodo from '@/pages/admin/AdminTodo';
import PromoCodes from '@/pages/admin/PromoCodes';
import AppLayout from '@/components/layout/AppLayout';
import useSiteConfig from '@/hooks/useSiteConfig';
import ProfileCompleteGuard from '@/components/layout/ProfileCompleteGuard';
import Privacy from '@/pages/Privacy';
import AppDisabledScreen from '@/components/AppDisabledScreen';
import Terms from '@/pages/Terms';
import RefundPolicy from '@/pages/RefundPolicy';
import ShippingPolicy from '@/pages/ShippingPolicy';
import ContactUs from '@/pages/ContactUs';
import WhopReturn from '@/pages/WhopReturn';
import PaymentHistory from '@/pages/PaymentHistory';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();
  const { config, isLoading: isLoadingConfig } = useSiteConfig();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth || isLoadingConfig) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Allow public routes to render for unauthenticated visitors
      const publicPaths = ['/', '/privacy', '/terms', '/support'];
      const isPublicPath = publicPaths.some(p => window.location.pathname === p || window.location.pathname.startsWith(p + '/'));
      if (!isPublicPath) {
        return <Landing />;
      }
    }
  }

  // Emergency kill switch — block non-admins when app is disabled
  if (config?.app_disabled && user?.role !== 'admin') {
    return <AppDisabledScreen message={config.app_disabled_message} />;
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<AppLayout />}>
        <Route path="/browse" element={<ProfileCompleteGuard><Browse /></ProfileCompleteGuard>} />
        <Route path="/profile/:id" element={<ProfileCompleteGuard><ViewProfile /></ProfileCompleteGuard>} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/messages" element={<ProfileCompleteGuard><Messages /></ProfileCompleteGuard>} />
        <Route path="/chat/:id" element={<ProfileCompleteGuard><Chat /></ProfileCompleteGuard>} />
        <Route path="/favorites" element={<ProfileCompleteGuard><Favorites /></ProfileCompleteGuard>} />
        <Route path="/winks" element={<ProfileCompleteGuard><Winks /></ProfileCompleteGuard>} />
        <Route path="/support" element={<Support />} />
        <Route path="/report/:id" element={<ProfileCompleteGuard><ReportProfile /></ProfileCompleteGuard>} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/test-plan" element={<TestPlan />} />
        <Route path="/admin/todo" element={<AdminTodo />} />
        <Route path="/admin/content-review" element={<ContentReview />} />
        <Route path="/admin/promo-codes" element={<PromoCodes />} />
      </Route>
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/shipping-policy" element={<ShippingPolicy />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/whop-return" element={<WhopReturn />} />
      <Route path="/payment-history" element={<PaymentHistory />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App