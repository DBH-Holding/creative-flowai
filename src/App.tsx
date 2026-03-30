import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import BriefingPage from "./pages/BriefingPage";
import CampaignPage from "./pages/CampaignPage";
import PlansPage from "./pages/PlansPage";
import BillingPage from "./pages/BillingPage";
import ApisPage from "./pages/ApisPage";
import ProfilePage from "./pages/ProfilePage";
import IntegrationsPage from "./pages/IntegrationsPage";
import DashboardPage from "./pages/DashboardPage";
import AgencyPage from "./pages/AgencyPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import RoadmapPage from "./pages/RoadmapPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminSubscriptionsPage from "./pages/admin/AdminSubscriptionsPage";
import AdminPlansPage from "./pages/admin/AdminPlansPage";
import AdminRevenuePage from "./pages/admin/AdminRevenuePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/briefing" element={<BriefingPage />} />
            <Route path="/campanha" element={<CampaignPage />} />
            <Route path="/planos" element={<PlansPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/apis" element={<ApisPage />} />
            <Route path="/integracoes" element={<IntegrationsPage />} />
            <Route path="/agencia" element={<AgencyPage />} />
            <Route path="/convite" element={<AcceptInvitePage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="/admin/plans" element={<AdminPlansPage />} />
            <Route path="/admin/revenue" element={<AdminRevenuePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
