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
} from "lucide-react";
import { getCurrentUser, logoutOrganization } from "../services/authService";

const navLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/evidence", label: "Evidence", icon: UploadCloud },
  { to: "/verification", label: "Verification", icon: ShieldCheck },
  { to: "/monitoring", label: "Monitoring", icon: Satellite },
  { to: "/admin", label: "Admin Console", icon: ShieldAlert },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    logoutOrganization();
    navigate("/login");
  };

  const isVerified = currentUser?.status === "Verified";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Floating Mobile Toggle Button */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle Navigation Menu"
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-deep-navy/90 text-white shadow-xl backdrop-blur-md transition hover:bg-deep-navy active:scale-95 lg:hidden"
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

      {/* Sleek App Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-deep-navy text-white transition-transform duration-300 ease-in-out border-r border-white/10 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between">
          {/* Logo & Brand Header */}
          <div>
            <div className="border-b border-white/10 px-6 py-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-teal text-emerald-300 shadow-md border border-white/15">
                  <Leaf size={22} className="animate-pulse" />
                </div>
                <div>
                  <h1 className="dashboard-display text-xl font-bold tracking-tight text-white">
                    BlueGuard
                  </h1>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sand">
                    Verify Before You Trust
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-1.5 p-4">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-brand-teal text-white shadow-md border border-white/10"
                        : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          size={19}
                          className={`transition-colors ${
                            isActive ? "text-emerald-300" : "text-slate-400 group-hover:text-sand"
                          }`}
                        />
                        <span>{label}</span>
                      </div>
                      {isActive && (
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
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
                <p className="truncate text-xs font-bold text-white">
                  {currentUser?.organizationName || "Demo Foundation"}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                    isVerified
                      ? "bg-seagrass/25 text-emerald-300 border border-seagrass/40"
                      : "bg-sand/20 text-sand border border-sand/30"
                  }`}
                >
                  {currentUser?.status || "Active"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {currentUser?.organizationType || "Restoration Partner"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={17} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Clean, Full-Height, No Redundant Top Nav) */}
      <main className="min-h-screen flex-1 lg:ml-64 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}