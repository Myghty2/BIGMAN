import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  FolderKanban,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Satellite,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
  Building2,
  Lock,
} from "lucide-react";
import { getCurrentUser, logoutOrganization } from "../services/authService";

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  // Check whether current user is an Admin or an Organization
  const adminSession = JSON.parse(
    localStorage.getItem("blueguard_admin_session") || "null"
  );
  const orgSession = JSON.parse(
    localStorage.getItem("blueguard_session") || "null"
  );
  const currentUser = getCurrentUser() || orgSession;

  const isAdmin = Boolean(adminSession && adminSession.role === "admin");

  const handleLogout = () => {
    logoutOrganization();
    localStorage.removeItem("blueguard_session");
    localStorage.removeItem("blueguard_admin_session");
    navigate("/login");
  };

  // Role-based Navigation Links
  const navLinks = isAdmin
    ? [
        { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { to: "/projects", label: "All Projects", icon: FolderKanban },
        { to: "/evidence", label: "Evidence Stream", icon: UploadCloud },
        { to: "/verification", label: "Verification Ledger", icon: ShieldCheck },
        { to: "/monitoring", label: "Satellite Telemetry", icon: Satellite },
        { to: "/admin", label: "Admin Console", icon: ShieldAlert, highlight: true },
      ]
    : [
        { to: "/dashboard", label: "My Dashboard", icon: LayoutDashboard },
        { to: "/projects", label: "My Projects", icon: FolderKanban },
        { to: "/evidence", label: "Submit Evidence", icon: UploadCloud },
        { to: "/verification", label: "Verification Status", icon: ShieldCheck },
        { to: "/monitoring", label: "Live Monitoring", icon: Satellite },
      ];

  const orgName = isAdmin
    ? adminSession?.name || "BlueGuard Admin"
    : currentUser?.organizationName || currentUser?.name || "Coastal NGO Partner";

  const orgType = isAdmin
    ? "Lead MRV Auditor"
    : currentUser?.organizationType || "Restoration Organization";

  return (
    <div className="min-h-screen bg-[#F7F8F4] flex">
      {/* Floating Mobile Toggle Button */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle Navigation Menu"
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-[#0B2B33] text-white shadow-xl backdrop-blur-md transition hover:bg-[#071C21] active:scale-95 lg:hidden"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop overlay on mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* App Sidebar: Deep Navy (#0B2B33) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-[#0B2B33] text-white transition-transform duration-300 ease-in-out border-r border-white/10 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between">
          {/* Logo & Brand Header */}
          <div>
            <div className="border-b border-white/10 px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#12545A] text-[#3F7D5C] shadow-md border border-white/15">
                  <Leaf size={22} className="text-[#5FBF8C]" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold tracking-tight text-white">
                    BlueGuard
                  </h1>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#E7DEC7]">
                    {isAdmin ? "Admin & Auditor Portal" : "Organization Portal"}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-1.5 p-4">
              {navLinks.map(({ to, label, icon: Icon, highlight }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? highlight
                          ? "bg-[#C46A3F] text-white shadow-md border border-white/20"
                          : "bg-[#12545A] text-white shadow-md border border-white/10"
                        : "text-[#B8CDD0] hover:bg-white/[0.08] hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          size={19}
                          className={`transition-colors ${
                            isActive
                              ? "text-[#5FBF8C]"
                              : "text-[#7AAAB1] group-hover:text-[#E7DEC7]"
                          }`}
                        />
                        <span>{label}</span>
                      </div>
                      {isActive && (
                        <span className="h-2 w-2 rounded-full bg-[#5FBF8C] shadow-[0_0_8px_rgba(95,191,140,0.9)]" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* User Profile Card & Logout */}
          <div className="border-t border-white/10 p-4">
            <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <p className="truncate text-xs font-bold text-white flex items-center gap-1.5">
                  {isAdmin ? <Lock size={13} className="text-[#C46A3F]" /> : <Building2 size={13} className="text-[#3F7D5C]" />}
                  <span>{orgName}</span>
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                    isAdmin
                      ? "bg-[#C46A3F]/25 text-[#C46A3F] border border-[#C46A3F]/40"
                      : "bg-[#3F7D5C]/25 text-[#5FBF8C] border border-[#3F7D5C]/40"
                  }`}
                >
                  {isAdmin ? "Admin" : "Organization"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[#8FB4BB] truncate">
                {orgType}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#8FB4BB] transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={17} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-h-screen flex-1 lg:ml-64 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
