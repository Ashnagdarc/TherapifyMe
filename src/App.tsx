import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { Dashboard } from "./pages/Dashboard";
import { CheckInPage } from "./pages/CheckInPage";
import { AIResponsePage } from "./pages/AIResponsePage";
import { JournalPage } from "./pages/JournalPage";
import { SettingsPage } from "./pages/SettingsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [emergencyTimeout, setEmergencyTimeout] = React.useState(false);

  // Emergency timeout to prevent infinite loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("ProtectedRoute: Emergency timeout triggered");
        setEmergencyTimeout(true);
      }
    }, 8000); // 8 second emergency timeout

    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !emergencyTimeout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If emergency timeout or user check complete
  if (emergencyTimeout && !user) {
    console.warn("ProtectedRoute: Emergency redirect to auth");
    return <Navigate to="/auth" replace />;
  }

  return user ? <>{children}</> : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [emergencyTimeout, setEmergencyTimeout] = React.useState(false);

  // Emergency timeout to prevent infinite loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("PublicRoute: Emergency timeout triggered");
        setEmergencyTimeout(true);
      }
    }, 8000); // 8 second emergency timeout

    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !emergencyTimeout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your session...</p>
        </div>
      </div>
    );
  }

  // If emergency timeout and still loading, show children (public content)
  if (emergencyTimeout) {
    console.warn("PublicRoute: Emergency timeout, showing public content");
    return <>{children}</>;
  }

  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/check-in"
        element={
          <ProtectedRoute>
            <CheckInPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-response"
        element={
          <ProtectedRoute>
            <AIResponsePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/journal"
        element={
          <ProtectedRoute>
            <JournalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
