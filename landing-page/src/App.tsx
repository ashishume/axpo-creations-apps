import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Products from "@/pages/Products";
import Contact from "@/pages/Contact";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import Copyright from "@/pages/Copyright";
import DeleteAccount from "@/pages/DeleteAccount";
import Open from "@/pages/Open";
import ExpenseTrackerApp from "@/pages/ExpenseTrackerApp";
import DownloadApp from "@/pages/DownloadApp";
import VioraPrivacyPolicy from "@/pages/VioraPrivacyPolicy";
import VioraAccountDeletion from "@/pages/VioraAccountDeletion";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/products" component={Products} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/copyright" component={Copyright} />
      <Route path="/delete-account" component={DeleteAccount} />
      {/* Multi-segment paths: /open/lend/contact/:id, /open/splitter/:id, etc. */}
      <Route path="/open/*" component={Open} />
      <Route path="/open" component={Open} />
      <Route path="/expense-tracker-app" component={ExpenseTrackerApp} />
      <Route path="/axpo" component={DownloadApp} />
      <Route path="/download" component={DownloadApp} />
      <Route path="/viora/privacy-policy" component={VioraPrivacyPolicy} />
      <Route path="/viora/account-deletion" component={VioraAccountDeletion} />
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
