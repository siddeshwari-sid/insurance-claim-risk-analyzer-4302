import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import UploadPage from "./pages/UploadPage";
import QueuePage from "./pages/QueuePage";
import ClaimDetailPage from "./pages/ClaimDetailPage";
import LoginPage from "./pages/LoginPage";
import RequireAuth from "./auth/RequireAuth";

// PUBLIC_INTERFACE
function App() {
  /**
   * Main React application entry.
   * Provides login route and protects app routes (dashboard/upload/queue/detail) behind auth.
   */
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Protected application routes */}
      <Route
        path="/*"
        element={
          <RequireAuth>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/queue" element={<QueuePage />} />
                <Route path="/claims/:id" element={<ClaimDetailPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AppLayout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;
