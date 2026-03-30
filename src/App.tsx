import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Payment from "./pages/Payment";
import Home from "./pages/Home";
import Guided from "./pages/Guided";
import Compute from "./pages/Compute";
import Review from "./pages/Review";
import Result from "./pages/Result";
import FilingPack from "./pages/FilingPack";
import ManualHub from "./pages/ManualHub";
import Income from "./pages/Income";
import CapitalGains from "./pages/CapitalGains";
import Deductions from "./pages/Deductions";
import BenefitsInKind from "./pages/BenefitsInKind";
import AssetDeclarations from "./pages/AssetDeclarations";
import CapitalAllowances from "./pages/CapitalAllowances";
import Settings from "./pages/Settings";
import ImportData from "./pages/ImportData";
import TaxOptimizer from "./pages/TaxOptimizer";
import YearComparison from "./pages/YearComparison";
import TaxCalendar from "./pages/TaxCalendar";
import DocumentVault from "./pages/DocumentVault";
import AdminDashboard from "./pages/AdminDashboard";
import TaxProfile from "./pages/TaxProfile";
import LirsGuide from "./pages/LirsGuide";
import LirsTaxReturnGuidePage from "./pages/LirsTaxReturnGuide";
import TaxGlossary from "./pages/TaxGlossary";
import FeatureSuggestions from "./pages/FeatureSuggestions";
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
            <Route path="/payment" element={<Payment />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="home" replace />} />
              <Route path="home" element={<Home />} />
              {/* <Route path="guided" element={<Guided />} /> */}
              <Route path="tax-calculator" element={<Compute />} />
              {/* <Route path="review" element={<Review />} />
              <Route path="result" element={<Result />} />
              <Route path="filing-pack" element={<FilingPack />} />
              <Route path="manual" element={<ManualHub />} />
              <Route path="manual/income" element={<Income />} />
              <Route path="manual/capital-gains" element={<CapitalGains />} />
              <Route path="manual/deductions" element={<Deductions />} />
              <Route path="manual/benefits-in-kind" element={<BenefitsInKind />} />
              <Route path="manual/asset-declarations" element={<AssetDeclarations />} />
              <Route path="manual/capital-allowances" element={<CapitalAllowances />} />
              <Route path="tax-profile" element={<TaxProfile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="import" element={<ImportData />} />
              <Route path="optimizer" element={<TaxOptimizer />} />
              <Route path="comparison" element={<YearComparison />} />
              <Route path="calendar" element={<TaxCalendar />} />
              <Route path="documents" element={<DocumentVault />} /> */}
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="lirs-guide" element={<LirsGuide />} />
              <Route path="lirs-tax-return" element={<LirsTaxReturnGuidePage />} />
              <Route path="glossary" element={<TaxGlossary />} />
              <Route path="suggestions" element={<FeatureSuggestions />} />
            </Route>
            <Route path="/" element={<Navigate to="/app/home" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
