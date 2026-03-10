import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
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
    return (
      <ThemeProvider>
        <MaintenancePage />
      </ThemeProvider>
    );
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
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
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
