import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { QueryProvider } from "./context/QueryProvider";
import { SubscriptionProvider } from "./providers/SubscriptionProvider";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Layout } from "./components/layout/Layout";
import { MaintenancePage } from "./pages/MaintenancePage";

const isMaintenanceMode =
  import.meta.env.VITE_MAINTENANCE_MODE === "true" ||
  import.meta.env.VITE_MAINTENANCE_MODE === "1";

function App() {
  if (isMaintenanceMode) {
    return <MaintenancePage />;
  }

  return (
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <AppProvider>
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            </AppProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  );
}

export default App;
