import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TaxProfile from "./pages/TaxProfile";
import Income from "./pages/Income";
import CapitalGains from "./pages/CapitalGains";
import Compute from "./pages/Compute";
import FilingPack from "./pages/FilingPack";
import AIAssistant from "./pages/AIAssistant";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tax-profile" element={<TaxProfile />} />
              <Route path="income" element={<Income />} />
              <Route path="capital-gains" element={<CapitalGains />} />
              <Route path="compute" element={<Compute />} />
              <Route path="filing-pack" element={<FilingPack />} />
              <Route path="ai-assistant" element={<AIAssistant />} />
            </Route>
            <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
