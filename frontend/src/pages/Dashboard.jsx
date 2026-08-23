import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award, CalendarDays, CarFront, CheckCircle2, ClipboardCheck, FileWarning, FolderKanban, Leaf, Plus, RefreshCw, Satellite, ShieldCheck, Sparkles, Trees } from "lucide-react";
import { projects as seedProjects } from "../data/mockData";
import { getCurrentUser } from "../services/authService";

const KEYS = { projects: "blueguard_projects", evidence: "blueguard_evidence", verifications: "blueguard_verifications", carbonHistory: "blueguard_carbon_history" };

function readArray(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

function readProjects() {
  return [...new Map([...seedProjects, ...readArray(KEYS.projects)].map((project) => [project.id, project])).values()];
}

function isAdminLoggedIn() {
  try {
    return JSON.parse(localStorage.getItem("blueguard_admin_session") || "null")?.role === "admin";
  } catch { return false; }
}

function groupStatus(status) {
  if (status === "Draft") return "draft";
  if (status === "Rejected") return "rejected";
  if (["Verified", "Approved", "Finished"].includes(status)) return "approved";
  if (["Under Review", "Under Human Verification"].includes(status)) return "verification";
  return "submitted";
}

function shortDate(value) {
  const date = new Date(value);
  return value && !Number.isNaN(date) ? date.toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "Recently";
}

function carbonValue(value) {
  const numericValue = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function carbonLabel(value) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toLocaleString();
}

function carbonEquivalents(total) {
  return {
    trees: Math.max(0, Math.round(total * 45)),
    cars: Math.max(0, Math.round(total / 4.6)),
  };
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState(readProjects);
  const [evidence, setEvidence] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [updated, setUpdated] = useState(new Date());
  const [carbonFeedOpen, setCarbonFeedOpen] = useState(true);
  const [carbonHistory, setCarbonHistory] = useState(() => readArray(KEYS.carbonHistory));
  const [isAdmin, setIsAdmin] = useState(isAdminLoggedIn);
  const [animatedCarbonTotal, setAnimatedCarbonTotal] = useState(0);

  const refresh = () => {
    setUser(getCurrentUser());
    setProjects(readProjects());
    setEvidence(readArray(KEYS.evidence));
    setVerifications(readArray(KEYS.verifications));
    setIsAdmin(isAdminLoggedIn());
    setUpdated(new Date());
  };

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const summary = useMemo(() => {
    const value = { total: projects.length, draft: 0, submitted: 0, verification: 0, approved: 0, rejected: 0 };
    projects.forEach((project) => { value[groupStatus(project.status)] += 1; });
    return value;
  }, [projects]);

  const lifecycle = useMemo(() => [
    ["Submitted", summary.submitted || 0],
    ["Automated analysis", projects.filter((p) => p.status === "Under Automated Analysis").length],
    ["Human review", summary.verification],
    ["Approved / rejected", summary.approved + summary.rejected],
  ], [projects, summary]);

  const activity = useMemo(() => [
    ...projects.map((p) => ({ title: p.name, detail: `Project ${p.status === "Draft" ? "saved as draft" : "submitted"}`, date: p.updatedAt || p.createdAt || p.startDate })),
    ...evidence.map((e) => ({ title: e.name || e.fileName || "Evidence uploaded", detail: "Evidence added for review", date: e.createdAt || e.uploadedAt })),
    ...verifications.map((v) => ({ title: v.projectName || v.projectId || "Verification updated", detail: `Verifier decision: ${v.result || "submitted"}`, date: v.submittedAt || v.createdAt })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5), [projects, evidence, verifications]);

  const attention = useMemo(() => projects.filter((p) => ["Draft", "Under Review", "Requires Information"].includes(p.status)), [projects]);
  const carbonImpact = useMemo(() => {
    const items = projects
      .map((project) => ({ ...project, carbonAmount: carbonValue(project.carbon) }))
      .filter((project) => project.carbonAmount > 0)
      .sort((a, b) => b.carbonAmount - a.carbonAmount);
    return { total: items.reduce((sum, project) => sum + project.carbonAmount, 0), items };
  }, [projects]);

  useEffect(() => {
    setCarbonHistory((history) => {
      const lastEntry = history[history.length - 1];
      if (lastEntry?.total === carbonImpact.total) return history;

      const nextHistory = [...history.slice(-29), { total: carbonImpact.total, timestamp: new Date().toISOString() }];
      localStorage.setItem(KEYS.carbonHistory, JSON.stringify(nextHistory));
      return nextHistory;
    });
  }, [carbonImpact.total]);

  const carbonChange = useMemo(() => {
    if (carbonHistory.length < 2) return null;
    const current = carbonHistory[carbonHistory.length - 1].total;
    const previous = carbonHistory[carbonHistory.length - 2].total;
    return current - previous;
  }, [carbonHistory]);

  useEffect(() => {
    const target = carbonImpact.total;
    if (!isAdmin || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnimatedCarbonTotal(target);
      return undefined;
    }

    const duration = 1100;
    const startedAt = performance.now();
    let frameId;
    const animate = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setAnimatedCarbonTotal(Math.round(target * eased));
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    setAnimatedCarbonTotal(0);
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [carbonImpact.total, isAdmin]);
  const nextMilestone = attention[0];
  const achievements = [
    { label: "First project", complete: summary.total > 0 },
    { label: "Evidence submitted", complete: evidence.length > 0 },
    { label: "Verification approved", complete: summary.approved > 0 },
  ];

  return <div className="min-h-full bg-slate-50 p-6 lg:p-8">
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-deep-navy via-brand-teal to-seagrass px-6 py-7 shadow-lg lg:flex lg:items-end lg:justify-between lg:px-8">
      <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-sand/15 blur-2xl" />
      <div>
        <p className="text-base font-bold tracking-wider text-sand sm:text-lg">BLUEGUARD OVERVIEW</p>
        <h1 className="dashboard-display mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Welcome{user?.organizationName ? `, ${user.organizationName}` : isAdmin ? ", BlueGuard Administrator" : ""}
        </h1>
        <p className="mt-2 text-base text-slate-200">Track your restoration projects and verification status.</p>
        <span className={`mt-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold ${attention.length ? "bg-coral/20 text-white" : "bg-white/15 text-sand"}`}><Sparkles size={15} />{attention.length ? `${attention.length} action${attention.length > 1 ? "s" : ""} need attention` : "Everything is on track"}</span>
      </div>
      <div className="relative mt-6 flex items-center gap-3 lg:mt-0">
        <span className="hidden text-xs text-slate-200 sm:block">Updated {updated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        <button onClick={refresh} className="rounded-xl border border-white/20 bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Refresh dashboard"><RefreshCw size={17} /></button>
        <Link to="/projects?new=true" className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-5 py-3 text-sm font-semibold text-white transition hover:bg-deep-navy"><Plus size={18} />Submit new project</Link>
      </div>
    </header>

    <section className="relative mt-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-deep-navy via-brand-teal to-seagrass shadow-xl" aria-labelledby="carbon-impact-heading">
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sand/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-seagrass/30 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full bg-mint/10 blur-2xl" />

      <div className={`relative ${carbonFeedOpen ? "grid lg:grid-cols-[1.15fr_0.85fr]" : ""}`}>
        <div className="relative p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              id="carbon-impact-heading"
              className="inline-flex items-center gap-2.5 rounded-full border border-sand/30 bg-sand/15 px-3.5 py-1.5 text-xs sm:text-sm font-bold tracking-wider text-sand backdrop-blur-md"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </span>
              <Leaf size={16} className="text-emerald-300" />
              <span>CARBON IMPACT</span>
            </div>
            <button
              type="button"
              onClick={() => setCarbonFeedOpen((open) => !open)}
              aria-expanded={carbonFeedOpen}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-sand backdrop-blur transition hover:border-white/30 hover:bg-white/20 hover:text-white"
            >
              {carbonFeedOpen ? "Hide project feed" : "View project feed"}
              <ArrowRight className={`transition-transform duration-200 ${carbonFeedOpen ? "rotate-90" : ""}`} size={15} />
            </button>
          </div>
          <p className="dashboard-display mt-4 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            {carbonLabel(animatedCarbonTotal)}
            <span className="ml-2 align-baseline text-2xl font-semibold text-sand sm:text-3xl lg:text-4xl">tCO₂e</span>
          </p>
          <p className="mt-2.5 max-w-xl text-sm sm:text-base leading-relaxed text-slate-200">Estimated carbon sequestered across registered blue-carbon restoration projects.</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {carbonChange !== null && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs sm:text-sm font-semibold backdrop-blur ${
                  carbonChange >= 0
                    ? "border-seagrass/40 bg-seagrass/25 text-emerald-200"
                    : "border-coral/40 bg-coral/20 text-white"
                }`}
              >
                <span>{carbonChange >= 0 ? "↑" : "↓"}</span>
                <span>{carbonLabel(Math.abs(carbonChange))} tCO₂e since last update</span>
              </span>
            )}
            <CarbonSparkline history={carbonHistory} />
          </div>
          <div className="relative mt-8">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand">Estimated equivalent</p>
            <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
              <EquivalentCard icon={<Trees size={19} />} label="Mangrove equivalent" value={carbonLabel(carbonEquivalents(carbonImpact.total).trees)} hint="trees grown for 10 years" iconTheme="seagrass" />
              <EquivalentCard icon={<CarFront size={19} />} label="Avoided emissions" value={carbonLabel(carbonEquivalents(carbonImpact.total).cars)} hint="cars off the road for a year" iconTheme="sand" />
            </div>
          </div>
        </div>
        {carbonFeedOpen && (
          <div className="flex flex-col justify-between border-t border-white/15 bg-deep-navy/35 p-6 backdrop-blur-md lg:border-l lg:border-t-0 lg:p-8">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="dashboard-card-title text-lg sm:text-xl font-bold text-white">Project carbon feed</h2>
                  <p className="mt-1 text-sm sm:text-base text-slate-300">Share of the registry total from each project.</p>
                </div>
                <span className="rounded-full border border-sand/30 bg-sand/15 px-3.5 py-1 text-xs sm:text-sm font-semibold text-sand">{carbonImpact.items.length} reporting</span>
              </div>
              <div className="mt-5 space-y-3">
                {carbonImpact.items.length ? carbonImpact.items.slice(0, 4).map((project) => {
                  const share = carbonImpact.total ? Math.max(4, (project.carbonAmount / carbonImpact.total) * 100) : 0;
                  return (
                    <div key={project.id} className="group rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 transition-all duration-200 hover:border-sand/30 hover:bg-white/[0.12]">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-seagrass/30 bg-seagrass/25 text-emerald-300 transition-transform group-hover:scale-105"><Leaf size={17} /></span>
                        <p className="min-w-0 flex-1 truncate text-sm sm:text-base font-semibold text-white">{project.name}</p>
                        <p className="shrink-0 text-sm sm:text-base font-bold text-sand">{carbonLabel(project.carbonAmount)} <span className="text-xs sm:text-sm font-medium text-slate-300">tCO₂e</span></p>
                      </div>
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-seagrass via-emerald-400 to-sand" style={{ width: `${Math.min(share, 100)}%` }} />
                      </div>
                    </div>
                  );
                }) : <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-6 text-center text-sm sm:text-base text-slate-300">Carbon estimates will appear when project impact data is available.</div>}
              </div>
            </div>
            <p className="mt-5 text-xs sm:text-sm text-slate-300/80">The total animates from 0 for an administrator on login. Connect verified satellite or backend data for an external live feed.</p>
          </div>
        )}
      </div>
    </section>

    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Project status summary">
      <Summary icon={<FolderKanban size={20} />} label="Total projects" value={summary.total} />
      <Summary icon={<FileWarning size={20} />} label="Draft" value={summary.draft} tone="sand" />
      <Summary icon={<ClipboardCheck size={20} />} label="Under verification" value={summary.verification} tone="teal" />
      <Summary icon={<CheckCircle2 size={20} />} label="Approved" value={summary.approved} tone="success" />
      <Summary icon={<FileWarning size={20} />} label="Rejected" value={summary.rejected} tone="coral" />
    </section>

    <div className="mt-6 grid gap-6 xl:grid-cols-3">
      <section className="rounded-2xl border border-sand bg-sand/45 p-6 xl:col-span-1">
        <div className="flex items-center gap-2 text-brand-teal"><CalendarDays size={20} /><p className="text-sm sm:text-base font-bold tracking-wide">NEXT MILESTONE</p></div>
        {nextMilestone ? <><h2 className="dashboard-card-title mt-4 text-lg sm:text-xl font-bold text-deep-navy">{nextMilestone.status === "Draft" ? "Complete your draft" : "Respond to verification"}</h2><p className="mt-1 text-sm sm:text-base text-slate-600">{nextMilestone.name} needs your attention to keep the verification moving.</p><Link to={`/projects/${nextMilestone.id}`} className="mt-5 inline-flex items-center gap-1.5 text-sm sm:text-base font-semibold text-brand-teal hover:text-deep-navy">Open project <ArrowRight size={16} /></Link></> : <><h2 className="dashboard-card-title mt-4 text-lg sm:text-xl font-bold text-deep-navy">No immediate action</h2><p className="mt-1 text-sm sm:text-base text-slate-600">Your projects have no outstanding organization tasks.</p></>}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
        <div className="flex items-center gap-2.5"><Award size={21} className="text-coral" /><div><h2 className="dashboard-card-title text-lg sm:text-xl font-bold text-slate-900">BlueGuard milestones</h2><p className="mt-1 text-sm sm:text-base text-slate-600">Progress markers for your restoration verification journey.</p></div></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">{achievements.map((achievement) => <div key={achievement.label} className={`rounded-xl border p-4 ${achievement.complete ? "border-seagrass/30 bg-seagrass/10" : "border-slate-200 bg-slate-50"}`}><CheckCircle2 size={20} className={achievement.complete ? "text-seagrass" : "text-slate-300"} /><p className={`mt-3 text-sm sm:text-base font-semibold ${achievement.complete ? "text-deep-navy" : "text-slate-500"}`}>{achievement.label}</p><p className="mt-1 text-xs sm:text-sm text-slate-500">{achievement.complete ? "Achieved" : "In progress"}</p></div>)}</div>
      </section>
    </div>

    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2.5"><ShieldCheck size={21} className="text-brand-teal" /><div><h2 className="dashboard-card-title text-lg sm:text-xl font-bold text-slate-900">Verification overview</h2><p className="mt-1 text-sm sm:text-base text-slate-600">Follow projects through the BlueGuard verification lifecycle.</p></div></div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">{lifecycle.map(([label, value], index) => <div key={label} className="relative rounded-xl bg-slate-50 p-4">{index < 3 && <ArrowRight size={17} className="absolute -right-5 top-1/2 hidden -translate-y-1/2 text-slate-300 md:block" />}<p className="text-2xl sm:text-3xl font-bold text-deep-navy">{value}</p><p className="mt-1 text-sm sm:text-base font-semibold text-slate-600">{label}</p></div>)}</div>
      <Link to="/verification" className="mt-5 inline-flex items-center gap-1.5 text-sm sm:text-base font-semibold text-brand-teal hover:text-deep-navy">Open verification status <ArrowRight size={16} /></Link>
    </section>

    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="dashboard-card-title text-lg sm:text-xl font-bold text-slate-900">Recent activity</h2><p className="mt-1 text-sm sm:text-base text-slate-600">Meaningful updates across your organization.</p><div className="mt-5 space-y-3">{activity.length ? activity.map((item, index) => <div key={`${item.title}-${index}`} className="flex gap-3 rounded-xl bg-slate-50 p-4"><span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-seagrass" /><div className="min-w-0 flex-1"><p className="truncate text-sm sm:text-base font-semibold text-slate-800">{item.title}</p><p className="mt-0.5 text-xs sm:text-sm text-slate-500">{item.detail}</p></div><time className="shrink-0 text-xs sm:text-sm text-slate-400">{shortDate(item.date)}</time></div>) : <Empty text="Activity will appear when you submit a project, upload evidence, or receive a verification update." />}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-4"><div><h2 className="dashboard-card-title text-lg sm:text-xl font-bold text-slate-900">Projects needing attention</h2><p className="mt-1 text-sm sm:text-base text-slate-600">Drafts and verification requests that need your action.</p></div><FileWarning size={22} className="text-coral" /></div><div className="mt-5 space-y-3">{attention.length ? attention.map((project) => <Link key={project.id} to={`/projects/${project.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-sand bg-sand/30 p-4 transition hover:border-coral"><div className="min-w-0"><p className="truncate text-sm sm:text-base font-semibold text-slate-800">{project.name}</p><p className="mt-0.5 text-xs sm:text-sm text-slate-600">{project.status === "Draft" ? "Complete and submit this draft" : "Review the requested verification information"}</p></div><ArrowRight size={18} className="shrink-0 text-brand-teal" /></Link>) : <Empty text="No projects require action right now." />}</div></section>
    </div>

    <section className="mt-6"><h2 className="dashboard-card-title text-lg sm:text-xl font-bold text-slate-900">Quick actions</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><QuickAction to="/projects?new=true" icon={<Plus size={22} />} title="Submit new project" description="Start a restoration project submission" /><QuickAction to="/projects" icon={<FolderKanban size={22} />} title="View all projects" description="Manage your project records" /><QuickAction to="/verification" icon={<ClipboardCheck size={22} />} title="Verification status" description="Review verification outcomes" /><QuickAction to="/monitoring" icon={<Satellite size={22} />} title="View monitoring" description="Open satellite monitoring updates" />{isAdmin && <QuickAction to="/admin" icon={<ShieldCheck size={22} />} title="Admin control center" description="Review evidence and verification decisions" />}</div></section>
  </div>;
}

function Summary({ icon, label, value, tone = "default" }) {
  const tones = { default: "bg-slate-100 text-deep-navy", sand: "bg-sand text-deep-navy", teal: "bg-brand-teal/10 text-brand-teal", success: "bg-seagrass/15 text-seagrass", coral: "bg-coral/15 text-coral" };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm sm:text-base font-semibold text-slate-600">{label}</p><p className="mt-2 text-3xl sm:text-4xl font-bold text-deep-navy">{value}</p></div><span className={`rounded-xl p-3 ${tones[tone]}`}>{icon}</span></div></div>;
}

function QuickAction({ to, icon, title, description }) {
  return <Link to={to} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-teal hover:shadow-md"><div className="flex items-start gap-3"><span className="rounded-xl bg-sand p-3 text-brand-teal">{icon}</span><div><p className="text-base sm:text-lg font-bold text-slate-800">{title}</p><p className="mt-1 text-sm sm:text-base text-slate-500">{description}</p></div></div></Link>;
}

function Empty({ text }) { return <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm sm:text-base text-slate-600">{text}</div>; }

function EquivalentCard({ icon, label, value, hint, iconTheme = "seagrass" }) {
  const iconThemes = {
    seagrass: "border-seagrass/40 bg-seagrass/30 text-emerald-300",
    sand: "border-sand/30 bg-sand/20 text-sand",
    mint: "border-emerald-400/30 bg-emerald-500/20 text-emerald-300",
  };

  return (
    <div className="group rounded-2xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur-sm transition-all duration-200 hover:border-sand/40 hover:bg-white/[0.12] shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${iconThemes[iconTheme] || iconThemes.seagrass} transition-transform group-hover:scale-105`}>
          {icon}
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-sand">{label}</p>
        </div>
      </div>
      <p className="dashboard-display mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-normal">{hint}</p>
    </div>
  );
}

function CarbonSparkline({ history }) {
  const points = history.slice(-12).map((entry) => entry.total);
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const width = 148;
  const height = 36;
  const coords = points.map((value, index) => {
    const x = (index / (points.length - 1)) * width;
    const y = height - ((value - min) / span) * (height - 8) - 4;
    return { x, y };
  });
  const path = coords.map((pt, index) => `${index === 0 ? "M" : "L"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ");
  const lastPt = coords[coords.length - 1];

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sand backdrop-blur" title="Recent carbon total trend">
      <span className="text-[11px] font-medium text-slate-300">Trend</span>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-6 w-20" aria-hidden="true">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastPt.x} cy={lastPt.y} r="3" fill="#6ee7b7" />
      </svg>
    </span>
  );
}
