import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import greenWater from "../assets/greenWater.jpg";
import {
  Activity,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Compass,
  FileCheck2,
  FileText,
  Fingerprint,
  Filter,
  FolderKanban,
  FolderOpen,
  Globe,
  Grid,
  Info,
  Layers,
  Leaf,
  List,
  Lock,
  MapPin,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
  Satellite,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Trash2,
  TrendingUp,
  UploadCloud,
  Waves,
  X,
} from "lucide-react";
import { projects as seedProjects } from "../data/mockData";
import { getCurrentUser } from "../services/authService";

const STORAGE_KEY = "blueguard_projects";

function loadProjects() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return seedProjects || [];
    const map = new Map([...(seedProjects || []), ...saved].map((p) => [p.id, p]));
    return [...map.values()];
  } catch {
    return seedProjects || [];
  }
}

function saveProjects(projectsList) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projectsList));
}

function loadEvidence(projectId) {
  try {
    const saved = JSON.parse(localStorage.getItem("blueguard_evidence") || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter((e) => e.projectId === projectId || e.projectName === projectId);
  } catch {
    return [];
  }
}

function formatCarbonValue(val) {
  const num = typeof val === "number" ? val : Number(String(val || "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(num) || num === 0) return "0";
  return num >= 1000 ? `${(num / 1000).toFixed(1)}K` : num.toLocaleString();
}

export default function Projects() {
  const { id: paramId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const detailsRef = useRef(null);

  const [projectsList, setProjectsList] = useState(loadProjects);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ecosystemFilter, setEcosystemFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'mrv' | 'evidence'

  // Selected project ID
  const initialProjectId =
    paramId ||
    searchParams.get("selected") ||
    searchParams.get("project") ||
    projectsList[0]?.id ||
    "BG-001";

  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    if (searchParams.get("new") === "true") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const targetId = paramId || searchParams.get("selected") || searchParams.get("project");
    if (targetId && projectsList.some((p) => p.id === targetId)) {
      setSelectedProjectId(targetId);
    }
  }, [paramId, searchParams, projectsList]);

  const handleRefresh = () => {
    setProjectsList(loadProjects());
  };

  // Currently inspected project
  const selectedProject = useMemo(() => {
    return (
      projectsList.find((p) => p.id === selectedProjectId) ||
      projectsList[0] ||
      seedProjects[0]
    );
  }, [projectsList, selectedProjectId]);

  const evidenceList = useMemo(() => {
    return loadEvidence(selectedProject?.id);
  }, [selectedProject]);

  const isVerified = ["Verified", "Finished", "Approved"].includes(selectedProject?.status);

  // Fallback defaults for rich attributes
  const habitat =
    selectedProject?.ecosystem ||
    selectedProject?.habitat ||
    (selectedProject?.name?.toLowerCase().includes("seagrass")
      ? "Seagrass Meadow"
      : "Mangrove Forest");
  const species =
    selectedProject?.species ||
    (habitat.includes("Seagrass")
      ? "Zostera marina, Halodule uninervis"
      : "Rhizophora mucronata, Avicennia marina, Ceriops decandra");
  const organization = selectedProject?.organization || "Coastal Ecosystems & NGO Alliance";
  const coordinates = selectedProject?.coordinates || [21.9497, 89.1833];
  const baselineBiomass = selectedProject?.baselineBiomass || "48.5 tC/ha";
  const methodology =
    selectedProject?.methodology || "Verra VCS VM0033 (Tidal Wetland Restoration)";

  // Metrics summary
  const summary = useMemo(() => {
    const total = projectsList.length;
    const verified = projectsList.filter((p) =>
      ["Verified", "Finished", "Approved"].includes(p.status)
    ).length;
    const inProgress = projectsList.filter((p) =>
      ["In Progress", "Under Review", "Active", "Monitoring"].includes(p.status)
    ).length;
    const totalHectares = projectsList.reduce((acc, p) => {
      const h = Number(String(p.area || "").replace(/[^0-9.]/g, "")) || 0;
      return acc + h;
    }, 0);
    const totalCarbon = projectsList.reduce((acc, p) => {
      const c = Number(String(p.carbon || "").replace(/[^0-9.]/g, "")) || 0;
      return acc + c;
    }, 0);

    return {
      total,
      verified,
      inProgress,
      totalHectares: totalHectares.toLocaleString(),
      totalCarbon: formatCarbonValue(totalCarbon),
    };
  }, [projectsList]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projectsList.filter((project) => {
      const matchesSearch =
        project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.location?.toLowerCase().includes(searchQuery.toLowerCase());

      const normalizedStatus = project.status || "In Progress";
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Verified" &&
          ["Verified", "Finished", "Approved"].includes(normalizedStatus)) ||
        (statusFilter === "In Progress" &&
          ["In Progress", "Active", "Under Review", "Monitoring"].includes(normalizedStatus)) ||
        (statusFilter === "Draft" && ["Draft", "Pending"].includes(normalizedStatus));

      const matchesEcosystem =
        ecosystemFilter === "All" ||
        (ecosystemFilter === "Mangrove" &&
          (project.name?.toLowerCase().includes("mangrove") ||
            project.ecosystem === "Mangrove" ||
            project.projectType?.includes("Mangrove"))) ||
        (ecosystemFilter === "Seagrass" &&
          (project.name?.toLowerCase().includes("seagrass") ||
            project.ecosystem === "Seagrass" ||
            project.projectType?.includes("Seagrass"))) ||
        (ecosystemFilter === "Wetland" &&
          (project.name?.toLowerCase().includes("wetland") ||
            project.name?.toLowerCase().includes("tidal") ||
            project.ecosystem === "Wetland"));

      return matchesSearch && matchesStatus && matchesEcosystem;
    });
  }, [projectsList, searchQuery, statusFilter, ecosystemFilter]);

  const handleSelectProject = (id) => {
    setSelectedProjectId(id);
    detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCreateProject = (newProject) => {
    const updated = [newProject, ...projectsList];
    setProjectsList(updated);
    saveProjects(updated);
    setSelectedProjectId(newProject.id);
    setIsCreateModalOpen(false);
    setSearchParams({});
    detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-8 space-y-8">
      {/* =========================================================
          HERO REGISTRY BANNER
          ========================================================= */}
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-deep-navy via-brand-teal to-seagrass p-6 shadow-xl lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sand/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-seagrass/30 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-sand/30 bg-sand/15 px-3.5 py-1.5 text-xs sm:text-sm font-bold tracking-wider text-sand backdrop-blur-md">
              <Sprout size={16} className="text-emerald-300" />
              <span>COASTAL RESTORATION REGISTRY & EXPLORATION HUB</span>
            </div>

            <h1 className="dashboard-display mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Blue Carbon Projects
            </h1>

            <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-slate-200">
              Manage, explore, and inspect verified mangrove, seagrass, and tidal wetland restoration sites with integrated remote sensing and tamper-proof MRV records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20 backdrop-blur"
              aria-label="Refresh project list"
            >
              <RefreshCw size={16} />
              Sync
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-sand px-5 py-2.5 text-sm font-bold text-deep-navy shadow-md transition hover:bg-white active:scale-95"
            >
              <Plus size={18} className="text-brand-teal" />
              Register New Project
            </button>
          </div>
        </div>

        {/* Top Registry KPIs */}
        <div className="relative mt-8 grid grid-cols-2 gap-3 border-t border-white/15 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-sand">Total Projects</p>
            <p className="dashboard-display mt-1 text-2xl sm:text-3xl font-bold text-white">
              {summary.total} <span className="text-base font-medium text-sand">sites</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-300">Under registry management</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-sand">Restored Area</p>
            <p className="dashboard-display mt-1 text-2xl sm:text-3xl font-bold text-emerald-300">
              {summary.totalHectares} <span className="text-base font-medium text-sand">ha</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-300">Total coastal hectares</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-sand">Carbon Potential</p>
            <p className="dashboard-display mt-1 text-2xl sm:text-3xl font-bold text-white">
              {summary.totalCarbon} <span className="text-base font-medium text-sand">tCO₂e</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-300">Estimated lifetime sequestration</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-sand">Verified & Certified</p>
            <p className="dashboard-display mt-1 text-2xl sm:text-3xl font-bold text-emerald-300">
              {summary.verified} <span className="text-base font-medium text-sand">completed</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-300">{summary.inProgress} active monitoring</p>
          </div>
        </div>
      </header>

      {/* =========================================================
          SELECTED PROJECT DOSSIER & EXPLORE DETAILS (ALL-IN-ONE)
          ========================================================= */}
      <section ref={detailsRef} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-teal text-white">
              <FolderOpen size={16} />
            </span>
            <h2 className="dashboard-card-title text-xl sm:text-2xl font-bold text-slate-900">
              Project Dossier & Inspection
            </h2>
          </div>

          <span className="text-xs sm:text-sm font-semibold text-slate-500">
            Selected: <strong className="text-brand-teal font-bold">{selectedProject?.name}</strong> ({selectedProject?.id})
          </span>
        </div>

        {/* DETAIL HERO BANNER */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-xl">
          <img
            src={greenWater}
            alt="Coastal project imagery"
            className="absolute inset-0 h-full w-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deep-navy/95 via-brand-teal/85 to-seagrass/75 backdrop-blur-[1.5px]" />

          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sand/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-seagrass/30 blur-3xl" />

          <div className="relative z-10 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-sand/40 bg-sand/20 px-3.5 py-1 text-xs font-black tracking-wider text-sand backdrop-blur-md">
                    {selectedProject?.id}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold backdrop-blur-md ${
                      isVerified
                        ? "bg-emerald-500/25 text-emerald-200 border border-emerald-400/40"
                        : "bg-sand/25 text-sand border border-sand/40"
                    }`}
                  >
                    {isVerified ? (
                      <CheckCircle2 size={14} className="text-emerald-300" />
                    ) : (
                      <Clock size={14} />
                    )}
                    <span>{selectedProject?.status || "In Progress"}</span>
                  </span>

                  <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-slate-200">
                    {habitat}
                  </span>
                </div>

                <h3 className="dashboard-display mt-3 text-3xl sm:text-4xl font-black tracking-tight text-white">
                  {selectedProject?.name}
                </h3>

                <p className="mt-2.5 flex items-center gap-2 text-sm sm:text-base font-semibold text-slate-200">
                  <MapPin size={18} className="text-emerald-300 shrink-0" />
                  <span>{selectedProject?.location}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-xs text-sand">
                    GPS: {coordinates.join(", ")}
                  </span>
                </p>

                <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-100 max-w-2xl">
                  {selectedProject?.description ||
                    "Blue carbon restoration project tracking vegetative growth, biomass density, and remote sensing telemetry."}
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 min-w-[280px]">
                <Link
                  to={`/evidence?project=${selectedProject?.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-teal px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-deep-navy active:scale-95 border border-white/20"
                >
                  <UploadCloud size={18} />
                  <span>Submit Field Evidence</span>
                </Link>

                <Link
                  to={`/monitoring?project=${selectedProject?.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-white/25 backdrop-blur-md"
                >
                  <Satellite size={18} />
                  <span>View Telemetry</span>
                </Link>
              </div>
            </div>

            {/* Key Vitals Ribbon */}
            <div className="relative mt-8 grid grid-cols-2 gap-3 border-t border-white/15 pt-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand">
                  Restoration Area
                </p>
                <p className="dashboard-display mt-1 text-2xl sm:text-3xl font-black text-white">
                  {selectedProject?.area}
                </p>
                <p className="mt-0.5 text-xs text-slate-200">Registered coastal boundary</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand">
                  Estimated Carbon Yield
                </p>
                <p className="dashboard-display mt-1 text-2xl sm:text-3xl font-black text-emerald-300">
                  {selectedProject?.carbon}
                </p>
                <p className="mt-0.5 text-xs text-slate-200">Estimated lifetime sequestration</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand">
                  Growth Progress
                </p>
                <p className="dashboard-display mt-1 text-2xl sm:text-3xl font-black text-white">
                  {selectedProject?.progress || 65}%
                </p>
                <p className="mt-0.5 text-xs text-slate-200">Canopy reflectance index verified</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand">
                  Evidence Submissions
                </p>
                <p className="dashboard-display mt-1 text-2xl sm:text-3xl font-black text-white">
                  {evidenceList.length} <span className="text-sm font-medium text-sand">records</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-200">Attached to MRV registry</p>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS FOR SELECTED PROJECT */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          {[
            { id: "overview", label: "Project Overview & Specs", icon: <FolderOpen size={16} /> },
            { id: "mrv", label: "MRV Verification Pipeline", icon: <ShieldCheck size={16} /> },
            { id: "evidence", label: `Field Evidence (${evidenceList.length})`, icon: <FileText size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-bold transition ${
                activeTab === tab.id
                  ? "bg-brand-teal text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & SPECS */}
        {activeTab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left 2 Cols: Site Specs & Ecology */}
            <div className="space-y-6 lg:col-span-2">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-4">
                  <Sprout size={22} className="text-brand-teal" />
                  <h3 className="dashboard-card-title text-xl font-bold text-slate-900">
                    Ecological & Geospatial Baseline
                  </h3>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Primary Habitat</p>
                    <p className="mt-1 text-base font-bold text-slate-900">{habitat}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Restoration Proponent</p>
                    <p className="mt-1 text-base font-bold text-slate-900 truncate">{organization}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Baseline Carbon Stock</p>
                    <p className="mt-1 text-base font-bold text-brand-teal">{baselineBiomass}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">MRV Methodology Standard</p>
                    <p className="mt-1 text-base font-bold text-slate-900 truncate">{methodology}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Target Species</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{species}</p>
                </div>
              </section>

              {/* Growth & Health Meter */}
              <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Activity size={22} className="text-seagrass" />
                    <h3 className="dashboard-card-title text-xl font-bold text-slate-900">
                      Restoration Growth Phase & Telemetry
                    </h3>
                  </div>
                  <span className="rounded-full bg-seagrass/15 px-3 py-1 text-xs font-bold text-emerald-800">
                    {selectedProject?.progress || 65}% Completed
                  </span>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
                    <span>Planting & Nursery Survival</span>
                    <span className="text-brand-teal font-extrabold">{selectedProject?.progress || 65}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-teal via-seagrass to-emerald-400 rounded-full transition-all duration-700"
                      style={{ width: `${selectedProject?.progress || 65}%` }}
                    />
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-slate-400 font-medium">
                    <span>Site Baseline (0%)</span>
                    <span>Canopy Closure Target (100%)</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Location Bounds & Blockchain */}
            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
                  <Compass size={20} className="text-brand-teal" />
                  <h3 className="dashboard-card-title text-lg font-bold text-slate-900">
                    Geospatial Bounds
                  </h3>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs sm:text-sm">
                    <span className="font-semibold text-slate-500">Latitude</span>
                    <span className="font-mono font-bold text-slate-900">{coordinates[0]}° N</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs sm:text-sm">
                    <span className="font-semibold text-slate-500">Longitude</span>
                    <span className="font-mono font-bold text-slate-900">{coordinates[1]}° E</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs sm:text-sm">
                    <span className="font-semibold text-slate-500">Satellite Pass Interval</span>
                    <span className="font-bold text-brand-teal">Every 5 days</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs sm:text-sm">
                    <span className="font-semibold text-slate-500">Constellation</span>
                    <span className="font-bold text-slate-900">Sentinel-2 MSI / PlanetScope</span>
                  </div>
                </div>

                <Link
                  to={`/monitoring?project=${selectedProject?.id}`}
                  className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 text-xs sm:text-sm font-bold text-deep-navy transition hover:bg-brand-teal hover:text-white"
                >
                  <Satellite size={16} />
                  <span>Open Satellite Telemetry Map</span>
                </Link>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
                  <Fingerprint size={20} className="text-seagrass" />
                  <h3 className="dashboard-card-title text-lg font-bold text-slate-900">
                    On-Chain Registry Anchor
                  </h3>
                </div>

                <div className="mt-4 space-y-3 text-xs sm:text-sm">
                  <div>
                    <p className="font-semibold text-slate-500">Network Anchor</p>
                    <p className="font-bold text-deep-navy">Polygon PoS (Smart Contract MRV)</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500">Immutable Contract</p>
                    <p className="font-mono text-xs text-brand-teal truncate">
                      0x742d35Cc6634C0532925a3b844Bc454e4438f44e
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500">State Hash</p>
                    <p className="font-mono text-xs text-slate-600 truncate">
                      sha256:8f2a93c41b8027ef993214a7e930129
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* TAB 2: MRV PIPELINE */}
        {activeTab === "mrv" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-slate-900">
                <ShieldCheck size={24} className="text-brand-teal" />
                <h3 className="dashboard-card-title text-xl font-bold text-slate-900">
                  4-Stage MRV Verification Lifecycle
                </h3>
              </div>
              <Link
                to="/verification"
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-brand-teal hover:underline"
              >
                Open Full Verification Hub <ArrowRight size={14} />
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                    Stage 1
                  </span>
                  <CheckCircle2 size={18} className="text-emerald-600" />
                </div>
                <h4 className="mt-3 font-bold text-slate-900 text-base">Project Registration</h4>
                <p className="mt-1 text-xs text-slate-600">Site boundary, GPS coordinates and baseline biomass verified.</p>
                <p className="mt-3 font-mono text-xs text-emerald-800 font-bold">Passed & Approved</p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                    Stage 2
                  </span>
                  <CheckCircle2 size={18} className="text-emerald-600" />
                </div>
                <h4 className="mt-3 font-bold text-slate-900 text-base">Field Evidence</h4>
                <p className="mt-1 text-xs text-slate-600">Geotagged photos, drone flights and soil lab tests attached.</p>
                <p className="mt-3 font-mono text-xs text-emerald-800 font-bold">{evidenceList.length} Files Ingested</p>
              </div>

              <div className="rounded-2xl border border-brand-teal/30 bg-brand-teal/[0.05] p-5">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-brand-teal px-2 py-0.5 text-xs font-bold text-white">
                    Stage 3
                  </span>
                  <Activity size={18} className="text-brand-teal animate-pulse" />
                </div>
                <h4 className="mt-3 font-bold text-slate-900 text-base">Satellite AI Cross-Check</h4>
                <p className="mt-1 text-xs text-slate-600">Sentinel-2 NDVI reflectance and canopy closure model match.</p>
                <p className="mt-3 font-mono text-xs text-brand-teal font-bold">94.2% AI Confidence</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-slate-300 px-2 py-0.5 text-xs font-bold text-slate-700">
                    Stage 4
                  </span>
                  <Lock size={18} className="text-slate-400" />
                </div>
                <h4 className="mt-3 font-bold text-slate-900 text-base">On-Chain Issuance</h4>
                <p className="mt-1 text-xs text-slate-600">Smart contract mints verified blue carbon certificates.</p>
                <p className="mt-3 font-mono text-xs text-slate-500 font-bold">Ready for Signoff</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EVIDENCE LIST */}
        {activeTab === "evidence" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="dashboard-card-title text-xl font-bold text-slate-900">
                  Submitted Field Evidence ({evidenceList.length})
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Geotagged surveys, drone imagery and soil test logs submitted for {selectedProject?.name}.
                </p>
              </div>

              <Link
                to={`/evidence?project=${selectedProject?.id}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-teal px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-deep-navy"
              >
                <Plus size={16} />
                <span>Upload New Evidence</span>
              </Link>
            </div>

            <div className="mt-6">
              {evidenceList.length > 0 ? (
                <div className="space-y-3">
                  {evidenceList.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sand text-deep-navy">
                          <FileCheck2 size={20} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-brand-teal">
                              {item.id || `EV-${idx + 1}`}
                            </span>
                            <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">
                              {item.evidenceType || "Field Survey"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-slate-800 line-clamp-1">
                            {item.description || "Field evidence attached for cross-validation"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {item.files?.length || 1} files attached • Geotagged at {selectedProject?.location}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-seagrass/15 border border-seagrass/30 px-3 py-1 text-xs font-bold text-emerald-800 self-start sm:self-auto">
                        {item.status || "Verified"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                  <UploadCloud size={36} className="mx-auto text-slate-400" />
                  <p className="mt-3 text-base font-bold text-slate-800">No field evidence uploaded yet</p>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    Upload drone scans, geotagged photos or sediment core lab reports to initiate MRV cross-validation.
                  </p>
                  <Link
                    to={`/evidence?project=${selectedProject?.id}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-teal px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-deep-navy"
                  >
                    <Plus size={16} />
                    <span>Submit Evidence Now</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* =========================================================
          ALL PROJECTS REGISTRY CATALOG (INTERACTIVE SWITCHER)
          ========================================================= */}
      <section className="space-y-6 pt-4 border-t border-slate-200">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h3 className="dashboard-card-title text-xl font-bold text-slate-900">
              All Restoration Projects Registry
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Click any project card below to instantly inspect its full dossier above.
            </p>
          </div>

          {/* Controls: Search, Filters & View Mode */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-teal focus:outline-none shadow-sm"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              {["All", "In Progress", "Verified", "Draft"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                    statusFilter === status
                      ? "bg-brand-teal text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Ecosystem dropdown */}
            <select
              value={ecosystemFilter}
              onChange={(e) => setEcosystemFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 outline-none hover:border-slate-300 focus:border-brand-teal shadow-sm"
            >
              <option value="All">All Ecosystems</option>
              <option value="Mangrove">Mangrove</option>
              <option value="Seagrass">Seagrass</option>
              <option value="Wetland">Wetland</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                aria-label="Grid View"
                className={`rounded-xl p-1.5 transition ${
                  viewMode === "grid"
                    ? "bg-brand-teal text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                aria-label="Table View"
                className={`rounded-xl p-1.5 transition ${
                  viewMode === "table"
                    ? "bg-brand-teal text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* PROJECTS GRID / TABLE */}
        {filteredProjects.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => {
                const isCurrent = project.id === selectedProjectId;
                const isProjVerified = ["Verified", "Finished", "Approved"].includes(project.status);

                return (
                  <div
                    key={project.id}
                    onClick={() => handleSelectProject(project.id)}
                    className={`group cursor-pointer flex flex-col justify-between rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                      isCurrent
                        ? "border-brand-teal bg-white ring-2 ring-brand-teal/20 shadow-md"
                        : "border-slate-200 bg-white hover:border-brand-teal/40"
                    }`}
                  >
                    <div>
                      {/* Badges */}
                      <div className="flex items-center justify-between">
                        <span className="rounded-xl bg-sand/40 border border-sand px-3 py-1 text-xs font-bold text-deep-navy">
                          {project.id}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                            isProjVerified
                              ? "bg-seagrass/15 text-emerald-800 border border-seagrass/30"
                              : "bg-sand text-deep-navy border border-sand"
                          }`}
                        >
                          {isProjVerified ? (
                            <CheckCircle2 size={13} className="text-seagrass" />
                          ) : (
                            <Clock size={13} />
                          )}
                          {project.status || "In Progress"}
                        </span>
                      </div>

                      {/* Title & Location */}
                      <h4 className="dashboard-card-title mt-4 text-lg font-bold text-slate-900 group-hover:text-brand-teal transition truncate">
                        {project.name}
                      </h4>
                      <p className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
                        <MapPin size={15} className="text-slate-400 shrink-0" />
                        <span className="truncate">{project.location}</span>
                      </p>

                      <p className="mt-3 line-clamp-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {project.description ||
                          "Active blue carbon restoration project tracking vegetative growth and biomass density."}
                      </p>

                      {/* Restoration Specs */}
                      <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Restoration Area
                          </p>
                          <p className="text-sm sm:text-base font-extrabold text-slate-900">
                            {project.area}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Carbon Yield
                          </p>
                          <p className="text-sm sm:text-base font-extrabold text-brand-teal">
                            {project.carbon}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
                          <span>Restoration Phase</span>
                          <span className="text-brand-teal">{project.progress || 60}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-teal to-seagrass rounded-full transition-all duration-500"
                            style={{ width: `${project.progress || 60}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer Select Trigger */}
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs font-bold text-slate-500">
                        {isCurrent ? "Currently Inspecting" : "Click to Inspect"}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProject(project.id);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold shadow-sm transition active:scale-95 ${
                          isCurrent
                            ? "bg-brand-teal text-white"
                            : "bg-slate-100 text-deep-navy hover:bg-brand-teal hover:text-white"
                        }`}
                      >
                        <span>{isCurrent ? "Inspecting Dossier" : "Explore Details"}</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <tr>
                      <th className="px-6 py-4">Project ID & Name</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Area (ha)</th>
                      <th className="px-6 py-4">Est. Carbon</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Progress</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredProjects.map((project) => {
                      const isCurrent = project.id === selectedProjectId;

                      return (
                        <tr
                          key={project.id}
                          onClick={() => handleSelectProject(project.id)}
                          className={`cursor-pointer transition ${
                            isCurrent ? "bg-brand-teal/[0.06]" : "hover:bg-slate-50/80"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <span className="rounded-md bg-sand/50 px-2 py-0.5 text-xs font-bold text-deep-navy">
                                {project.id}
                              </span>
                              <span className="font-bold text-slate-900 truncate max-w-[200px]">
                                {project.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{project.location}</td>
                          <td className="px-6 py-4 font-semibold text-slate-800">{project.area}</td>
                          <td className="px-6 py-4 font-bold text-brand-teal">{project.carbon}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold ${
                                ["Verified", "Finished", "Approved"].includes(project.status)
                                  ? "bg-seagrass/15 text-emerald-800"
                                  : "bg-sand text-deep-navy"
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {project.status || "In Progress"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-20 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full bg-brand-teal rounded-full"
                                  style={{ width: `${project.progress || 60}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500 font-bold">
                                {project.progress || 60}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectProject(project.id);
                              }}
                              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-brand-teal hover:underline"
                            >
                              {isCurrent ? "Inspecting" : "Explore Details"} <ChevronRight size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <FolderKanban size={36} className="mx-auto text-slate-400" />
            <h3 className="mt-3 text-lg font-bold text-slate-800">No matching projects found</h3>
            <p className="mt-1 text-sm text-slate-600">Try adjusting your keyword search or filter pills.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("All");
                setEcosystemFilter("All");
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* =========================================================
          PERFECT 4-STEP REGISTRATION MODAL WIZARD
          ========================================================= */}
      {isCreateModalOpen && (
        <CreateProjectModalWizard
          onClose={() => {
            setIsCreateModalOpen(false);
            setSearchParams({});
          }}
          onCreate={handleCreateProject}
          nextId={`BG-${String(projectsList.length + 1).padStart(3, "0")}`}
        />
      )}
    </div>
  );
}

/* =========================================================
   PERFECT 4-STEP REGISTRATION MODAL WIZARD
   ========================================================= */

function CreateProjectModalWizard({ onClose, onCreate, nextId }) {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    id: nextId,
    name: "",
    projectType: "Mangrove Restoration",
    organization: "Mangrove NGO & Coastal Alliance",
    location: "",
    description: "",
    latitude: "21.9497",
    longitude: "89.1833",
    area: "125",
    habitat: "Mangrove",
    startDate: new Date().toISOString().split("T")[0],
    monitoringFrequency: "Monthly",
    carbon: "14,500",
    methodology: "Verra VCS VM0033",
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!form.name.trim()) newErrors.name = "Project name is required";
      if (!form.location.trim()) newErrors.location = "Project location is required";
      if (!form.description.trim()) newErrors.description = "Project description is required";
    }
    if (currentStep === 2) {
      if (!form.latitude) newErrors.latitude = "Latitude is required";
      if (!form.longitude) newErrors.longitude = "Longitude is required";
      if (!form.area || Number(form.area) <= 0) newErrors.area = "Valid area in hectares is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(4, s + 1));
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const handleFinish = (finalStatus = "Under Review") => {
    const lat = Number(form.latitude) || 21.9497;
    const lng = Number(form.longitude) || 89.1833;
    const areaFormatted = form.area.includes("ha") ? form.area : `${form.area || "100"} ha`;
    const carbonFormatted = form.carbon.includes("tCO")
      ? form.carbon
      : `${form.carbon || "12,000"} tCO₂e/yr`;

    const newProjectRecord = {
      id: form.id || nextId,
      name: form.name.trim(),
      projectType: form.projectType,
      ecosystem: form.habitat || "Mangrove",
      organization: form.organization.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      coordinates: [lat, lng],
      area: areaFormatted,
      carbon: carbonFormatted,
      startDate: form.startDate,
      monitoringFrequency: form.monitoringFrequency,
      methodology: form.methodology,
      status: finalStatus,
      progress: 20,
      createdAt: new Date().toISOString(),
    };

    onCreate(newProjectRecord);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-sand/60 px-2 py-0.5 text-xs font-bold text-deep-navy">
                {nextId}
              </span>
              <span className="text-xs font-bold text-brand-teal uppercase tracking-wider">
                Step {step} of 4
              </span>
            </div>
            <h3 className="dashboard-card-title mt-1 text-xl font-bold text-slate-900">
              {step === 1 && "Project Identity & Proponent"}
              {step === 2 && "Geospatial Boundary & Area"}
              {step === 3 && "Monitoring & Carbon Estimate"}
              {step === 4 && "Review & Submit Registration"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="h-1.5 w-full bg-slate-100">
          <div
            className="h-full bg-brand-teal transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* MODAL BODY */}
        <div className="overflow-y-auto px-6 py-6 sm:px-8 space-y-5">
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Mumbai Mangrove Coastal Revival"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none transition ${
                    errors.name
                      ? "border-coral bg-coral/5"
                      : "border-slate-200 bg-slate-50 focus:border-brand-teal focus:bg-white"
                  }`}
                />
                {errors.name && <p className="mt-1 text-xs font-bold text-coral">{errors.name}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Ecosystem Type *
                  </label>
                  <select
                    value={form.projectType}
                    onChange={(e) => {
                      updateField("projectType", e.target.value);
                      updateField(
                        "habitat",
                        e.target.value.includes("Seagrass") ? "Seagrass" : "Mangrove"
                      );
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-brand-teal focus:bg-white focus:outline-none"
                  >
                    <option>Mangrove Restoration</option>
                    <option>Seagrass Restoration</option>
                    <option>Coastal Wetland Restoration</option>
                    <option>Salt Marsh Restoration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Responsible Proponent / NGO
                  </label>
                  <input
                    type="text"
                    value={form.organization}
                    onChange={(e) => updateField("organization", e.target.value)}
                    placeholder="e.g. Mangrove NGO Alliance"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-brand-teal focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Location (Region, Country) *
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder="e.g. Maharashtra, India"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none transition ${
                    errors.location
                      ? "border-coral bg-coral/5"
                      : "border-slate-200 bg-slate-50 focus:border-brand-teal focus:bg-white"
                  }`}
                />
                {errors.location && (
                  <p className="mt-1 text-xs font-bold text-coral">{errors.location}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Project Description & Objectives *
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe the restoration goals, tidal habitat characteristics, and community involvement..."
                  className={`w-full rounded-2xl border p-4 text-sm font-medium text-slate-900 focus:outline-none transition ${
                    errors.description
                      ? "border-coral bg-coral/5"
                      : "border-slate-200 bg-slate-50 focus:border-brand-teal focus:bg-white"
                  }`}
                />
                {errors.description && (
                  <p className="mt-1 text-xs font-bold text-coral">{errors.description}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: GEOSPATIAL */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-seagrass/30 bg-seagrass/10 p-4">
                <div className="flex items-center gap-2 text-deep-navy font-bold text-sm">
                  <Compass size={18} className="text-seagrass" />
                  <span>Geospatial Foundation for Satellite Passes</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Coordinates define the Sentinel-2 reflectance polygon and automated NDVI cross-validation bounding box.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Latitude (° N) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => updateField("latitude", e.target.value)}
                    placeholder="e.g. 19.0760"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-brand-teal focus:bg-white focus:outline-none"
                  />
                  {errors.latitude && (
                    <p className="mt-1 text-xs font-bold text-coral">{errors.latitude}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Longitude (° E) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => updateField("longitude", e.target.value)}
                    placeholder="e.g. 72.8777"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-brand-teal focus:bg-white focus:outline-none"
                  />
                  {errors.longitude && (
                    <p className="mt-1 text-xs font-bold text-coral">{errors.longitude}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Project Area (Hectares) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={form.area}
                      onChange={(e) => updateField("area", e.target.value)}
                      placeholder="e.g. 125"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm font-semibold text-slate-900 focus:border-brand-teal focus:bg-white focus:outline-none"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ha
                    </span>
                  </div>
                  {errors.area && (
                    <p className="mt-1 text-xs font-bold text-coral">{errors.area}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Primary Habitat Class
                  </label>
                  <select
                    value={form.habitat}
                    onChange={(e) => updateField("habitat", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-brand-teal focus:bg-white focus:outline-none"
                  >
                    <option>Mangrove</option>
                    <option>Seagrass</option>
                    <option>Salt Marsh</option>
                    <option>Coastal Wetland</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: MONITORING & CARBON */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Planting / Project Start Date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => updateField("startDate", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-brand-teal focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Satellite Pass Frequency
                  </label>
                  <select
                    value={form.monitoringFrequency}
                    onChange={(e) => updateField("monitoringFrequency", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-brand-teal focus:bg-white focus:outline-none"
                  >
                    <option>Monthly</option>
                    <option>Bi-weekly (14 Days)</option>
                    <option>Quarterly</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Est. Annual Carbon Sequestration
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.carbon}
                      onChange={(e) => updateField("carbon", e.target.value)}
                      placeholder="e.g. 14,500"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-20 text-sm font-semibold text-slate-900 focus:border-brand-teal focus:bg-white focus:outline-none"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      tCO₂e/yr
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Methodology Standard
                  </label>
                  <select
                    value={form.methodology}
                    onChange={(e) => updateField("methodology", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-brand-teal focus:bg-white focus:outline-none"
                  >
                    <option>Verra VCS VM0033 (Tidal Wetland Restoration)</option>
                    <option>Gold Standard Blue Carbon Methodology</option>
                    <option>Plan Vivo Coastal Ecosystem Standard</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="rounded-md bg-sand px-2 py-0.5 text-xs font-bold text-deep-navy">
                      {form.id}
                    </span>
                    <h4 className="font-bold text-slate-900 text-lg mt-1">
                      {form.name || "Untitled Project"}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {form.location} • {form.organization}
                    </p>
                  </div>
                  <span className="rounded-full bg-sand px-3 py-1 text-xs font-bold text-deep-navy">
                    {form.projectType}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-500 font-semibold">Area:</span>
                    <p className="font-bold text-slate-900">{form.area} ha</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Carbon Potential:</span>
                    <p className="font-bold text-brand-teal">{form.carbon} tCO₂e/yr</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">GPS Coordinates:</span>
                    <p className="font-mono font-bold text-slate-900">
                      {form.latitude}, {form.longitude}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Methodology:</span>
                    <p className="font-bold text-slate-900 truncate">{form.methodology}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 border-t border-slate-200 pt-3 line-clamp-2">
                  {form.description}
                </p>
              </div>

              <div className="rounded-2xl border border-brand-teal/30 bg-brand-teal/10 p-4">
                <div className="flex items-center gap-2 text-deep-navy font-bold text-xs sm:text-sm">
                  <ShieldCheck size={18} className="text-brand-teal" />
                  <span>Ready for On-Chain Registry Ingestion</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Submitting will register this site in BlueGuard's local state and queue it for MRV evidence linking and satellite monitoring.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <ClipboardCheck size={16} className="text-brand-teal" />
            <span>Local prototype database</span>
          </div>

          <div className="flex items-center justify-end gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-teal px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-deep-navy transition"
              >
                <span>Continue</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleFinish("Draft")}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleFinish("Under Review")}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg hover:bg-deep-navy transition active:scale-95"
                >
                  <ShieldCheck size={16} />
                  <span>Submit for Verification</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
