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

export default function App() {
  return (
    <Routes>

      {/* =====================================================
          PUBLIC
      ====================================================== */}

      <Route
        path="/"
        element={<Landing />}
      />

      <Route
        path="/login"
        element={<Login />}
      />


      {/* =====================================================
          APPLICATION
      ====================================================== */}

      <Route element={<Layout />}>

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/projects"
          element={<Projects />}
        />

        <Route
          path="/projects/:id"
          element={<ProjectDetails />}
        />

        <Route
          path="/evidence"
          element={<Evidence />}
        />

        <Route
          path="/verification"
          element={<Verification />}
        />

        <Route
          path="/monitoring"
          element={<Monitoring />}
        />

        {/* =================================================
            ADMIN / VERIFICATION CONTROL CENTER
        ================================================= */}

        <Route
          path="/admin"
          element={<Admin />}
        />

      </Route>


      {/* =====================================================
          UNKNOWN URL
      ====================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}