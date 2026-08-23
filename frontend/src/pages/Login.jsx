import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import greenWater from "../assets/greenWater.jpg";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  LockKeyhole,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
  Waves,
  Zap,
} from "lucide-react";
import {
  loginOrganization,
  registerOrganization,
} from "../services/authService";

export default function Login() {
  const navigate = useNavigate();

  const [accessMode, setAccessMode] = useState("organization"); // 'organization' | 'admin'
  const [mode, setMode] = useState("login"); // 'login' | 'register'

  // Organization Login State
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  // Admin Login State
  const [adminForm, setAdminForm] = useState({
    email: "",
    password: "",
  });

  // Organization Registration State
  const [registerForm, setRegisterForm] = useState({
    organizationName: "",
    organizationType: "NGO",
    registrationNumber: "",
    officialEmail: "",
    phone: "",
    representativeName: "",
    designation: "",
    registeredAddress: "",
    state: "",
    website: "",
    password: "",
    confirmPassword: "",
  });

  const [showOrgPassword, setShowOrgPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const switchAccessMode = (newMode) => {
    setAccessMode(newMode);
    clearMessages();
  };

  // Handlers for Org Login
  const handleOrgLoginSubmit = (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    const email = loginForm.email.trim();
    const password = loginForm.password;

    setTimeout(() => {
      const result = loginOrganization(email, password);
      setLoading(false);

      if (!result.success) {
        if (email.toLowerCase().includes("admin") || email.toLowerCase().includes("verifier")) {
          setError("This account is for the Verifier portal. Please switch to the Verifier tab above.");
        } else {
          setError(result.message || "Invalid email or password. You can also click Auto-fill Demo below.");
        }
        return;
      }

      localStorage.setItem(
        "blueguard_session",
        JSON.stringify({
          role: "organization",
          email: email,
          loggedInAt: new Date().toISOString(),
        })
      );
      localStorage.removeItem("blueguard_admin_session");

      setSuccess("Signing in... Redirecting to dashboard.");
      setTimeout(() => {
        navigate("/dashboard");
      }, 600);
    }, 400);
  };

  // Handlers for Admin Login
  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    const email = adminForm.email.trim();
    const password = adminForm.password;

    setTimeout(() => {
      setLoading(false);
      if (
        (email.toLowerCase() === "admin@blueguard.io" || email.toLowerCase() === "verifier@blueguard.io") &&
        (password === "admin123" || password === "verifier123" || password === "BlueGuard2026!")
      ) {
        localStorage.setItem(
          "blueguard_admin_session",
          JSON.stringify({
            role: "admin",
            email: email,
            name: "BlueGuard Verifier",
            loggedInAt: new Date().toISOString(),
          })
        );
        setSuccess("Verifier authorized. Redirecting to admin panel...");
        setTimeout(() => {
          navigate("/admin");
        }, 600);
      } else {
        setError("Invalid credentials. Try: admin@blueguard.io / admin123");
      }
    }, 400);
  };

  // Handlers for Org Registration
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    clearMessages();

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (registerForm.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const result = registerOrganization(registerForm);
      setLoading(false);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setSuccess("Account created successfully! You can now sign in.");
      setLoginForm({
        email: registerForm.officialEmail,
        password: registerForm.password,
      });
      setMode("login");
    }, 500);
  };

  const quickFillOrg = () => {
    setLoginForm({
      email: "contact@mumbaicoastal.org",
      password: "password123",
    });
    clearMessages();
  };

  const quickFillAdmin = () => {
    setAdminForm({
      email: "admin@blueguard.io",
      password: "admin123",
    });
    clearMessages();
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-8 font-sans text-slate-100 selection:bg-emerald-500 selection:text-slate-950 overflow-y-auto">
      {/* Custom Keyframe Animations */}
      <style>{`
        @keyframes floatGlow1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.2; }
          50% { transform: translate(30px, -20px) scale(1.15); opacity: 0.35; }
        }
        @keyframes floatGlow2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.15; }
          50% { transform: translate(-30px, 20px) scale(1.2); opacity: 0.3; }
        }
        @keyframes cardEntrance {
          0% { opacity: 0; transform: translateY(24px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0px) scale(1); }
        }
        .animate-card-in {
          animation: cardEntrance 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-glow-1 {
          animation: floatGlow1 8s ease-in-out infinite;
        }
        .animate-glow-2 {
          animation: floatGlow2 10s ease-in-out infinite;
        }
      `}</style>

      {/* =========================================================
          FULL-SCREEN IMMERSIVE BACKGROUND
          ========================================================= */}
      <img
        src={greenWater}
        alt="Coastal Background"
        className="fixed inset-0 h-full w-full object-cover filter brightness-[0.4] contrast-110 scale-105"
      />
      {/* Dark Ambient Overlays & Floating Light Orbs */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/80 to-slate-950/90 backdrop-blur-[5px]" />
      <div className="pointer-events-none fixed -top-20 -left-20 h-[550px] w-[550px] rounded-full bg-emerald-500/20 blur-[150px] animate-glow-1" />
      <div className="pointer-events-none fixed -bottom-20 -right-20 h-[550px] w-[550px] rounded-full bg-teal-400/20 blur-[150px] animate-glow-2" />

      {/* =========================================================
          SPACIOUS, CENTERED & ANIMATED AUTHENTICATION CARD
          ========================================================= */}
      <div className="relative z-10 w-full max-w-xl my-8 animate-card-in">
        {/* Top Back Link with subtle hover slide */}
        <div className="mb-5 flex items-center justify-between px-1">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-emerald-300 transition-all duration-200 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300 shadow-sm backdrop-blur-md">
            <Sparkles size={13} className="text-emerald-400" />
            <span>BlueGuard MRV Portal</span>
          </div>
        </div>

        {/* Big Glassmorphism Card with Gradient Border Hover */}
        <div className="rounded-[32px] border border-white/15 bg-slate-900/90 p-7 sm:p-10 md:p-12 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-emerald-500/40 hover:shadow-emerald-950/30">
          
          {/* Brand Logo & Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center justify-center gap-3 mb-4 group">
              <div className="flex h-13 w-13 p-2.5 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-teal-800 shadow-lg shadow-emerald-950/50 group-hover:scale-105 group-hover:rotate-2 transition-all">
                <Waves size={26} className="text-slate-950" />
              </div>
              <span className="text-3xl font-black tracking-tight text-white">
                BlueGuard
              </span>
            </Link>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {accessMode === "organization"
                ? mode === "login"
                  ? "Welcome Back"
                  : "Register Your Organization"
                : "Verifier Portal"}
            </h1>
            <p className="mt-2 text-sm text-slate-300 font-normal max-w-md mx-auto leading-relaxed">
              {accessMode === "organization"
                ? mode === "login"
                  ? "Sign in to monitor restoration sites, logs, and telemetry."
                  : "Complete your profile to register your restoration entity."
                : "Secure auditor gateway for independent validation and credit sign-off."}
            </p>
          </div>

          {/* DUAL ROLE TOGGLE WITH GLOW */}
          <div className="mb-6 rounded-2xl border border-slate-700/80 bg-slate-950/80 p-1.5 flex items-center shadow-inner">
            <button
              type="button"
              onClick={() => switchAccessMode("organization")}
              className={`flex-1 flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-bold transition-all duration-300 ${
                accessMode === "organization"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-950/50 scale-[1.02]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Building2 size={18} />
              <span>Organization</span>
            </button>

            <button
              type="button"
              onClick={() => switchAccessMode("admin")}
              className={`flex-1 flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-bold transition-all duration-300 ${
                accessMode === "admin"
                  ? "bg-slate-800 border border-emerald-500/50 text-emerald-300 shadow-md scale-[1.02]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldCheck size={18} />
              <span>Verifier / Admin</span>
            </button>
          </div>

          {/* SUB-TABS: SIGN IN VS REGISTER (For Organization) */}
          {accessMode === "organization" && (
            <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-950/60 p-1 border border-slate-800 text-xs sm:text-sm font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  clearMessages();
                }}
                className={`py-2.5 rounded-lg text-center transition-all duration-200 ${
                  mode === "login"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  clearMessages();
                }}
                className={`py-2.5 rounded-lg text-center transition-all duration-200 ${
                  mode === "register"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* ALERT MESSAGES WITH SMOOTH FADE */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/15 p-4 text-sm text-rose-200 animate-fadeIn shadow-lg">
              <AlertTriangle size={19} className="shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-4 text-sm text-emerald-200 animate-fadeIn shadow-lg">
              <CheckCircle2 size={19} className="shrink-0 text-emerald-400 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* =========================================================
              FORM 1: ORGANIZATION LOGIN
              ========================================================= */}
          {accessMode === "organization" && mode === "login" && (
            <form onSubmit={handleOrgLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Official Email Address
                </label>
                <div className="relative group">
                  <UserRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition" />
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="contact@mumbaicoastal.org"
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 py-3.5 pl-11 pr-4 text-sm sm:text-base text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition" />
                  <input
                    type={showOrgPassword ? "text" : "password"}
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 py-3.5 pl-11 pr-12 text-sm sm:text-base text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOrgPassword(!showOrgPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  >
                    {showOrgPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              {/* Demo Auto-fill Helper Chip */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={quickFillOrg}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold hover:bg-emerald-500/20 hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <Zap size={14} className="text-emerald-400" />
                  <span>Auto-fill Demo Org</span>
                </button>
                <span className="text-slate-400 font-mono text-[11px]">password: password123</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 py-4 text-base font-bold text-slate-950 shadow-xl shadow-emerald-950/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all duration-200 mt-3"
              >
                {loading ? (
                  <>
                    <RefreshCw size={19} className="animate-spin text-slate-950" />
                    <span>Signing in to Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ChevronRight size={19} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* =========================================================
              FORM 2: ORGANIZATION REGISTRATION
              ========================================================= */}
          {accessMode === "organization" && mode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Organization Legal Name *
                </label>
                <div className="relative">
                  <Building2 size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={registerForm.organizationName}
                    onChange={(e) => setRegisterForm({ ...registerForm, organizationName: e.target.value })}
                    placeholder="e.g. Mangrove Ecological Foundation"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Entity Type *
                  </label>
                  <select
                    value={registerForm.organizationType}
                    onChange={(e) => setRegisterForm({ ...registerForm, organizationType: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none transition"
                  >
                    <option>NGO / Non-Profit</option>
                    <option>Restoration Enterprise</option>
                    <option>Government Agency</option>
                    <option>Academic / Research</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Reg. Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={registerForm.registrationNumber}
                    onChange={(e) => setRegisterForm({ ...registerForm, registrationNumber: e.target.value })}
                    placeholder="REG-IN-2024-884"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={registerForm.officialEmail}
                    onChange={(e) => setRegisterForm({ ...registerForm, officialEmail: e.target.value })}
                    placeholder="contact@org.org"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    placeholder="+91 98200 12345"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Representative *
                  </label>
                  <input
                    type="text"
                    required
                    value={registerForm.representativeName}
                    onChange={(e) => setRegisterForm({ ...registerForm, representativeName: e.target.value })}
                    placeholder="Dr. Ramesh Patel"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={registerForm.designation}
                    onChange={(e) => setRegisterForm({ ...registerForm, designation: e.target.value })}
                    placeholder="Lead Director"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 py-3.5 text-sm font-bold text-slate-950 shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all duration-200 mt-3"
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin text-slate-950" />
                    <span>Registering Entity...</span>
                  </>
                ) : (
                  <>
                    <span>Create Organization Account</span>
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* =========================================================
              FORM 3: VERIFIER / ADMIN LOGIN
              ========================================================= */}
          {accessMode === "admin" && (
            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Verifier Official Email
                </label>
                <div className="relative group">
                  <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition" />
                  <input
                    type="email"
                    required
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    placeholder="admin@blueguard.io"
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 py-3.5 pl-11 pr-4 text-sm sm:text-base text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Security Passkey
                </label>
                <div className="relative group">
                  <LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition" />
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    required
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 py-3.5 pl-11 pr-12 text-sm sm:text-base text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  >
                    {showAdminPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              {/* Demo Auto-fill Helper for Verifier */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={quickFillAdmin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 font-bold hover:bg-teal-500/20 hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <Zap size={14} className="text-teal-400" />
                  <span>Auto-fill Verifier Key</span>
                </button>
                <span className="text-slate-400 font-mono text-[11px]">admin@blueguard.io / admin123</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-950 border border-emerald-500/50 hover:bg-emerald-950/80 py-4 text-base font-bold text-emerald-300 shadow-xl shadow-slate-950 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all duration-200 mt-3"
              >
                {loading ? (
                  <>
                    <RefreshCw size={19} className="animate-spin text-emerald-400" />
                    <span>Verifying Authority Key...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={19} />
                    <span>Sign In as Verifier</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Security Assurance */}
          <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Protected by 256-bit TLS Encryption</span>
            <span className="text-emerald-400 font-semibold">BlueGuard MRV</span>
          </div>
        </div>
      </div>
    </div>
  );
}
