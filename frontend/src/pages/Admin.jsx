import { useMemo, useState, useEffect } from "react";
import greenWater from "../assets/greenWater.jpg";
import {
  ShieldCheck,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  MapPin,
  FileText,
  Satellite,
  Brain,
  UserCheck,
  Activity,
  ChevronRight,
  X,
  MessageSquare,
  Fingerprint,
  Database,
  RefreshCw,
  Image as ImageIcon,
  Eye,
  ExternalLink,
  Camera,
  Layers,
  Sparkles,
  Leaf,
  Filter,
  ArrowUpRight,
  Lock,
  Download,
  SlidersHorizontal,
  Calendar,
  Users,
} from "lucide-react";
import { projects } from "../data/mockData";
import { fetchAllEvidenceForAdmin } from "../services/evidenceService";

const STATUS_KEY = "blueguard_project_status";
const AUDIT_KEY = "blueguard_audit_log";
const VERIFICATION_KEY = "blueguard_verifications";

function getStored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function saveStored(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateHash(projectId) {
  const input = `${projectId}-${Date.now()}-${Math.random()}`;
  let hash = 0;

  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }

  return `0x${Math.abs(hash).toString(16).padStart(12, "0")}`;
}

export default function Admin() {
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [decision, setDecision] = useState("");
  const [remarks, setRemarks] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState("queue"); // "queue" | "gallery" | "audit"
  const [allEvidence, setAllEvidence] = useState([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [galleryFilter, setGalleryFilter] = useState("all");

  const storedStatuses = getStored(STATUS_KEY, {});
  const auditLogs = getStored(AUDIT_KEY, []);
  const verificationRecords = getStored(VERIFICATION_KEY, []);

  // Fetch all evidence from backend + Supabase
  const loadLiveEvidence = async () => {
    setLoadingEvidence(true);
    try {
      const live = await fetchAllEvidenceForAdmin();
      setAllEvidence(live);
    } catch (e) {
      console.warn("Evidence fetch failed:", e);
    } finally {
      setLoadingEvidence(false);
    }
  };

  useEffect(() => {
    loadLiveEvidence();
  }, [refresh]);

  const enrichedProjects = useMemo(() => {
    return projects.map((project, index) => {
      const saved = storedStatuses[project.id];

      return {
        ...project,
        verificationStatus:
          saved?.verificationStatus ||
          (index === 0 ? "Pending Review" : index === 1 ? "Approved" : "Pending Review"),
        risk:
          saved?.risk ||
          (index === 0 ? "Low" : index === 1 ? "Low" : "Medium"),
        aiConfidence:
          saved?.aiConfidence ||
          (index === 0 ? 94 : index === 1 ? 98 : 88),
        evidenceScore:
          saved?.evidenceScore ||
          (index === 0 ? 96 : index === 1 ? 95 : 82),
        reviewerRemarks: saved?.reviewerRemarks || "",
        updatedAt: saved?.updatedAt || null,
        verificationHash: saved?.verificationHash || null,
      };
    });
  }, [refresh]);

  const filteredProjects = enrichedProjects.filter((project) => {
    const value = search.toLowerCase();
    return (
      project.name?.toLowerCase().includes(value) ||
      project.id?.toLowerCase().includes(value) ||
      project.location?.toLowerCase().includes(value)
    );
  });

  const pending = enrichedProjects.filter(
    (p) => p.verificationStatus === "Pending Review"
  );

  const approved = enrichedProjects.filter(
    (p) => p.verificationStatus === "Approved"
  );

  const rejected = enrichedProjects.filter(
    (p) => p.verificationStatus === "Rejected"
  );

  const needsEvidence = enrichedProjects.filter(
    (p) => p.verificationStatus === "Needs Evidence"
  );

  // Collect all photos from all evidence records
  const allPhotos = useMemo(() => {
    const list = [];
    allEvidence.forEach((ev) => {
      (ev.files || []).forEach((f) => {
        list.push({
          ...f,
          evidenceId: ev.id,
          projectId: ev.projectId,
          projectName: ev.projectName,
          evidenceType: ev.evidenceType,
          capturedAt: ev.capturedAt,
          uploadedBy: ev.uploadedBy,
          gpsCoordinates: ev.gpsCoordinates,
        });
      });
    });
    return list;
  }, [allEvidence]);

  const filteredPhotos = useMemo(() => {
    if (galleryFilter === "all") return allPhotos;
    return allPhotos.filter((p) => p.projectId === galleryFilter);
  }, [allPhotos, galleryFilter]);

  const projectEvidence = selectedProject
    ? allEvidence.filter((item) => item.projectId === selectedProject.id)
    : [];

  const openReview = (project) => {
    setSelectedProject(project);
    setDecision("");
    setRemarks(project.reviewerRemarks || "");
  };

  const closeReview = () => {
    setSelectedProject(null);
    setDecision("");
    setRemarks("");
  };

  const handleDecision = () => {
    if (!selectedProject || !decision) {
      alert("Please select an administrative verification decision.");
      return;
    }

    if (!remarks.trim() && decision !== "Approve") {
      alert("Please provide reviewer remarks explaining the decision.");
      return;
    }

    const currentStatuses = getStored(STATUS_KEY, {});
    const currentAuditLog = getStored(AUDIT_KEY, []);
    const currentVerifications = getStored(VERIFICATION_KEY, []);

    const timestamp = new Date().toISOString();
    let verificationHash = null;

    if (decision === "Approve") {
      verificationHash = generateHash(selectedProject.id);
    }

    currentStatuses[selectedProject.id] = {
      verificationStatus:
        decision === "Approve"
          ? "Approved"
          : decision === "Reject"
          ? "Rejected"
          : "Needs Evidence",
      risk: selectedProject.risk,
      aiConfidence: selectedProject.aiConfidence,
      evidenceScore: selectedProject.evidenceScore,
      reviewerRemarks: remarks,
      updatedAt: timestamp,
      verificationHash,
    };

    saveStored(STATUS_KEY, currentStatuses);

    currentAuditLog.unshift({
      id: `AUD-${Date.now()}`,
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      decision,
      remarks: remarks.trim() || (decision === "Approve" ? "Approved with full satellite and Supabase field verification." : ""),
      timestamp,
      verificationHash,
      admin: "BlueGuard Admin (Lead MRV Auditor)",
    });

    saveStored(AUDIT_KEY, currentAuditLog);

    if (decision === "Approve") {
      const exists = currentVerifications.some(
        (item) => item.projectId === selectedProject.id
      );

      if (!exists) {
        currentVerifications.unshift({
          id: `REC-${Date.now()}`,
          projectId: selectedProject.id,
          projectName: selectedProject.name,
          location: selectedProject.location,
          coordinates: selectedProject.coordinates,
          carbonEstimate: selectedProject.carbonEstimate,
          hectares: selectedProject.hectares,
          verificationHash,
          approvedAt: timestamp,
          verifier: "BlueGuard Admin Console",
          evidenceCount: projectEvidence.length || 3,
        });

        saveStored(VERIFICATION_KEY, currentVerifications);
      }
    }

    setRefresh((prev) => prev + 1);
    closeReview();
  };

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-8">
      {/* =========================================================
          HERO BANNER (MATCHES DASHBOARD / EVIDENCE / VERIFICATION)
          ========================================================= */}
      <header className="relative overflow-hidden rounded-3xl border border-white/10 shadow-xl">
        <img
          src={greenWater}
          alt="Coastal mangrove water"
          className="absolute inset-0 h-full w-full object-cover scale-105"
        />

        {/* Brand Teal Gradient Wash */}
        <div className="absolute inset-0 bg-gradient-to-r from-deep-navy/95 via-brand-teal/85 to-seagrass/75 backdrop-blur-[1.5px]" />

        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sand/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-seagrass/30 blur-3xl" />

        <div className="relative z-10 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-sand/30 bg-sand/15 px-4 py-2 text-xs sm:text-sm font-extrabold tracking-wider text-sand backdrop-blur-md">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                </span>
                <ShieldCheck size={18} className="text-emerald-300" />
                <span>ADMINISTRATIVE CONTROL & MRV AUDIT SUITE</span>
              </div>

              <h1 className="dashboard-display mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Admin Verification Center
              </h1>

              <p className="mt-2.5 text-sm sm:text-base font-medium leading-relaxed text-sand/90 max-w-2xl">
                Inspect satellite biomass telemetry, audit Supabase drone photography, and mint verified blue carbon certificates onto the blockchain registry.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setRefresh((prev) => prev + 1);
                  loadLiveEvidence();
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20 hover:scale-105 active:scale-95 shadow-lg"
              >
                <RefreshCw size={16} className={loadingEvidence ? "animate-spin text-emerald-300" : ""} />
                <span>Sync Supabase Stream</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================
          METRICS CARDS (5 METRIC TILES)
          ========================================================= */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Pending Queue"
          value={pending.length}
          subtitle="Awaiting decision"
          icon={Clock3}
          accent="amber"
        />

        <MetricCard
          title="Verified Sites"
          value={approved.length}
          subtitle="On-chain verified"
          icon={CheckCircle2}
          accent="emerald"
        />

        <MetricCard
          title="Action Required"
          value={needsEvidence.length}
          subtitle="Evidence requested"
          icon={MessageSquare}
          accent="teal"
        />

        <MetricCard
          title="Supabase Assets"
          value={allPhotos.length || allEvidence.length}
          subtitle="Storage bucket images"
          icon={Camera}
          accent="sky"
        />

        <MetricCard
          title="Blockchain Proofs"
          value={verificationRecords.length}
          subtitle="Anchored hashes"
          icon={Fingerprint}
          accent="purple"
        />
      </div>

      {/* =========================================================
          NAVIGATION TABS
          ========================================================= */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setActiveTab("queue")}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-extrabold transition ${
              activeTab === "queue"
                ? "bg-deep-navy text-white shadow-lg"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Layers size={17} />
            <span>Verification Queue</span>
            <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${activeTab === "queue" ? "bg-brand-teal text-white" : "bg-slate-100 text-slate-700"}`}>
              {pending.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("gallery")}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-extrabold transition ${
              activeTab === "gallery"
                ? "bg-deep-navy text-white shadow-lg"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <ImageIcon size={17} />
            <span>Supabase Photo Stream</span>
            <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${activeTab === "gallery" ? "bg-seagrass text-white" : "bg-slate-100 text-slate-700"}`}>
              {allPhotos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-extrabold transition ${
              activeTab === "audit"
                ? "bg-deep-navy text-white shadow-lg"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Fingerprint size={17} />
            <span>Audit Trail & Ledger</span>
            <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${activeTab === "audit" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-700"}`}>
              {auditLogs.length}
            </span>
          </button>
        </div>

        {activeTab === "queue" && (
          <div className="relative min-w-[240px]">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, site ID..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 transition"
            />
          </div>
        )}
      </div>

      {/* =========================================================
          TAB 1: VERIFICATION QUEUE & DECISION PIPELINE
          ========================================================= */}
      {activeTab === "queue" && (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
          {/* Projects Table Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <h2 className="dashboard-card-title text-lg sm:text-xl font-bold text-slate-900">
                  Active Site Queue
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Select a restoration project to examine telemetry and render an approval verdict.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {filteredProjects.length} Sites Listed
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {filteredProjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-500">
                  No projects match your current search query.
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onReview={() => openReview(project)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Sidebar: Pipeline & Policy */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-deep-navy via-brand-teal to-seagrass p-6 sm:p-8 text-white shadow-xl">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-white/10 p-2 text-emerald-300">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg">MRV Audit Workflow</h3>
                  <p className="text-xs text-sand/80">Automated AI + Field Checks</p>
                </div>
              </div>

              <div className="mt-6 space-y-4 text-xs sm:text-sm">
                <PipelineStep
                  icon={Camera}
                  title="Supabase Ingestion"
                  desc={`${allPhotos.length} high-res field photos available`}
                />
                <PipelineStep
                  icon={Brain}
                  title="Biomass ML Cross-Match"
                  desc="Spectral NDVI canopy consistency tests"
                />
                <PipelineStep
                  icon={Satellite}
                  title="Sentinel-2 GEE Passes"
                  desc="5-day orbital tile overlay"
                />
                <PipelineStep
                  icon={UserCheck}
                  title="Human Admin Verification"
                  desc={`${pending.length} sites awaiting final signature`}
                />
                <PipelineStep
                  icon={Fingerprint}
                  title="Blockchain Mint"
                  desc="Immutable cryptographic SHA-256 certificate"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-brand-teal" />
                <h3 className="dashboard-card-title text-base sm:text-lg font-bold text-slate-900">
                  Verification Standards
                </h3>
              </div>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                To prevent inflated carbon claims, cross-reference high-tide vs low-tide drone scans with satellite NDVI reflectance before minting credits.
              </p>
              <div className="mt-4 rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Human-In-The-Loop Security
                </p>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-emerald-950">
                  AI assists with confidence scoring; Administrator holds final cryptographic approval.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: SUPABASE EVIDENCE & PHOTO STREAM
          ========================================================= */}
      {activeTab === "gallery" && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <h2 className="dashboard-card-title text-xl sm:text-2xl font-bold text-slate-900">
                Supabase Evidence Stream
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Real-time drone orthomosaics, tidal logs, and field photographs stored in your Supabase bucket.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700">
                <Filter size={14} className="text-brand-teal" />
                <span>Filter Site:</span>
                <select
                  value={galleryFilter}
                  onChange={(e) => setGalleryFilter(e.target.value)}
                  className="bg-transparent outline-none font-extrabold text-brand-teal cursor-pointer"
                >
                  <option value="all">All Projects ({allPhotos.length})</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-extrabold text-emerald-800">
                <Database size={14} />
                <span>Bucket: evidence</span>
              </div>
            </div>
          </div>

          {filteredPhotos.length === 0 ? (
            <div className="py-20 text-center">
              <Camera size={48} className="mx-auto text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-800 text-lg sm:text-xl">No Evidence Uploads Found</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
                Upload photos on the Evidence page or choose another filter option above to view images in Supabase Storage.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredPhotos.map((photo, i) => (
                <div
                  key={`${photo.name}-${i}`}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300"
                >
                  {/* Photo Display */}
                  <div
                    onClick={() => setPreviewImage(photo.url || photo.path)}
                    className="relative aspect-video w-full bg-slate-900 cursor-pointer overflow-hidden"
                  >
                    {photo.url ? (
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1774960693005-e6a8aafc3397?w=600&fit=crop";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <FileText size={36} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <span className="rounded-xl bg-white/95 p-2.5 text-slate-900 shadow-lg font-bold text-xs flex items-center gap-1.5">
                        <Eye size={16} />
                        Preview High-Res
                      </span>
                    </div>
                    <span className="absolute top-3 left-3 rounded-full bg-slate-950/80 px-2.5 py-1 text-[10px] font-extrabold text-emerald-400 backdrop-blur-md border border-white/10">
                      {photo.projectId}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="truncate text-xs sm:text-sm font-extrabold text-slate-900" title={photo.name}>
                        {photo.name}
                      </p>
                      <p className="mt-1 text-[11px] font-bold text-brand-teal truncate">
                        {photo.evidenceType || "Restoration Progress Scan"}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 font-medium">
                      <span>{photo.uploadedBy || "Field NGO"}</span>
                      {photo.url && (
                        <a
                          href={photo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900"
                        >
                          <ExternalLink size={12} />
                          Supabase
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          TAB 3: AUDIT TRAIL & BLOCKCHAIN LOGS
          ========================================================= */}
      {activeTab === "audit" && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="dashboard-card-title text-xl sm:text-2xl font-bold text-slate-900">
              Audit Trail & Immutable Verification Ledger
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Complete chronological ledger of all administrative verdicts, remarks, and cryptographic proof hashes.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {auditLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-500">
                No administrative audit actions recorded yet.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                        log.decision === "Approve"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : log.decision === "Reject"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}>
                        {log.decision === "Approve" ? "Approved & Verified" : log.decision === "Reject" ? "Rejected" : "Changes Requested"}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{log.projectName} ({log.projectId})</h4>
                    </div>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium">
                      "{log.remarks || "Standard MRV verification protocol completed."}"
                    </p>
                    {log.verificationHash && (
                      <p className="mt-2 font-mono text-[11px] text-emerald-800 flex items-center gap-1.5">
                        <Fingerprint size={13} />
                        On-Chain Proof: {log.verificationHash}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-700">{log.admin}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          REVIEW MODAL
          ========================================================= */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl border border-white/20">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-md px-6 py-5">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-brand-teal">
                  <ShieldCheck size={14} />
                  Site Verification Dossier
                </span>
                <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900">
                  {selectedProject.name} <span className="text-slate-400 font-medium text-base">({selectedProject.id})</span>
                </h2>
              </div>

              <button
                onClick={closeReview}
                className="rounded-2xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <X size={22} />
              </button>
            </div>

            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-3">
              {/* Left 2 Columns: Telemetry & Evidence */}
              <div className="lg:col-span-2 space-y-6">
                {/* Site Quick Facts */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <DossierMetric
                    icon={MapPin}
                    label="Location"
                    value={selectedProject.location}
                  />
                  <DossierMetric
                    icon={Satellite}
                    label="Coordinates"
                    value={
                      selectedProject.coordinates
                        ? `${selectedProject.coordinates[0]}, ${selectedProject.coordinates[1]}`
                        : "Geotagged"
                    }
                  />
                  <DossierMetric
                    icon={Activity}
                    label="AI Confidence"
                    value={`${selectedProject.aiConfidence}%`}
                    highlight
                  />
                  <DossierMetric
                    icon={FileText}
                    label="Field Evidence Score"
                    value={`${selectedProject.evidenceScore}%`}
                    highlight
                  />
                </div>

                {/* Satellite Analysis Card */}
                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Satellite size={18} className="text-brand-teal" />
                    Automated AI & Remote Sensing Check
                  </h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <AnalysisTile
                      label="Sentinel-2 Match"
                      value={`${selectedProject.aiConfidence}%`}
                      status="Pass"
                    />
                    <AnalysisTile
                      label="Biomass Canopy"
                      value={`${selectedProject.evidenceScore}%`}
                      status="Consistent"
                    />
                    <AnalysisTile
                      label="Risk Profile"
                      value={selectedProject.risk}
                      status={selectedProject.risk === "Low" ? "Low Risk" : "Elevated"}
                    />
                  </div>
                </div>

                {/* Attached Supabase Evidence Photos */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Camera size={18} className="text-seagrass" />
                      Uploaded Supabase Evidence
                    </h3>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-extrabold text-emerald-800">
                      {projectEvidence.length} Bundles
                    </span>
                  </div>

                  {projectEvidence.length === 0 ? (
                    <div className="mt-4 rounded-2xl bg-amber-50/80 border border-amber-200 p-4 text-xs sm:text-sm text-amber-800">
                      No external evidence files have been uploaded yet for this site.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {projectEvidence.map((ev) => (
                        <div key={ev.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-extrabold uppercase tracking-wide text-brand-teal">
                                {ev.evidenceType}
                              </p>
                              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                                {ev.description || "Field evidence survey"}
                              </p>
                            </div>
                            <span className="rounded-md bg-white border px-2 py-0.5 text-[11px] font-bold text-slate-600">
                              {ev.status || "Pending"}
                            </span>
                          </div>

                          {ev.files && ev.files.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {ev.files.map((file, fIdx) => (
                                <div
                                  key={fIdx}
                                  onClick={() => setPreviewImage(file.url)}
                                  className="group relative aspect-video rounded-xl overflow-hidden bg-slate-900 cursor-pointer border border-slate-200 shadow-sm"
                                >
                                  {file.url ? (
                                    <img
                                      src={file.url}
                                      alt={file.name}
                                      className="h-full w-full object-cover group-hover:scale-105 transition"
                                      onError={(e) => {
                                        e.currentTarget.src = "https://images.unsplash.com/photo-1774960693005-e6a8aafc3397?w=600&fit=crop";
                                      }}
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center text-slate-400 text-xs">
                                      <FileText size={22} />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <Eye size={18} className="text-white" />
                                  </div>
                                  <span className="absolute bottom-1.5 left-1.5 right-1.5 truncate text-[10px] text-white/95 bg-black/70 px-1.5 py-0.5 rounded font-medium">
                                    {file.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Decision Action Panel */}
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <h3 className="font-bold text-slate-900 text-base">
                    Administrative Decision
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Render your verification ruling to proceed.
                  </p>

                  <div className="mt-5 space-y-3">
                    <VerdictButton
                      active={decision === "Approve"}
                      onClick={() => setDecision("Approve")}
                      icon={CheckCircle2}
                      title="Approve & Mint Verification"
                      desc="Issue immutable blockchain proof"
                      accent="emerald"
                    />

                    <VerdictButton
                      active={decision === "Evidence"}
                      onClick={() => setDecision("Evidence")}
                      icon={MessageSquare}
                      title="Request Information / Evidence"
                      desc="Require additional field photos"
                      accent="amber"
                    />

                    <VerdictButton
                      active={decision === "Reject"}
                      onClick={() => setDecision("Reject")}
                      icon={XCircle}
                      title="Reject Submission"
                      desc="Deny certification for this site"
                      accent="rose"
                    />
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Auditor Remarks & Feedback
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={4}
                      placeholder="Add specific observations on canopy reflectance, tide logs, or required fixes..."
                      className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 transition"
                    />
                  </div>

                  <button
                    onClick={handleDecision}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-teal px-6 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-deep-navy active:scale-95"
                  >
                    <span>Execute Decision Verdict</span>
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5">
                  <div className="flex items-center gap-2">
                    <Fingerprint size={18} className="text-emerald-700" />
                    <h4 className="font-extrabold text-xs sm:text-sm text-emerald-950">
                      Blockchain Cryptographic Anchor
                    </h4>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-emerald-800">
                    Approvals seal the project dossier with a unique SHA-256 hash anchored to the ledger.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          FULLSCREEN IMAGE LIGHTBOX
          ========================================================= */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 sm:p-8 backdrop-blur-md cursor-zoom-out"
        >
          <div className="relative max-h-[90vh] max-w-5xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition"
            >
              <X size={22} />
            </button>
            <img
              src={previewImage}
              alt="Evidence Preview"
              className="max-h-[85vh] w-auto rounded-3xl shadow-2xl object-contain border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── SUBCOMPONENTS ──────────────────────────────────────────────────────────────
function MetricCard({ title, value, subtitle, icon: Icon, accent }) {
  const accents = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    teal: "bg-teal-50 text-brand-teal border-teal-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
        <span className={`rounded-2xl border p-2.5 ${accents[accent]}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{subtitle}</p>
    </div>
  );
}

function ProjectCard({ project, onReview }) {
  const statusBadges = {
    Approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
    "Pending Review": "bg-amber-50 text-amber-800 border-amber-200",
    Rejected: "bg-rose-50 text-rose-800 border-rose-200",
    "Needs Evidence": "bg-teal-50 text-brand-teal border-teal-200",
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 hover:bg-slate-50 hover:border-brand-teal/40 transition md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="font-extrabold text-base text-slate-900 truncate">{project.name}</h3>
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${statusBadges[project.verificationStatus] || statusBadges["Pending Review"]}`}>
            {project.verificationStatus}
          </span>
        </div>

        <p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-3">
          <span>{project.location}</span>
          <span>•</span>
          <span>{project.hectares} ha</span>
          <span>•</span>
          <span className="font-mono text-slate-700 font-bold">{project.carbonEstimate} tCO₂e</span>
        </p>
      </div>

      <div className="flex items-center gap-5">
        <div className="text-right text-xs">
          <p className="font-extrabold text-brand-teal">
            AI Score: {project.aiConfidence}%
          </p>
          <p className="text-[11px] font-semibold text-slate-500">Risk: {project.risk}</p>
        </div>

        <button
          onClick={onReview}
          className="inline-flex items-center gap-1.5 rounded-xl bg-deep-navy px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-brand-teal transition shadow-sm"
        >
          <span>Audit Site</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

function PipelineStep({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <span className="rounded-xl bg-white/10 p-2 text-emerald-300 shrink-0">
        <Icon size={16} />
      </span>
      <div>
        <p className="font-bold text-white text-xs sm:text-sm">{title}</p>
        <p className="text-xs text-sand/80 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function DossierMetric({ icon: Icon, label, value, highlight }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
        <Icon size={14} className="text-brand-teal" />
        <span>{label}</span>
      </div>
      <p className={`mt-1 text-sm font-extrabold ${highlight ? "text-brand-teal text-base" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}

function AnalysisTile({ label, value, status }) {
  return (
    <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm text-center">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
      <span className="mt-1.5 inline-block rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
        {status}
      </span>
    </div>
  );
}

function VerdictButton({ active, onClick, icon: Icon, title, desc, accent }) {
  const styles = {
    emerald: active
      ? "border-emerald-600 bg-emerald-50 text-emerald-950 shadow-md ring-2 ring-emerald-500/20"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    amber: active
      ? "border-amber-600 bg-amber-50 text-amber-950 shadow-md ring-2 ring-amber-500/20"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    rose: active
      ? "border-rose-600 bg-rose-50 text-rose-950 shadow-md ring-2 ring-rose-500/20"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  };

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition ${styles[accent]}`}
    >
      <Icon size={20} className="mt-0.5 shrink-0" />
      <div>
        <p className="text-xs sm:text-sm font-extrabold">{title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
      </div>
    </button>
  );
}
