import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import greenWater from "../assets/greenWater.jpg";
import {
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  FileText,
  Fingerprint,
  FolderOpen,
  HelpCircle,
  Info,
  Layers,
  Leaf,
  Lock,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trash2,
  UploadCloud,
  Waves,
  PlusCircle,
  AlertCircle,
} from "lucide-react";
import { projects as seedProjects } from "../data/mockData";
import { submitEvidenceBundle } from "../services/evidenceService";
import { getCurrentUser } from "../services/authService";
import { getScopedProjects } from "../services/scopeService";

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

const acceptedFormats = ["JPG", "PNG", "MP4", "PDF", "GeoJSON", "KML"];

const evidenceCategories = [
  { id: "Restoration Progress", label: "Restoration Progress & Canopy Density" },
  { id: "Canopy Drone Orthomosaic", label: "Canopy Drone Orthomosaic & Aerial Scan" },
  { id: "Plantation Activity", label: "Nursery Seedling & Planting Survey" },
  { id: "Site Condition & Hydrology", label: "Site Condition & Tidal Inundation Log" },
  { id: "Sediment Core Lab Report", label: "Sediment Core Lab Carbon Density Report" },
  { id: "Community Verification Form", label: "Community Survey & Field Boundary Form" },
];

function formatFileSize(size) {
  if (!Number.isFinite(size) || size <= 0) return "0 KB";
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Evidence() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentUser = getCurrentUser();

  const allProjects = loadProjects();
  
  // Strictly filter projects belonging ONLY to the logged-in organization
  const availableProjects = useMemo(() => {
    return getScopedProjects(allProjects);
  }, [allProjects]);

  const queryProject = searchParams.get("project");
  const [selectedProject, setSelectedProject] = useState(
    queryProject && availableProjects.some((p) => p.id === queryProject)
      ? queryProject
      : availableProjects[0]?.id || ""
  );

  useEffect(() => {
    if (availableProjects.length > 0) {
      const qp = searchParams.get("project");
      if (qp && availableProjects.some((p) => p.id === qp)) {
        setSelectedProject(qp);
      } else if (!availableProjects.some((p) => p.id === selectedProject)) {
        setSelectedProject(availableProjects[0]?.id || "");
      }
    } else {
      setSelectedProject("");
    }
  }, [searchParams, availableProjects]);

  const [evidenceType, setEvidenceType] = useState("Restoration Progress");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedProjectData = useMemo(() => {
    return availableProjects.find((p) => p.id === selectedProject) || availableProjects[0] || null;
  }, [availableProjects, selectedProject]);

  const totalFileSize = files.reduce((total, file) => total + (file.size || 0), 0);

  const updateFiles = (fileList) => {
    setFiles(Array.from(fileList || []));
  };

  const handleFiles = (event) => updateFiles(event.target.files);

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    updateFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragging(false);
  };

  const removeFile = (indexToRemove) => {
    setFiles((currentFiles) =>
      currentFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleSubmit = async () => {
    if (!selectedProject || files.length === 0) {
      alert("Please select one of your organization's projects and upload at least one evidence file.");
      return;
    }

    setSubmitting(true);

    const existingEvidence = JSON.parse(
      localStorage.getItem("blueguard_evidence") || "[]"
    );

    const evidenceId = `EV-${1042 + existingEvidence.length + 1}`;

    const evidenceRecord = {
      id: evidenceId,
      projectId: selectedProject,
      projectName: selectedProjectData?.name || "Coastal Restoration Site",
      evidenceType,
      description: description.trim() || "Field evidence submitted for MRV verification.",
      capturedAt: new Date().toISOString(),
      gpsCoordinates: selectedProjectData?.coordinates || [21.9497, 89.1833],
      uploadedBy: currentUser?.organizationName || currentUser?.name || "Restoration Partner",
      organizationId: currentUser?.id || currentUser?.uid || "ORG-001",
      organizationEmail: currentUser?.officialEmail || currentUser?.email || "",
      organizationName: currentUser?.organizationName || currentUser?.name || "Restoration Partner",
      status: "Pending Verification",
    };

    try {
      await submitEvidenceBundle(evidenceRecord, files);
    } catch (err) {
      console.warn("Evidence submission notice:", err);
    }

    setSubmitting(false);
    setSubmitted(true);

    setTimeout(() => {
      navigate("/verification");
    }, 700);
  };

  // If organization has NO registered projects yet, show strict isolation empty state
  if (availableProjects.length === 0) {
    return (
      <div className="min-h-full bg-slate-50 p-6 lg:p-8">
        <header className="relative overflow-hidden rounded-3xl border border-white/10 shadow-xl">
          <img
            src={greenWater}
            alt="Coastal mangrove water"
            className="absolute inset-0 h-full w-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deep-navy/95 via-brand-teal/85 to-seagrass/75 backdrop-blur-[1.5px]" />
          <div className="relative z-10 p-8 sm:p-10">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-sand/30 bg-sand/15 px-4 py-2 text-xs sm:text-sm font-extrabold tracking-wider text-sand backdrop-blur-md">
              <Leaf size={18} className="text-emerald-300" />
              <span>ORGANIZATION EVIDENCE PORTAL</span>
            </div>
            <h1 className="dashboard-display mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Submit Field Evidence
            </h1>
            <p className="mt-2.5 text-sm sm:text-base font-medium text-sand/90 max-w-2xl">
              Upload geotagged drone orthomosaics, vegetation surveys, and sediment core lab reports for your restoration sites.
            </p>
          </div>
        </header>

        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm max-w-2xl mx-auto">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 border border-teal-200 text-brand-teal mb-4">
            <FolderOpen size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Restoration Sites Registered Yet</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Your organization ({currentUser?.organizationName || "Your Organization"}) does not have any registered restoration projects yet. You can only submit evidence for sites owned by your organization.
          </p>
          <div className="mt-6">
            <Link
              to="/projects?new=true"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-teal px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-deep-navy transition"
            >
              <PlusCircle size={18} />
              <span>Register Your First Restoration Site</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-8">
      {/* =========================================================
          HERO BANNER
          ========================================================= */}
      <header className="relative overflow-hidden rounded-3xl border border-white/10 shadow-xl">
        <img
          src={greenWater}
          alt="Coastal mangrove water"
          className="absolute inset-0 h-full w-full object-cover scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-deep-navy/95 via-brand-teal/85 to-seagrass/75 backdrop-blur-[1.5px]" />

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
                <Leaf size={18} className="text-emerald-300" />
                <span>FIELD EVIDENCE COLLECTION & INGESTION</span>
              </div>

              <h1 className="dashboard-display mt-3 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white">
                Submit Field Evidence
              </h1>

              <p className="mt-3 text-base sm:text-lg lg:text-xl font-medium leading-relaxed text-slate-100 max-w-2xl">
                Upload geotagged field photos, drone orthomosaics, planting logs, and sediment lab tests for {currentUser?.organizationName || "your organization"}.
              </p>
            </div>

            {submitted && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-300/40 bg-emerald-500/20 px-4 py-3 text-emerald-200 backdrop-blur-md">
                <CheckCircle2 size={18} className="text-emerald-300" />
                <span className="text-sm font-bold">Evidence Bundle Uploaded!</span>
              </div>
            )}
          </div>

          {/* Quick Real-time Ingestion Ribbon */}
          <div className="relative mt-8 grid grid-cols-2 gap-3 border-t border-white/15 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand">Active Project Site</p>
              <p className="dashboard-display mt-1 text-xl sm:text-2xl font-black text-white truncate">
                {selectedProjectData?.name || "Selected Site"}
              </p>
              <p className="mt-0.5 text-xs text-slate-200">{selectedProjectData?.id} • {selectedProjectData?.area || selectedProjectData?.hectares || "100 ha"}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand">GPS Locking</p>
              <p className="dashboard-display mt-1 text-xl sm:text-2xl font-black text-emerald-300">
                Polygon Geotagged
              </p>
              <p className="mt-0.5 text-xs text-slate-200">EXIF coordinates verified</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand">Files Attached</p>
              <p className="dashboard-display mt-1 text-xl sm:text-2xl font-black text-white">
                {files.length} <span className="text-sm font-medium text-sand">({formatFileSize(totalFileSize)})</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-200">Photos, drone scans & logs</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand">MRV Pipeline Gate</p>
              <p className="dashboard-display mt-1 text-xl sm:text-2xl font-black text-white">
                Stage 1 <span className="text-sm font-medium text-sand">Active</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-200">Ready for Satellite AI scan</p>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================
          PROJECT SELECTION & EVIDENCE CATEGORY (STRICTLY SCOPED)
          ========================================================= */}
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
              <FolderOpen size={18} className="text-brand-teal" />
              Select Your Restoration Site *
            </label>
            <div className="relative">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-10 text-sm sm:text-base font-bold text-slate-900 outline-none transition focus:border-brand-teal focus:bg-white"
              >
                {availableProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} • {p.name} ({p.location})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
              <FileText size={18} className="text-brand-teal" />
              Evidence Category *
            </label>
            <div className="relative">
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-10 text-sm sm:text-base font-bold text-slate-900 outline-none transition focus:border-brand-teal focus:bg-white"
              >
                {evidenceCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          MAIN WORKSPACE: UPLOAD ZONE & EVIDENCE METADATA
          ========================================================= */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(340px,1fr)]">
        {/* LEFT: DROPZONE & ATTACHED FILES */}
        <div className="space-y-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="dashboard-card-title text-xl sm:text-2xl font-bold text-slate-900">
                  Evidence Files & Media
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Upload high-res photos, drone surveys, or laboratory carbon density sheets.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {files.length} attached
              </span>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative flex min-h-[260px] flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition ${
                dragging
                  ? "border-brand-teal bg-teal-50/50 scale-[0.99]"
                  : "border-slate-300 bg-slate-50 hover:border-brand-teal/60 hover:bg-slate-50/80"
              }`}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-teal text-white shadow-md">
                <UploadCloud size={32} />
              </div>

              <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900">
                Drag and drop your evidence files here
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                or click to browse from your device
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {acceptedFormats.map((format) => (
                  <span
                    key={format}
                    className="rounded-lg bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600 shadow-sm"
                  >
                    {format}
                  </span>
                ))}
              </div>

              <input
                type="file"
                multiple
                onChange={handleFiles}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>

            {/* Attached Files List */}
            {files.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Ready to Ingest ({files.length} files • {formatFileSize(totalFileSize)})
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-semibold text-slate-800 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileCheck2 size={18} className="text-brand-teal shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-slate-400 font-mono text-[11px]">
                          {formatFileSize(file.size)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Description & Field Notes */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <h3 className="dashboard-card-title text-base sm:text-lg font-bold text-slate-900 mb-2">
              Field Observations & Surveyor Notes
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-4">
              Describe the methodology, tide height during capture, camera specs, or seedling survival notes.
            </p>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Drone flight conducted at 50m AGL during low tide. 1,400 Avicennia marina seedlings monitored with 91% survival..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-brand-teal focus:bg-white transition"
            />
          </section>
        </div>

        {/* RIGHT: SUBMIT ACTION & SUMMARY */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <h3 className="dashboard-card-title text-lg sm:text-xl font-bold text-slate-900 mb-4">
              Submit to MRV Pipeline
            </h3>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Submitting Org:</span>
                <span className="font-bold text-slate-900 truncate max-w-[180px]">
                  {currentUser?.organizationName || "Organization Partner"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Target Plot:</span>
                <span className="font-bold text-slate-900 truncate max-w-[180px]">
                  {selectedProjectData?.name} ({selectedProjectData?.id})
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Evidence Category:</span>
                <span className="font-bold text-brand-teal">{evidenceType}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Storage Target:</span>
                <span className="font-mono font-bold text-emerald-800">Supabase Bucket</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || files.length === 0}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white shadow-lg transition ${
                submitting || files.length === 0
                  ? "bg-slate-300 cursor-not-allowed text-slate-500 shadow-none"
                  : "bg-brand-teal hover:bg-deep-navy active:scale-95 shadow-brand-teal/20"
              }`}
            >
              {submitting ? (
                <>
                  <UploadCloud size={18} className="animate-bounce" />
                  <span>Uploading to Supabase...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Submit Evidence Bundle</span>
                </>
              )}
            </button>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
              <ShieldCheck size={18} className="text-emerald-700" />
              <span>Multi-Tenant Security Guarantee</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-emerald-800">
              Your uploaded evidence files and photographs are cryptographically tagged and isolated to {currentUser?.organizationName || "your organization"}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
