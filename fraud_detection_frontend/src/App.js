import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import UploadPage from "./pages/UploadPage";
import QueuePage from "./pages/QueuePage";
import ClaimDetailPage from "./pages/ClaimDetailPage";

/**
 * Main application component with sidebar layout and client-side routing.
 *
 * Routes:
 * - /dashboard (default)
 * - /upload
 * - /queue
 * - /claims/:id
 */
function App() {
  return (
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
  );
}

export default App;
