import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppHeader } from "@/components/AppHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AlertTriangle } from "lucide-react";
import LoginPage from "@/pages/login";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import WalletPage from "@/pages/wallet";
import ApiKeyDetailsPage from "@/pages/api-key-details";
import SettingsPage from "@/pages/settings";
import SupportPage from "@/pages/support";
import NotFound from "@/pages/not-found";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen w-full">
        <div className="bg-blue-900/30 border-b border-blue-500/50 px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-sm text-blue-200">
            <AlertTriangle className="w-4 h-4" />
            <span>dKit Partners Dashboard alpha version. In Development.</span>
          </div>
        </div>
        <AppHeader />
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/login" component={LoginPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/dashboard">
        <ProtectedLayout>
          <DashboardPage />
        </ProtectedLayout>
      </Route>
      <Route path="/api-keys">
        <ProtectedLayout>
          <WalletPage />
        </ProtectedLayout>
      </Route>
      <Route path="/api-keys/:id">
        <ProtectedLayout>
          <ApiKeyDetailsPage />
        </ProtectedLayout>
      </Route>
      <Route path="/settings">
        <ProtectedLayout>
          <SettingsPage />
        </ProtectedLayout>
      </Route>
      <Route path="/support">
        <ProtectedLayout>
          <SupportPage />
        </ProtectedLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
