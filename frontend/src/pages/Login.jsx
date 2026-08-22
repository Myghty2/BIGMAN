import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Leaf,
  ShieldCheck,
  Satellite,
  Blocks,
  ArrowLeft,
  CheckCircle2,
  LockKeyhole,
  UserRound,
  Eye,
  EyeOff,
  ClipboardCheck,
  Activity,
  UsersRound,
  KeyRound,
  Building2,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

import {
  loginOrganization,
  registerOrganization,
  getOrganizations,
} from "../services/authService";

import { demoOrganizations } from "../data/mockData";

export default function Login() {
  const navigate = useNavigate();

  /*
   * =========================================================
   * ACCESS MODES
   * =========================================================
   *
   * organization = NGO / company / restoration organization
   * admin        = BlueGuard administration + verification
   */
  const [accessMode, setAccessMode] = useState("organization");

  /*
   * organization login / register
   */
  const [mode, setMode] = useState("login");

  /*
   * organization login
   */
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  /*
   * admin login
   */
  const [adminForm, setAdminForm] = useState({
    email: "",
    password: "",
  });

  /*
   * admin password visibility
   */
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  /*
   * organization password visibility
   */
  const [showOrgPassword, setShowOrgPassword] = useState(false);

  /*
   * registration form
   */
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

  /*
   * UI state
   */
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function switchAccessMode(modeName) {
    setAccessMode(modeName);
    clearMessages();
    setLoading(false);
  }

  /*
   * =========================================================
   * ORGANIZATION INPUTS
   * =========================================================
   */

  function handleLoginChange(event) {
    const { name, value } = event.target;

    setLoginForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleRegisterChange(event) {
    const { name, value } = event.target;

    setRegisterForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  /*
   * =========================================================
   * ADMIN INPUTS
   * =========================================================
   */

  function handleAdminChange(event) {
    const { name, value } = event.target;

    setAdminForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  /*
   * =========================================================
   * ORGANIZATION LOGIN
   * =========================================================
   */

  function handleLoginSubmit(event) {
    event.preventDefault();

    clearMessages();
    setLoading(true);

    const result = loginOrganization(
      loginForm.email.trim(),
      loginForm.password
    );

    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    /*
     * Explicitly identify current access role.
     */
    localStorage.setItem(
      "blueguard_session",
      JSON.stringify({
        role: "organization",
        email: loginForm.email.trim(),
        loggedInAt: new Date().toISOString(),
      })
    );

    setSuccess("Organization authenticated. Opening workspace...");

    setTimeout(() => {
      navigate("/dashboard");
    }, 650);
  }

  /*
   * =========================================================
   * ADMIN LOGIN
   * =========================================================
   *
   * Prototype credentials:
   *
   * Email:    admin@blueguard.org
   * Password: admin123
   *
   * IMPORTANT:
   * This is ONLY for the prototype.
   * Production authentication must happen on the backend.
   */

  function handleAdminSubmit(event) {
    event.preventDefault();

    clearMessages();

    const email = adminForm.email.trim().toLowerCase();
    const password = adminForm.password;

    if (!email || !password) {
      setError("Enter your administrator email and password.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const isValidAdmin =
        email === "admin@blueguard.org" &&
        password === "admin123";

      setLoading(false);

      if (!isValidAdmin) {
        setError(
          "Invalid administrator credentials. Use the BlueGuard demo administrator account."
        );
        return;
      }

      /*
       * Admin session is deliberately separate
       * from organization session.
       */
      localStorage.setItem(
        "blueguard_admin_session",
        JSON.stringify({
          role: "admin",
          email,
          name: "BlueGuard Administrator",
          permissions: [
            "review_evidence",
            "approve_projects",
            "reject_projects",
            "request_evidence",
            "view_audit_log",
            "manage_verification",
          ],
          loggedInAt: new Date().toISOString(),
        })
      );

      /*
       * Remove any organization session so the two
       * roles cannot accidentally overlap.
       */
      localStorage.removeItem("blueguard_session");

      setSuccess("Administrator authenticated. Opening control center...");

      setTimeout(() => {
        navigate("/admin");
      }, 650);
    }, 450);
  }

  /*
   * =========================================================
   * ORGANIZATION REGISTRATION
   * =========================================================
   */

  function handleRegisterSubmit(event) {
    event.preventDefault();

    clearMessages();

    if (
      registerForm.password !==
      registerForm.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    if (registerForm.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    const result = registerOrganization(registerForm);

    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setSuccess(
      "Organization registered successfully. You can now sign in."
    );

    setRegisterForm({
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

    setTimeout(() => {
      setMode("login");

      setLoginForm({
        email: result.organization.officialEmail,
        password: "",
      });
    }, 1000);
  }

  /*
   * =========================================================
   * ORGANIZATION DEMO ACCOUNT
   * =========================================================
   */

  function useDemoAccount() {
    const demo = demoOrganizations[0];

    const organizations = getOrganizations();

    const demoExists = organizations.some(
      (organization) =>
        organization.officialEmail.toLowerCase() ===
        demo.officialEmail.toLowerCase()
    );

    if (!demoExists) {
      localStorage.setItem(
        "blueguard_organizations",
        JSON.stringify([
          ...organizations,
          demo,
        ])
      );
    }

    setAccessMode("organization");
    setMode("login");

    setLoginForm({
      email: demo.officialEmail,
      password: demo.demoPassword,
    });

    clearMessages();

    setSuccess(
      "Demo organization credentials loaded. Click Sign In."
    );
  }

  /*
   * =========================================================
   * ADMIN DEMO ACCOUNT
   * =========================================================
   */

  function useAdminDemo() {
    setAdminForm({
      email: "admin@blueguard.org",
      password: "admin123",
    });

    clearMessages();

    setSuccess(
      "Demo administrator credentials loaded. Click Admin Sign In."
    );
  }

  /*
   * =========================================================
   * RETURN
   * =========================================================
   */

  return (
    <div className="min-h-screen bg-[#f4f7f5] px-3 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8">

      {/* BACK */}
      <button
        onClick={() => navigate("/")}
        className="mx-auto mb-5 flex max-w-6xl items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-700"
      >
        <ArrowLeft size={17} />
        Back to BlueGuard
      </button>

      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1440px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.10)] lg:grid-cols-[0.95fr_1.05fr]">

        {/* =====================================================
            LEFT BRAND PANEL
        ====================================================== */}

        <section className="relative hidden overflow-hidden bg-[#09231d] p-8 text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-14">

          {/* Decorative background */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative">

            {/* LOGO */}
            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10">
                <Leaf
                  className="text-emerald-300"
                  size={28}
                />
              </div>

              <div>

                <div className="flex items-center gap-2">

                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    BlueGuard
                  </h1>

                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    MRV
                  </span>

                </div>

                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">

                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                  Registry Network Online

                </div>

              </div>

            </div>

            {/* HERO */}
            <div className="mt-16 max-w-xl">

              <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-300/80">
                Verify Before You Trust
              </p>

              <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-white lg:text-5xl">
                Trust the data.
                <br />

                <span className="bg-gradient-to-r from-emerald-300 to-blue-400 bg-clip-text text-transparent">
                  Protect the blue.
                </span>
              </h2>

              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300/80">
                A blockchain-based Blue Carbon Registry & MRV
                platform for transparent mangrove and seagrass
                restoration monitoring.
              </p>

            </div>

            {/* PLATFORM FLOW */}
            <div className="mt-12">

              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                BlueGuard verification pipeline
              </p>

              <div className="space-y-3">

                {[
                  [
                    Building2,
                    "Project Registration",
                    "Organization submits restoration project",
                  ],
                  [
                    ClipboardCheck,
                    "Evidence & Analysis",
                    "Evidence, GIS, satellite and automated checks",
                  ],
                  [
                    ShieldCheck,
                    "Human Verification",
                    "BlueGuard administrator makes final decision",
                  ],
                  [
                    Blocks,
                    "Trusted Record",
                    "Approved verification can be anchored on blockchain",
                  ],
                ].map(([Icon, title, description], index) => (

                  <div
                    key={title}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >

                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">

                      <Icon
                        size={20}
                        className="text-emerald-300"
                      />

                    </div>

                    <div className="min-w-0">

                      <p className="text-sm font-semibold text-white">
                        {title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {description}
                      </p>

                    </div>

                    {index < 3 && (
                      <ChevronRight
                        size={16}
                        className="ml-auto shrink-0 text-slate-600"
                      />
                    )}

                  </div>

                ))}

              </div>

            </div>

          </div>

          {/* FEATURES */}
          <div className="relative mt-10 grid grid-cols-3 gap-3">

            {[
              [ShieldCheck, "Verified Evidence"],
              [Satellite, "AI + Satellite"],
              [Blocks, "Blockchain"],
            ].map(([Icon, label]) => (

              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
              >

                <Icon
                  className="mx-auto mb-2 text-emerald-400"
                  size={23}
                />

                <p className="text-xs text-slate-300">
                  {label}
                </p>

              </div>

            ))}

          </div>

        </section>

        {/* =====================================================
            RIGHT AUTH PANEL
        ====================================================== */}

        <section className="max-h-[calc(100vh-3rem)] overflow-y-auto bg-white px-5 py-7 sm:px-8 sm:py-9 lg:px-12 lg:py-12 xl:px-16">

          <div className="mx-auto w-full max-w-xl">

            {/* =================================================
                ACCESS SELECTOR
            ================================================== */}

            <div className="mb-8">

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                Secure Access Gateway
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Welcome to BlueGuard
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Choose the workspace you are authorized to access.
              </p>

              {/* ROLE SELECTOR */}

              <div className="mt-7 grid grid-cols-2 gap-1.5 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5 shadow-inner">

                {/* ORGANIZATION */}

                <button
                  type="button"
                  onClick={() => switchAccessMode("organization")}
                  className={`rounded-xl p-4 text-left transition ${
                    accessMode === "organization"
                      ? "bg-slate-900 shadow-sm"
                      : "hover:bg-white/70"
                  }`}
                >

                  <div className="flex items-center gap-3">

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        accessMode === "organization"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Building2 size={20} />
                    </div>

                    <div>

                      <p className="text-sm font-bold text-slate-800">
                        Organization
                      </p>

                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Projects & evidence
                      </p>

                    </div>

                  </div>

                </button>

                {/* ADMIN */}

                <button
                  type="button"
                  onClick={() => switchAccessMode("admin")}
                  className={`rounded-xl p-4 text-left transition ${
                    accessMode === "admin"
                      ? "bg-[#09231d] shadow-md ring-1 ring-emerald-700/40"
                      : "hover:bg-white/70"
                  }`}
                >

                  <div className="flex items-center gap-3">

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        accessMode === "admin"
                          ? "bg-emerald-400/10 text-emerald-400"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <ShieldCheck size={20} />
                    </div>

                    <div>

                      <p
                        className={`text-sm font-bold ${
                          accessMode === "admin"
                            ? "text-white"
                            : "text-slate-800"
                        }`}
                      >
                        Admin & Verification
                      </p>

                      <p
                        className={`mt-0.5 text-[11px] ${
                          accessMode === "admin"
                            ? "text-slate-400"
                            : "text-slate-500"
                        }`}
                      >
                        Review & approve
                      </p>

                    </div>

                  </div>

                </button>

              </div>

            </div>

            {/* =================================================
                ADMIN LOGIN
            ================================================== */}

            {accessMode === "admin" && (

              <>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">

                  <div className="flex items-start gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900">
                      <ShieldCheck
                        size={22}
                        className="text-emerald-400"
                      />
                    </div>

                    <div>

                      <p className="text-sm font-bold text-slate-900">
                        BlueGuard Administration
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Authorized personnel can review automated
                        verification results and make the final
                        project approval decision.
                      </p>

                    </div>

                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">

                    {[
                      [ClipboardCheck, "Review"],
                      [UsersRound, "Decide"],
                      [Activity, "Audit"],
                    ].map(([Icon, label]) => (

                      <div
                        key={label}
                        className="rounded-xl border border-slate-200 bg-white p-3 text-center"
                      >

                        <Icon
                          size={17}
                          className="mx-auto text-emerald-600"
                        />

                        <p className="mt-1.5 text-[11px] font-semibold text-slate-600">
                          {label}
                        </p>

                      </div>

                    ))}

                  </div>

                </div>

                {/* MESSAGES */}

                {error && (
                  <div className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                    <AlertTriangle
                      size={18}
                      className="shrink-0"
                    />

                    <span>{error}</span>

                  </div>
                )}

                {success && (
                  <div className="mt-5 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">

                    <CheckCircle2
                      size={18}
                      className="shrink-0"
                    />

                    <span>{success}</span>

                  </div>
                )}

                {/* ADMIN FORM */}

                <form
                  onSubmit={handleAdminSubmit}
                  className="mt-7 space-y-5"
                >

                  <div>

                    <label className="mb-2 block text-sm font-semibold">
                      Administrator email
                    </label>

                    <div className="relative">

                      <UserRound
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="email"
                        name="email"
                        required
                        value={adminForm.email}
                        onChange={handleAdminChange}
                        placeholder="admin@blueguard.org"
                        className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />

                    </div>

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-semibold">
                      Administrator password
                    </label>

                    <div className="relative">

                      <LockKeyhole
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type={
                          showAdminPassword
                            ? "text"
                            : "password"
                        }
                        name="password"
                        required
                        value={adminForm.password}
                        onChange={handleAdminChange}
                        placeholder="Enter secure password"
                        className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-12 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowAdminPassword(
                            (value) => !value
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showAdminPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>

                    </div>

                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {loading ? (
                      <>
                        <Activity
                          size={18}
                          className="animate-pulse"
                        />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        Enter Admin Control Center
                      </>
                    )}

                  </button>

                </form>

                {/* ADMIN DEMO */}

                <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">

                  <div className="flex items-start gap-3">

                    <KeyRound
                      size={19}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />

                    <div className="min-w-0">

                      <p className="text-sm font-bold text-emerald-900">
                        SIH Demo Administrator
                      </p>

                      <p className="mt-1 text-xs leading-5 text-emerald-800">
                        Use the pre-configured administrator
                        account to demonstrate evidence review,
                        approval and verification workflows.
                      </p>

                      <button
                        type="button"
                        onClick={useAdminDemo}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                      >
                        Load demo credentials
                        <ChevronRight size={14} />
                      </button>

                    </div>

                  </div>

                </div>

                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">

                  <div className="flex gap-3">

                    <LockKeyhole
                      size={18}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <p className="text-xs leading-5 text-amber-800">
                      <strong>Prototype security notice:</strong>{" "}
                      administrator credentials are currently
                      handled client-side for demonstration.
                      Production authentication and permissions
                      must be enforced by the backend.
                    </p>

                  </div>

                </div>

              </>

            )}

            {/* =================================================
                ORGANIZATION ACCESS
            ================================================== */}

            {accessMode === "organization" && (

              <>

                {mode === "login" && (

                  <>

                    <p className="text-sm font-semibold text-emerald-600">
                      ORGANIZATION ACCESS
                    </p>

                    <h1 className="mt-2 text-3xl font-bold">
                      Sign in to BlueGuard
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                      Access your organization's restoration
                      and MRV workspace.
                    </p>

                    {/* LOGIN / REGISTER */}

                    <div className="mt-7 flex rounded-xl bg-slate-100 p-1">

                      <button
                        type="button"
                        onClick={() => {
                          setMode("login");
                          clearMessages();
                        }}
                        className="flex-1 rounded-lg bg-white py-2.5 text-sm font-semibold text-slate-800 shadow-sm"
                      >
                        Sign In
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMode("register");
                          clearMessages();
                        }}
                        className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
                      >
                        Register Organization
                      </button>

                    </div>

                    {/* MESSAGES */}

                    {error && (
                      <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="mt-5 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">

                        <CheckCircle2
                          size={18}
                          className="shrink-0"
                        />

                        {success}

                      </div>
                    )}

                    {/* FORM */}

                    <form
                      onSubmit={handleLoginSubmit}
                      className="mt-7 space-y-5"
                    >

                      <div>

                        <label className="mb-2 block text-sm font-medium">
                          Organization email
                        </label>

                        <input
                          type="email"
                          name="email"
                          required
                          value={loginForm.email}
                          onChange={handleLoginChange}
                          placeholder="ngo@example.org"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />

                      </div>

                      <div>

                        <div className="mb-2 flex justify-between">

                          <label className="block text-sm font-medium">
                            Password
                          </label>

                          <button
                            type="button"
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                            onClick={() =>
                              setSuccess(
                                "Password recovery will be connected to the backend."
                              )
                            }
                          >
                            Forgot password?
                          </button>

                        </div>

                        <div className="relative">

                          <input
                            type={
                              showOrgPassword
                                ? "text"
                                : "password"
                            }
                            name="password"
                            required
                            value={loginForm.password}
                            onChange={handleLoginChange}
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3.5 pr-12 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowOrgPassword(
                                (value) => !value
                              )
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          >
                            {showOrgPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>

                        </div>

                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >

                        {loading
                          ? "Signing in..."
                          : "Sign In"}

                        {!loading && (
                          <ChevronRight size={18} />
                        )}

                      </button>

                    </form>

                    {/* DEMO */}

                    <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">

                      <div className="flex items-start gap-3">

                        <ShieldCheck
                          className="mt-0.5 shrink-0 text-emerald-600"
                          size={19}
                        />

                        <div>

                          <p className="text-sm font-semibold text-emerald-900">
                            SIH Demo Organization
                          </p>

                          <p className="mt-1 text-xs leading-5 text-emerald-800">
                            Use our pre-verified organization
                            account to demonstrate the BlueGuard
                            workspace.
                          </p>

                          <button
                            type="button"
                            onClick={useDemoAccount}
                            className="mt-3 text-xs font-bold text-emerald-700 underline hover:text-emerald-900"
                          >
                            Load demo account
                          </button>

                        </div>

                      </div>

                    </div>

                    <p className="mt-6 text-center text-sm text-slate-500">

                      New organization?

                      <button
                        type="button"
                        onClick={() => {
                          setMode("register");
                          clearMessages();
                        }}
                        className="ml-1 font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        Register here
                      </button>

                    </p>

                  </>

                )}

                {/* =================================================
                    REGISTER
                ================================================== */}

                {mode === "register" && (

                  <>

                    <p className="text-sm font-semibold text-emerald-600">
                      ORGANIZATION REGISTRATION
                    </p>

                    <h1 className="mt-2 text-3xl font-bold">
                      Register your organization
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Create an organization account to submit
                      restoration projects and evidence to BlueGuard.
                    </p>

                    <div className="mt-7 flex rounded-xl bg-slate-100 p-1">

                      <button
                        type="button"
                        onClick={() => {
                          setMode("login");
                          clearMessages();
                        }}
                        className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
                      >
                        Sign In
                      </button>

                      <button
                        type="button"
                        className="flex-1 rounded-lg bg-white py-2.5 text-sm font-semibold text-slate-800 shadow-sm"
                      >
                        Register Organization
                      </button>

                    </div>

                    {error && (
                      <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="mt-5 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">

                        <CheckCircle2
                          size={18}
                          className="shrink-0"
                        />

                        {success}

                      </div>
                    )}

                    <form
                      onSubmit={handleRegisterSubmit}
                      className="mt-7 space-y-7"
                    >

                      {/* ORGANIZATION IDENTITY */}

                      <div>

                        <h2 className="text-base font-bold">
                          1. Organization Identity
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                          Tell us about the organization registering
                          on BlueGuard.
                        </p>

                        <div className="mt-4 space-y-4">

                          <div>

                            <label className="mb-2 block text-sm font-medium">
                              Organization name *
                            </label>

                            <input
                              type="text"
                              name="organizationName"
                              required
                              value={registerForm.organizationName}
                              onChange={handleRegisterChange}
                              placeholder="Example Foundation"
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />

                          </div>

                          <div>

                            <label className="mb-2 block text-sm font-medium">
                              Organization type *
                            </label>

                            <select
                              name="organizationType"
                              required
                              value={registerForm.organizationType}
                              onChange={handleRegisterChange}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            >

                              <option value="NGO">
                                NGO
                              </option>

                              <option value="Government Body">
                                Government Body
                              </option>

                              <option value="Community Group">
                                Community Group
                              </option>

                              <option value="Corporate">
                                Corporate
                              </option>

                              <option value="Research Institute">
                                Research Institute
                              </option>

                            </select>

                          </div>

                          <div>

                            <label className="mb-2 block text-sm font-medium">
                              Registration / Incorporation Number *
                            </label>

                            <input
                              type="text"
                              name="registrationNumber"
                              required
                              value={registerForm.registrationNumber}
                              onChange={handleRegisterChange}
                              placeholder="NGO Darpan ID / Trust No. / CIN"
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />

                            <p className="mt-1.5 text-xs text-slate-400">
                              NGO Darpan ID, Trust/Society Registration
                              No., CIN or relevant registration ID.
                            </p>

                          </div>

                        </div>

                      </div>

                      {/* CONTACT */}

                      <div>

                        <h2 className="text-base font-bold">
                          2. Organization Contact
                        </h2>

                        <div className="mt-4 space-y-4">

                          <div>

                            <label className="mb-2 block text-sm font-medium">
                              Official email *
                            </label>

                            <input
                              type="email"
                              name="officialEmail"
                              required
                              value={registerForm.officialEmail}
                              onChange={handleRegisterChange}
                              placeholder="contact@organization.org"
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />

                          </div>

                          <div>

                            <label className="mb-2 block text-sm font-medium">
                              Phone number *
                            </label>

                            <input
                              type="tel"
                              name="phone"
                              required
                              value={registerForm.phone}
                              onChange={handleRegisterChange}
                              placeholder="+91 9876543210"
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />

                          </div>

                          <div>

                            <label className="mb-2 block text-sm font-medium">
                              Registered address *
                            </label>

                            <textarea
                              name="registeredAddress"
                              required
                              value={registerForm.registeredAddress}
                              onChange={handleRegisterChange}
                              rows="3"
                              placeholder="Registered organization address"
                              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />

                          </div>

                          <div>

                            <label className="mb-2 block text-sm font-medium">
                              State *
                            </label>

                            <select
                              name="state"
                              required
                              value={registerForm.state}
                              onChange={handleRegisterChange}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            >

                              <option value="">
                                Select state
                              </option>

                              <option>Maharashtra</option>
                              <option>West Bengal</option>
                              <option>Tamil Nadu</option>
                              <option>Gujarat</option>
                              <option>Kerala</option>
                              <option>Odisha</option>
                              <option>Andhra Pradesh</option>
                              <option>Other</option>

                            </select>

                          </div>

                          <div>

                            <label className="mb-2 block text-sm font-medium">
                              Website
                              <span className="ml-1 text-xs font-normal text-slate-400">
                                Optional
                              </span>
                            </label>

                            <input
                              type="url"
                              name="website"
                              value={registerForm.website}
                              onChange={handleRegisterChange}
                              placeholder="https://organization.org"
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />

                          </div>

                        </div>

                      </div>

                      {/* REPRESENTATIVE */}

                      <div>

                        <h2 className="text-base font-bold">
                          3. Authorized Representative
                        </h2>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">

                          <div>

                            <label className="mb-2 block text-sm font-medium">
                              Representative name *
                            </label>

                            <input
                              type="text"
                              name="representativeName"
                              required
                              value={registerForm.representativeName}
                              onChange={handleRegisterChange}
                              placeholder="Full name"
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />

                          </div>

                          <div>

                            <label className="mb-2 block text-sm font-medium">
                              Designation *
                            </label>

                            <input
                              type="text"
                              name="designation"
                              required
                              value={registerForm.designation}
                              onChange={handleRegisterChange}
                              placeholder="Director"
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />

                          </div>

                        </div>

                      </div>

                      {/* ACCOUNT */}

                      <div>

                        <h2 className="text-base font-bold">
                          4. Create Account
                        </h2>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">

                          <div>

                            <label className="mb-2 block text-sm font-medium">
                              Password *
                            </label>

                            <input
                              type="password"
                              name="password"
                              required
                              value={registerForm.password}
                              onChange={handleRegisterChange}
                              placeholder="Minimum 6 characters"
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />

                          </div>

                          <div>

                            <label className="mb-2 block text-sm font-medium">
                              Confirm password *
                            </label>

                            <input
                              type="password"
                              name="confirmPassword"
                              required
                              value={registerForm.confirmPassword}
                              onChange={handleRegisterChange}
                              placeholder="Repeat password"
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />

                          </div>

                        </div>

                      </div>

                      {/* VERIFICATION NOTICE */}

                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                        <div className="flex gap-3">

                          <ShieldCheck
                            className="mt-0.5 shrink-0 text-amber-600"
                            size={19}
                          />

                          <div>

                            <p className="text-sm font-semibold text-amber-900">
                              Organization verification
                            </p>

                            <p className="mt-1 text-xs leading-5 text-amber-800">
                              Registration does not automatically verify
                              your organization. Newly registered
                              organizations enter{" "}
                              <strong>
                                Pending Verification
                              </strong>{" "}
                              until reviewed by BlueGuard administration.
                            </p>

                          </div>

                        </div>

                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading
                          ? "Creating organization..."
                          : "Register Organization"}
                      </button>

                      <p className="text-center text-sm text-slate-500">

                        Already registered?

                        <button
                          type="button"
                          onClick={() => {
                            setMode("login");
                            clearMessages();
                          }}
                          className="ml-1 font-semibold text-emerald-600"
                        >
                          Sign in
                        </button>

                      </p>

                    </form>

                  </>

                )}

              </>

            )}

          </div>

        </section>

      </div>

    </div>
  );
}