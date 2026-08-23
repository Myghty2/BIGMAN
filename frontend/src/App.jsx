import { Routes, Route, Navigate } from "react-router-dom";

import Admin from "./pages/Admin";
import Landing from "./pages/Landing";
import Login from "./pages/Login";

import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Evidence from "./pages/Evidence";
import Verification from "./pages/Verification";
import Monitoring from "./pages/Monitoring";

// Protected Admin Route Guard (Organizations cannot access /admin)
function AdminRoute({ children }) {
  const adminSession = JSON.parse(
    localStorage.getItem("blueguard_admin_session") || "null"
  );

  if (!adminSession || adminSession.role !== "admin") {
    // Redirect non-admin organizations to their dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* APPLICATION */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/evidence" element={<Evidence />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/monitoring" element={<Monitoring />} />

        {/* ADMIN (Protected: only accessible when logged in as admin) */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
      </Route>

      {/* UNKNOWN URL */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
