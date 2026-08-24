import { getScopedProjects } from "../services/scopeService";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Fingerprint,
  FolderKanban,
  HelpCircle,
  Layers,
  Leaf,
  Lock,
  MapPin,
  Plus,
  RefreshCw,
  RotateCcw,
  Satellite,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UploadCloud,
  X,
  XCircle,
} from "lucide-react";

import { projects as seedProjects, monitoringData } from "../data/mockData";
import { getCurrentUser } from "../services/authService";

const STORAGE_KEYS = {
  projects: "blueguard_projects",
  evidence: "blueguard_evidence",
  verifications: "blueguard_verifications",
  projectStatuses: "blueguard_project_status",
  auditLogs: "blueguard_audit_log",
};

function readStorageArray(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function readStorageObject(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "{}");
    return typeof data === "object" && data !== null ? data : {};
  } catch {
    return {};
  }
}

function formatCarbon(value) {
  const num = typeof value === "number" ? value : Number(String(value || "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(num) || num === 0) return "0";
  return num >= 1000 ? `${(num / 1000).toFixed(1)}K` : num.toLocaleString();
}

function generateMockCid(projectId) {
  const base = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mX";
  const suffix = projectId.replace(/[^a-zA-Z0-9]/g, "").padEnd(6, "0");
  return `${base}${suffix}`;
}

function generateMockTxHash(projectId) {
  let hash = 0;
  const str = `${projectId}-blueguard-mrv-cert`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `0x${Math.abs(hash).toString(16).padStart(16, "0")}e4b9`;
}

export default function Verification() {
  const [currentUser, setCurrentUser] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [verificationList, setVerificationList] = useState([]);
  const [adminStatuses, setAdminStatuses] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedProjectForAudit, setSelectedProjectForAudit] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const refreshData = () => {
    setCurrentUser(getCurrentUser());
    const storedProjects = readStorageArray(STORAGE_KEYS.projects);
    const combined = [...new Map([...seedProjects, ...storedProjects].map((p) => [p.id, p])).values()];
    setProjectsList(combined);
    setEvidenceList(readStorageArray(STORAGE_KEYS.evidence));
    setVerificationList(readStorageArray(STORAGE_KEYS.verifications));
    setAdminStatuses(readStorageObject(STORAGE_KEYS.projectStatuses));
    setLastRefreshed(new Date());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("storage", refreshData);
    return () => window.removeEventListener("storage", refreshData);
  }, []);

  // Compute rich verification data for each project
  
  // Multi-tenant Organization filter: Organizations only see their own verification statuses
  const scopedProjectsList = useMemo(() => {
    return getScopedProjects(projectsList);
  }, [projectsList, currentUser]);

  const enrichedProjects = useMemo(() => {
    return scopedProjectsList.map((project, index) => {
      const adminData = adminStatuses[project.id] || {};
      const projEvidence = evidenceList.filter((e) => e.projectId === project.id);
      const projVerif = verificationList.find((v) => v.projectId === project.id);

      // Determine verification lifecycle stage and normalized status
      let rawStatus = (adminData.verificationStatus || projVerif?.status || project.status || "Under Review").trim();
      let stage = 2; // Default: Satellite AI Analysis
      let status = "Under Verification";

      if (["Verified", "Approved", "Finished"].includes(rawStatus)) {
        status = "Verified";
        stage = 4;
      } else if (["Rejected", "Failed"].includes(rawStatus)) {
        status = "Rejected";
        stage = 3;
      } else if (["Changes Requested", "Action Required", "Requires Information"].includes(rawStatus)) {
        status = "Changes Requested";
        stage = 3;
      } else if (["Under Human Verification", "Under Review", "Auditor Review"].includes(rawStatus)) {
        status = "Human Review";
        stage = 3;
      } else if (["Under Automated Analysis", "AI Scanning"].includes(rawStatus)) {
        status = "Automated Analysis";
        stage = 2;
      } else if (["Draft", "Pending", "Submitted"].includes(rawStatus)) {
        status = "Pending Review";
        stage = 1;
      }

      const aiConfidence = adminData.aiConfidence || projVerif?.confidence || (index === 0 ? 94 : index === 1 ? 88 : 91);
      const satelliteMatch = adminData.satelliteMatch || (index === 0 ? 98 : index === 1 ? 84 : 92);
      const evidenceScore = adminData.evidenceScore || (index === 0 ? 96 : index === 1 ? 79 : 90);
      const riskLevel = adminData.risk || (index === 0 ? "Low" : index === 1 ? "Medium" : "Low");
      const verifierRemarks = adminData.remarks || projVerif?.reason || (status === "Verified" ? "Verified via multispectral NDVI biomass alignment and geotagged field surveys." : status === "Changes Requested" ? "High tide boundary overlap detected. Please upload high-res low-tide drone imagery." : "Automated satellite analysis in progress with Sentinel-2 L2A tile ingestion.");
      const txHash = adminData.txHash || generateMockTxHash(project.id);
      const ipfsCid = adminData.ipfsCid || generateMockCid(project.id);
      const verifiedAt = adminData.updatedAt || project.updatedAt || project.createdAt || new Date().toISOString();

      return {
        ...project,
        verificationStatus: status,
        currentStage: stage,
        aiConfidence,
        satelliteMatch,
        evidenceScore,
        riskLevel,
        verifierRemarks,
        evidenceCount: Math.max(projEvidence.length, index === 0 ? 4 : index === 1 ? 2 : 3),
        txHash,
        ipfsCid,
        verifiedAt,
      };
    });
  }, [scopedProjectsList, evidenceList, verificationList, adminStatuses]);

  // Overall metrics summary
  const metrics = useMemo(() => {
    const total = enrichedProjects.length;
    const verified = enrichedProjects.filter((p) => p.verificationStatus === "Verified").length;
    const inReview = enrichedProjects.filter((p) => ["Under Verification", "Automated Analysis", "Human Review", "Pending Review"].includes(p.verificationStatus)).length;
    const actionRequired = enrichedProjects.filter((p) => p.verificationStatus === "Changes Requested").length;
    const totalCarbonVerified = enrichedProjects
      .filter((p) => p.verificationStatus === "Verified")
      .reduce((sum, p) => sum + (Number(String(p.carbon || "").replace(/[^0-9.]/g, "")) || 0), 0);
    const avgAiConfidence = total ? Math.round(enrichedProjects.reduce((sum, p) => sum + p.aiConfidence, 0) / total) : 0;

    return {
      total,
      verified,
      inReview,
      actionRequired,
      totalCarbonVerified,
      avgAiConfidence,
      verificationRate: total ? Math.round((verified / total) * 100) : 0,
    };
  }, [enrichedProjects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return enrichedProjects.filter((project) => {
      const matchesSearch =
        project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.location?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Verified" && project.verificationStatus === "Verified") ||
        (statusFilter === "In Review" && ["Under Verification", "Automated Analysis", "Human Review", "Pending Review"].includes(project.verificationStatus)) ||
        (statusFilter === "Action Required" && project.verificationStatus === "Changes Requested") ||
        (statusFilter === "Rejected" && project.verificationStatus === "Rejected");

      const matchesStage = selectedStage === null || project.currentStage === selectedStage;

      return matchesSearch && matchesStatus && matchesStage;
    });
  }, [enrichedProjects, searchQuery, statusFilter, selectedStage]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Verified":
        return {
          bg: "bg-seagrass/15 text-emerald-800 border-seagrass/30",
          icon: <CheckCircle2 size={15} className="text-seagrass" />,
          label: "Verified & Certified",
        };
      case "Changes Requested":
        return {
          bg: "bg-coral/15 text-coral border-coral/30",
          icon: <AlertTriangle size={15} className="text-coral" />,
          label: "Changes Requested",
        };
      case "Rejected":
        return {
          bg: "bg-red-50 text-red-700 border-red-200",
          icon: <XCircle size={15} className="text-red-600" />,
          label: "Audit Rejected",
        };
      case "Automated Analysis":
        return {
          bg: "bg-brand-teal/10 text-brand-teal border-brand-teal/20",
          icon: <Satellite size={15} className="text-brand-teal animate-pulse" />,
          label: "Satellite AI Analysis",
        };
      case "Human Review":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <ShieldCheck size={15} className="text-blue-600" />,
          label: "Expert Verifier Review",
        };
      default:
        return {
          bg: "bg-sand text-deep-navy border-sand",
          icon: <Clock3 size={15} className="text-deep-navy" />,
          label: "Pending Ingestion",
        };
    }
  };

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-8">
      {/* =========================================================
          HERO BANNER
          ========================================================= */}
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-deep-navy via-brand-teal to-seagrass p-6 shadow-xl lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sand/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-seagrass/30 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-sand/30 bg-sand/15 px-3.5 py-1.5 text-xs sm:text-sm font-bold tracking-wider text-sand backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </span>
              <ShieldCheck size={16} className="text-emerald-300" />
              <span>MRV VERIFICATION & AUDIT HUB</span>
            </div>

            <h1 className="dashboard-display mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Blue Carbon Verification
            </h1>

            <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-slate-200">
              Cross-validate ground evidence with satellite multi-spectral telemetry, AI biomass indices, and independent verifier sign-offs for verifiable carbon credits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="hidden text-xs text-slate-200 sm:block">
              Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button
              onClick={refreshData}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20 backdrop-blur"
              aria-label="Refresh verification data"
            >
              <RefreshCw size={16} />
              Sync Status
            </button>
            <Link
              to="/evidence"
              className="inline-flex items-center gap-2 rounded-xl bg-sand px-5 py-2.5 text-sm font-bold text-deep-navy shadow-md transition hover:bg-white"
            >
              <UploadCloud size={18} className="text-brand-teal" />
              Submit Evidence
            </Link>
          </div>
        </div>

        {/* Quick Top Metrics Ribbon */}
        <div className="relative mt-8 grid grid-cols-2 gap-3 border-t border-white/15 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-sand">Certified Carbon</p>
            <p className="dashboard-display mt-1 text-2xl sm:text-3xl font-bold text-white">
              {formatCarbon(metrics.totalCarbonVerified)} <span className="text-base font-medium text-sand">tCO₂e</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-300">{metrics.verified} projects fully certified</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-sand">AI Alignment Score</p>
            <p className="dashboard-display mt-1 text-2xl sm:text-3xl font-bold text-emerald-300">
              {metrics.avgAiConfidence}%
            </p>
            <p className="mt-0.5 text-xs text-slate-300">Sentinel & Planet satellite index</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-sand">Active Audit Pipeline</p>
            <p className="dashboard-display mt-1 text-2xl sm:text-3xl font-bold text-white">
              {metrics.inReview} <span className="text-base font-medium text-sand">in review</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-300">Stage 1 - 3 verification in flight</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-sand">Action Required</p>
            <p className={`dashboard-display mt-1 text-2xl sm:text-3xl font-bold ${metrics.actionRequired > 0 ? "text-coral" : "text-white"}`}>
              {metrics.actionRequired} <span className="text-base font-medium text-sand">projects</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-300">{metrics.actionRequired > 0 ? "Additional evidence requested" : "All records up to date"}</p>
          </div>
        </div>
      </header>

      {/* =========================================================
          4-STAGE VERIFICATION PIPELINE STEPPER
          ========================================================= */}
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Layers size={20} className="text-brand-teal" />
              <h2 className="dashboard-card-title text-lg sm:text-xl font-bold text-slate-900">
                MRV 4-Stage Verification Workflow
              </h2>
            </div>
            <p className="mt-1 text-sm sm:text-base text-slate-600">
              Every project undergoes four rigorous verification gates prior to carbon credit minting.
            </p>
          </div>
          {selectedStage && (
            <button
              onClick={() => setSelectedStage(null)}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-brand-teal hover:underline"
            >
              Clear stage filter <X size={14} />
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StageCard
            number="1"
            title="Evidence Ingestion"
            desc="Geotagged drone images, boundary shapefiles & canopy survey data uploaded."
            active={selectedStage === 1}
            onClick={() => setSelectedStage(selectedStage === 1 ? null : 1)}
            badge="Stage 1"
            icon={<UploadCloud size={20} />}
          />
          <StageCard
            number="2"
            title="Satellite AI Cross-Check"
            desc="Planet Labs & Sentinel-2 multispectral NDVI scans and biomass density models."
            active={selectedStage === 2}
            onClick={() => setSelectedStage(selectedStage === 2 ? null : 2)}
            badge="Stage 2"
            icon={<Satellite size={20} />}
          />
          <StageCard
            number="3"
            title="Auditor Review"
            desc="Independent environmental verifier audits additionality, risk & ground claims."
            active={selectedStage === 3}
            onClick={() => setSelectedStage(selectedStage === 3 ? null : 3)}
            badge="Stage 3"
            icon={<ShieldCheck size={20} />}
          />
          <StageCard
            number="4"
            title="On-Chain Issuance"
            desc="Cryptographic anchor hash generated with IPFS CID & registry certification."
            active={selectedStage === 4}
            onClick={() => setSelectedStage(selectedStage === 4 ? null : 4)}
            badge="Stage 4"
            icon={<Award size={20} />}
          />
        </div>
      </section>

      {/* =========================================================
          VERIFICATION QUEUE & PROJECT CARDS
          ========================================================= */}
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Controls: Search & Filters */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-center">
          <div>
            <h2 className="dashboard-card-title text-lg sm:text-xl font-bold text-slate-900">
              Project Verification Registry
            </h2>
            <p className="mt-1 text-sm sm:text-base text-slate-600">
              Showing {filteredProjects.length} of {enrichedProjects.length} registered projects
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search input */}
            <div className="relative min-w-[240px]">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search project or ID..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:border-brand-teal focus:bg-white focus:outline-none"
              />
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {["All", "Verified", "In Review", "Action Required", "Rejected"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold transition ${
                    statusFilter === tab
                      ? "bg-brand-teal text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Project Cards List */}
        <div className="mt-6 space-y-4">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => {
              const badge = getStatusBadge(project.verificationStatus);
              return (
                <article
                  key={project.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-teal/40 hover:shadow-md"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    {/* Project identification */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                          {project.id}
                        </span>
                        <h3 className="truncate text-base sm:text-lg font-bold text-slate-900">
                          {project.name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs sm:text-sm font-bold ${badge.bg}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <MapPin size={14} className="text-slate-400" />
                          {project.location}
                        </span>
                        <span>•</span>
                        <span>Area: <strong className="text-slate-800">{project.area}</strong></span>
                        <span>•</span>
                        <span>Est. Carbon: <strong className="text-brand-teal">{project.carbon}</strong></span>
                      </div>
                    </div>

                    {/* Verification Gauges */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:w-96">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">AI Confidence</p>
                        <p className="text-lg font-extrabold text-emerald-600">{project.aiConfidence}%</p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Satellite Match</p>
                        <p className="text-lg font-extrabold text-brand-teal">{project.satelliteMatch}%</p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Evidence Docs</p>
                        <p className="text-lg font-extrabold text-slate-800">{project.evidenceCount}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                      <button
                        onClick={() => setSelectedProjectForAudit(project)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 shadow-sm transition hover:border-brand-teal hover:text-brand-teal"
                      >
                        <Eye size={16} />
                        Inspect Audit Trail
                      </button>

                      {project.verificationStatus === "Changes Requested" ? (
                        <Link
                          to="/evidence"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-coral px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-coral/90"
                        >
                          <UploadCloud size={16} />
                          Upload Required Info
                        </Link>
                      ) : project.verificationStatus === "Verified" ? (
                        <button
                          onClick={() => setSelectedProjectForAudit(project)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-seagrass/20 px-3.5 py-2 text-xs sm:text-sm font-bold text-emerald-800 transition hover:bg-seagrass/30"
                        >
                          <Award size={16} className="text-seagrass" />
                          View Certificate
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Verifier Remarks Preview */}
                  <div className="mt-3.5 rounded-xl border border-slate-100 bg-slate-50/75 p-3 text-xs sm:text-sm text-slate-700">
                    <strong className="text-slate-900">Verifier Note:</strong> {project.verifierRemarks}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <Search size={32} className="mx-auto text-slate-400" />
              <h3 className="mt-3 text-base sm:text-lg font-bold text-slate-800">No verification records found</h3>
              <p className="mt-1 text-sm text-slate-600">Try changing your search keywords or resetting status filters.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("All");
                  setSelectedStage(null);
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white shadow-sm"
              >
                <RotateCcw size={15} /> Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          CRYPTOGRAPHIC PROOF & REGISTRY PROOF SECTION
          ========================================================= */}
      <section className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-deep-navy via-brand-teal to-ocean p-6 text-white shadow-xl lg:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sand">
              <Fingerprint size={22} className="text-emerald-300" />
              <h2 className="dashboard-card-title text-lg sm:text-xl font-bold text-white">
                Cryptographic MRV Anchor & Registry Proofs
              </h2>
            </div>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-200">
              BlueGuard anchors every verified satellite NDVI analysis, boundary GeoJSON polygon, and ground evidence pack on-chain for tamper-proof audit trails.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Merkle Tree Active
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sand/30 bg-sand/15 px-3.5 py-1.5 text-xs font-semibold text-sand">
              <Lock size={13} /> IPFS Pinning Enabled
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-sand">Latest Proof Hash</p>
            <div className="mt-2 flex items-center justify-between rounded-xl bg-black/30 p-2.5 font-mono text-xs text-emerald-300">
              <span className="truncate">{generateMockTxHash("GLOBAL-REGISTRY")}</span>
              <button
                onClick={() => copyToClipboard(generateMockTxHash("GLOBAL-REGISTRY"))}
                className="ml-2 shrink-0 p-1 text-slate-300 hover:text-white"
                title="Copy hash"
              >
                <Copy size={14} />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-300">Anchored to polygon testnet block #18,492,012</p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-sand">IPFS Evidence Manifest CID</p>
            <div className="mt-2 flex items-center justify-between rounded-xl bg-black/30 p-2.5 font-mono text-xs text-sand">
              <span className="truncate">QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXBG001</span>
              <button
                onClick={() => copyToClipboard("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXBG001")}
                className="ml-2 shrink-0 p-1 text-slate-300 hover:text-white"
                title="Copy CID"
              >
                <Copy size={14} />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-300">Immutable storage of photos, drone logs & survey notes</p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-sand">Compliance Standards</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-white">VM0007 / VM0033</span>
              <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-white">Verra Blue Carbon</span>
              <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-white">Gold Standard</span>
            </div>
            <p className="mt-2 text-xs text-slate-300">Compatible with international carbon credit registries</p>
          </div>
        </div>
      </section>

      {/* =========================================================
          AUDIT DETAIL & CERTIFICATE MODAL
          ========================================================= */}
      {selectedProjectForAudit && (
        <AuditDetailModal
          project={selectedProjectForAudit}
          onClose={() => setSelectedProjectForAudit(null)}
          onCopy={copyToClipboard}
          copied={copiedHash}
        />
      )}
    </div>
  );
}

/* =========================================================
   HELPER SUB-COMPONENTS
   ========================================================= */

function StageCard({ number, title, desc, active, onClick, badge, icon }) {
  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl border p-5 transition-all ${
        active
          ? "border-brand-teal bg-brand-teal/5 shadow-md ring-2 ring-brand-teal/20"
          : "border-slate-200 bg-slate-50/60 hover:border-brand-teal/30 hover:bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold transition ${
            active ? "bg-brand-teal text-white" : "bg-sand text-deep-navy group-hover:bg-brand-teal group-hover:text-white"
          }`}
        >
          {number}
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{badge}</span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-slate-900">
        <span className="text-brand-teal">{icon}</span>
        <h3 className="font-bold text-sm sm:text-base">{title}</h3>
      </div>

      <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function AuditDetailModal({ project, onClose, onCopy, copied }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-deep-navy px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand/20 text-sand">
              <ShieldCheck size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-white/20 px-2 py-0.5 text-xs font-bold text-sand">{project.id}</span>
                <h3 className="text-lg font-bold text-white">{project.name}</h3>
              </div>
              <p className="text-xs text-slate-300">MRV Audit Trail & Cryptographic Verification Record</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          {[
            { id: "overview", label: "Audit Summary" },
            { id: "telemetry", label: "Satellite AI Telemetry" },
            { id: "timeline", label: "Verification Timeline" },
            { id: "proof", label: "Cryptographic Certificate" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition ${
                activeTab === tab.id
                  ? "border-brand-teal text-brand-teal"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Status</p>
                  <p className="mt-1 text-base font-extrabold text-brand-teal">{project.verificationStatus}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">AI Confidence</p>
                  <p className="mt-1 text-base font-extrabold text-emerald-600">{project.aiConfidence}% match</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Registered Carbon</p>
                  <p className="mt-1 text-base font-extrabold text-slate-800">{project.carbon}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">Verifier Audit Findings & Remarks</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{project.verifierRemarks}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">Project Location & Coordinates</h4>
                <p className="mt-1 text-sm text-slate-600">{project.location}</p>
                <div className="mt-2 flex items-center gap-2 font-mono text-xs text-slate-500">
                  <MapPin size={14} className="text-brand-teal" />
                  Lat: {project.coordinates ? project.coordinates[0] : "21.9497"}, Lng: {project.coordinates ? project.coordinates[1] : "89.1833"}
                </div>
              </div>
            </div>
          )}

          {activeTab === "telemetry" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">Satellite Multi-Spectral Cross-Check</h4>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-3 border border-slate-200">
                    <p className="text-xs text-slate-500">Reported Ground Area</p>
                    <p className="text-lg font-bold text-slate-900">{project.area}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200">
                    <p className="text-xs text-slate-500">Satellite Delineated Boundary</p>
                    <p className="text-lg font-bold text-emerald-700">{project.area} (99.2% overlap)</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200">
                    <p className="text-xs text-slate-500">NDVI Canopy Health Index</p>
                    <p className="text-lg font-bold text-brand-teal">0.78 (Healthy Forest Canopy)</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200">
                    <p className="text-xs text-slate-500">Risk Assessment</p>
                    <p className="text-lg font-bold text-slate-900">{project.riskLevel} Risk</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs sm:text-sm text-emerald-900">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 size={16} /> Satellite Ingestion Confirmed
                </div>
                <p className="mt-1">
                  Sentinel-2 L2A optical bands B4 (Red) & B8 (NIR) verified with cloud coverage &lt; 2%. Zero illegal deforestation anomalies detected.
                </p>
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-4">
              <div className="relative border-l-2 border-brand-teal/30 ml-4 space-y-6 pl-6 py-2">
                <div className="relative">
                  <span className="absolute -left-[31px] top-1 flex h-4 w-4 rounded-full bg-brand-teal ring-4 ring-white" />
                  <p className="text-xs font-bold text-brand-teal">Stage 1: Evidence Submission</p>
                  <p className="text-sm font-bold text-slate-900">Initial Project Baseline & Evidence Uploaded</p>
                  <p className="text-xs text-slate-500 mt-0.5">Drone orthomosaics, shapefiles and field surveyor forms ingested.</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[31px] top-1 flex h-4 w-4 rounded-full bg-brand-teal ring-4 ring-white" />
                  <p className="text-xs font-bold text-brand-teal">Stage 2: AI Multi-Spectral Scan</p>
                  <p className="text-sm font-bold text-slate-900">Satellite Biomass Cross-Validation ({project.aiConfidence}% confidence)</p>
                  <p className="text-xs text-slate-500 mt-0.5">Automated polygon boundary verification and NDVI canopy density calculation.</p>
                </div>

                <div className="relative">
                  <span className={`absolute -left-[31px] top-1 flex h-4 w-4 rounded-full ${project.currentStage >= 3 ? "bg-brand-teal" : "bg-slate-300"} ring-4 ring-white`} />
                  <p className="text-xs font-bold text-brand-teal">Stage 3: Verifier Audit</p>
                  <p className="text-sm font-bold text-slate-900">Third-Party Auditor Review ({project.verificationStatus})</p>
                  <p className="text-xs text-slate-500 mt-0.5">{project.verifierRemarks}</p>
                </div>

                <div className="relative">
                  <span className={`absolute -left-[31px] top-1 flex h-4 w-4 rounded-full ${project.currentStage >= 4 ? "bg-seagrass" : "bg-slate-300"} ring-4 ring-white`} />
                  <p className="text-xs font-bold text-seagrass">Stage 4: Certification</p>
                  <p className="text-sm font-bold text-slate-900">On-Chain Cryptographic Proof & Certificate</p>
                  <p className="text-xs text-slate-500 mt-0.5">Tx Hash: {project.txHash}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "proof" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-sand bg-sand/30 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award size={22} className="text-brand-teal" />
                    <h4 className="font-bold text-deep-navy text-base">Blue Carbon Registry Certificate</h4>
                  </div>
                  <span className="rounded-full bg-brand-teal px-3 py-1 text-xs font-bold text-white">Verified</span>
                </div>

                <div className="mt-4 space-y-2 text-xs sm:text-sm text-slate-700">
                  <p><strong>Project:</strong> {project.name} ({project.id})</p>
                  <p><strong>Certified Carbon Volume:</strong> {project.carbon}</p>
                  <p><strong>Issuer:</strong> BlueGuard MRV Ecosystem</p>
                  <p><strong>Audit Date:</strong> {new Date(project.verifiedAt).toLocaleDateString()}</p>
                </div>

                <div className="mt-4 border-t border-sand/80 pt-4">
                  <p className="text-xs font-bold text-deep-navy">On-Chain Transaction Hash:</p>
                  <div className="mt-1 flex items-center justify-between rounded-xl bg-white p-2.5 font-mono text-xs text-slate-800 border border-slate-200">
                    <span className="truncate">{project.txHash}</span>
                    <button
                      onClick={() => onCopy(project.txHash)}
                      className="ml-2 font-sans text-xs font-bold text-brand-teal hover:underline"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-bold text-deep-navy">IPFS Evidence Manifest CID:</p>
                  <div className="mt-1 flex items-center justify-between rounded-xl bg-white p-2.5 font-mono text-xs text-slate-800 border border-slate-200">
                    <span className="truncate">{project.ipfsCid}</span>
                    <button
                      onClick={() => onCopy(project.ipfsCid)}
                      className="ml-2 font-sans text-xs font-bold text-brand-teal hover:underline"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <p className="text-xs text-slate-500">Certified by BlueGuard Automated MRV & Verification Network</p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
            <Link
              to={`/projects/${project.id}`}
              className="inline-flex items-center gap-1 rounded-xl bg-brand-teal px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-deep-navy"
            >
              Open Full Project <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}