import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/AppHeader";
import { AuthProvider } from "@/hooks/useAuth";
import { ResizerProvider } from "@/hooks/useResizerState";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import InspirationAds from "./pages/InspirationAds";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="flex w-full min-h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <AppHeader />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  </SidebarProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ResizerProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfUse />} />
              <Route path="/" element={<AppLayout><Index /></AppLayout>} />
              <Route path="/inspiration" element={<AppLayout><InspirationAds /></AppLayout>} />
              <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </ResizerProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
