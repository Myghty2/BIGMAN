import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FolderKanban, UploadCloud, ShieldCheck,
  Satellite, LogOut, Leaf, Menu, X
} from "lucide-react";
import { useState } from "react";
import { getCurrentUser, logoutOrganization } from "../services/authService";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/evidence", label: "Evidence", icon: UploadCloud },
  { to: "/verification", label: "Verification", icon: ShieldCheck },
  { to: "/monitoring", label: "Monitoring", icon: Satellite },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const logout = () => {
    logoutOrganization();
    navigate("/login");
  };

  const isVerified = currentUser?.status === "Verified";

  return (
    <div className="min-h-screen bg-slate-50">
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-ocean p-2 text-white lg:hidden"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-ocean text-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Leaf className="text-emerald-400" />
              BlueGuard
            </div>
            <p className="mt-1 text-xs text-emerald-300">Verify Before You Trust</p>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                    isActive ? "bg-emerald-500 text-white" : "text-slate-300 hover:bg-white/10"
                  }`
                }
              >
                <Icon size={19} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="mb-3 rounded-xl bg-white/5 p-3">
              <p className="truncate text-sm font-semibold">
                {currentUser?.organizationName || "Guest Organization"}
              </p>
              <p className="text-xs text-slate-400">
                {currentUser?.organizationType || "—"}
                {" • "}
                <span className={isVerified ? "text-emerald-400" : "text-amber-400"}>
                  {currentUser?.status || "Not signed in"}
                </span>
              </p>
            </div>
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/95 px-6 backdrop-blur">
          <div className="ml-10 lg:ml-0">
            <p className="text-xs text-slate-500">Blue Carbon Registry & MRV</p>
            <h1 className="font-semibold text-slate-800">Environmental Monitoring Platform</h1>
          </div>
          <div className="hidden rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 sm:block">
            ● System Online
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}