import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import BriefingPage from "./pages/BriefingPage";
import CampaignPage from "./pages/CampaignPage";
import PlansPage from "./pages/PlansPage";
import BillingPage from "./pages/BillingPage";
import ApisPage from "./pages/ApisPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/briefing" element={<BriefingPage />} />
          <Route path="/campanha" element={<CampaignPage />} />
          <Route path="/planos" element={<PlansPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/apis" element={<ApisPage />} />
          <Route path="/integracoes" element={<IntegrationsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
