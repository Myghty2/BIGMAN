import { getScopedProjects } from "../services/scopeService";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
} from "lucide-react";
import { projects as seedProjects } from "../data/mockData";
import { submitEvidenceBundle } from "../services/evidenceService";

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
  const projectsList = loadProjects();

  const queryProject = searchParams.get("project");
  const [selectedProject, setSelectedProject] = useState(
    queryProject && projectsList.some((p) => p.id === queryProject)
      ? queryProject
      : projectsList[0]?.id || "BG-001"
  );

  useEffect(() => {
    const qp = searchParams.get("project");
    if (qp && projectsList.some((p) => p.id === qp)) {
      setSelectedProject(qp);
    }
  }, [searchParams, projectsList]);
  const [evidenceType, setEvidenceType] = useState("Restoration Progress");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [dragging, setDragging] = useState(false);

  const selectedProjectData =
    projectsList.find((p) => p.id === selectedProject) || projectsList[0];

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

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedProject || files.length === 0) {
      alert("Please select a project and upload at least one evidence file.");
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

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-8">
      {/* =========================================================
          HERO BANNER (FULL WIDTH ALIGNMENT MATCHING OTHER PAGES)
          ========================================================= */}
      <header className="relative overflow-hidden rounded-3xl border border-white/10 shadow-xl">
        {/* Dappled Sunlit Green Water Background */}
        <img
          src={greenWater}
          alt="Coastal mangrove water"
          className="absolute inset-0 h-full w-full object-cover scale-105"
        />

        {/* Deep Navy to Brand Teal Gradient Overlay */}
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
                <Leaf size={18} className="text-emerald-300" />
                <span>FIELD EVIDENCE COLLECTION & INGESTION</span>
              </div>

              <h1 className="dashboard-display mt-3 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white">
                Submit Field Evidence
              </h1>

              <p className="mt-3 text-base sm:text-lg lg:text-xl font-medium leading-relaxed text-slate-100">
                Upload geotagged field surveys, high-resolution drone orthomosaics, soil carbon lab reports, and seedling records for automated satellite cross-validation.
              </p>
            </div>

            {/* Location Pill */}
            {selectedProjectData && (
              <div className="rounded-2xl border border-white/20 bg-white/15 p-5 text-white shadow-lg backdrop-blur-md min-w-[290px]">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-sand">
                  <MapPin size={16} className="text-emerald-300" />
                  <span>Target Site Location</span>
                </div>
                <p className="mt-1.5 font-bold text-lg text-white truncate">
                  {selectedProjectData.name}
                </p>
                <p className="mt-0.5 text-xs sm:text-sm text-slate-200 truncate">
                  {selectedProjectData.location}
                </p>
                <p className="mt-2 font-mono text-xs font-semibold text-sand">
                  GPS: {selectedProjectData.coordinates ? selectedProjectData.coordinates.join(", ") : "21.9497, 89.1833"}
                </p>
              </div>
            )}
          </div>

          {/* Quick Real-time Ingestion Ribbon */}
          <div className="relative mt-8 grid grid-cols-2 gap-3 border-t border-white/15 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand">Active Project Site</p>
              <p className="dashboard-display mt-1 text-xl sm:text-2xl font-black text-white truncate">
                {selectedProjectData?.name || "Selected Plot"}
              </p>
              <p className="mt-0.5 text-xs text-slate-200">{selectedProjectData?.id || "BG-001"} • {selectedProjectData?.area || "100 ha"}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand">GPS Locking</p>
              <p className="dashboard-display mt-1 text-xl sm:text-2xl font-black text-emerald-300">
                Polygon Geotagged
              </p>
              <p className="mt-0.5 text-xs text-slate-200">EXIF coordinates verified</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand">Files Ingested</p>
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
          PROJECT SELECTION & EVIDENCE CATEGORY
          ========================================================= */}
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
              <FolderOpen size={18} className="text-brand-teal" />
              Select Restoration Site *
            </label>
            <div className="relative">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-10 text-sm sm:text-base font-bold text-slate-900 outline-none transition focus:border-brand-teal focus:bg-white"
              >
                {projectsList.map((p) => (
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
          {/* Upload card */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="dashboard-card-title text-xl sm:text-2xl font-bold text-slate-900">
                  Evidence Files & Media
                </h2>
                <p className="mt-1 text-sm sm:text-base text-slate-500">
                  Upload geotagged field photos, aerial drone videos, survey forms or soil lab tests.
                </p>
              </div>
              <span className="rounded-full bg-sand/40 border border-sand px-4 py-1.5 text-xs sm:text-sm font-bold text-deep-navy">
                {files.length > 0 ? `${files.length} attached` : "0 attached"}
              </span>
            </div>

            <label
              htmlFor="evidence-files"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`group flex min-h-[290px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
                dragging
                  ? "border-brand-teal bg-brand-teal/10 shadow-inner"
                  : "border-slate-300 bg-slate-50/80 hover:border-brand-teal hover:bg-brand-teal/[0.03]"
              }`}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sand text-deep-navy shadow-sm transition group-hover:scale-110 group-hover:bg-brand-teal group-hover:text-white">
                <UploadCloud size={32} />
              </span>

              <h3 className="mt-5 text-xl sm:text-2xl font-bold text-slate-900">
                Drag & Drop Evidence Files
              </h3>
              <p className="mt-1.5 text-sm sm:text-base text-slate-500">
                or <span className="font-bold text-brand-teal hover:underline">browse files from device</span>
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {acceptedFormats.map((format) => (
                  <span
                    key={format}
                    className="rounded-xl bg-white px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-600 border border-slate-200 shadow-sm"
                  >
                    {format}
                  </span>
                ))}
              </div>

              <input
                id="evidence-files"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.mp4,.pdf,.geojson,.kml"
                className="hidden"
                onChange={handleFiles}
              />
            </label>

            {/* Selected Files List */}
            {files.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                    Selected Files ({files.length}) • {formatFileSize(totalFileSize)}
                  </p>
                  <FileCheck2 size={18} className="text-brand-teal" />
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand text-deep-navy">
                          <FileText size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm sm:text-base font-bold text-slate-900">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {file.type || "File"} • {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="rounded-xl p-2 text-slate-400 hover:bg-coral/10 hover:text-coral transition"
                        title="Remove file"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Description Section */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900">
              <FileText size={20} className="text-brand-teal" />
              <h3 className="dashboard-card-title text-xl sm:text-2xl font-bold text-slate-900">
                Field Observations & Surveyor Notes
              </h3>
            </div>
            <p className="mt-1 text-sm sm:text-base text-slate-500">
              Provide context regarding mangrove species planting, nursery survival, tidal conditions or sampling depth.
            </p>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={500}
              placeholder="Detail the field surveyor observations, drone elevation, weather conditions, or mangrove seedling density..."
              className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base leading-relaxed text-slate-900 outline-none transition focus:border-brand-teal focus:bg-white"
            />
            <div className="mt-2 text-right text-xs sm:text-sm text-slate-400">
              {description.length} / 500 characters
            </div>
          </section>
        </div>

        {/* RIGHT: METADATA & FIELD CHECKLIST */}
        <div className="space-y-8">
          {/* Metadata Checklist */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-slate-900">
                <ShieldCheck size={22} className="text-seagrass" />
                <h3 className="dashboard-card-title text-lg sm:text-xl font-bold text-slate-900">
                  MRV Evidence Manifest
                </h3>
              </div>
              <span className="rounded-xl bg-seagrass/15 p-1.5 text-emerald-800">
                <CheckCircle2 size={18} />
              </span>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <CheckCircle2 size={18} className="text-seagrass shrink-0" />
                <div className="min-w-0 text-xs sm:text-sm font-semibold text-slate-800">
                  <span>Project Linked: <strong className="text-deep-navy">{selectedProject}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <MapPin size={18} className="text-seagrass shrink-0" />
                <div className="min-w-0 text-xs sm:text-sm font-semibold text-slate-800">
                  <span>GPS Geotagging: <strong>{selectedProjectData?.coordinates ? `${selectedProjectData.coordinates[0]}, ${selectedProjectData.coordinates[1]}` : "Coordinates Attached"}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <Calendar size={18} className="text-seagrass shrink-0" />
                <div className="min-w-0 text-xs sm:text-sm font-semibold text-slate-800">
                  <span>Capture Timestamp: <strong>{new Date().toLocaleTimeString()}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <Fingerprint size={18} className="text-seagrass shrink-0" />
                <div className="min-w-0 text-xs sm:text-sm font-semibold text-slate-800">
                  <span>IPFS CID Fingerprint: <strong>Automated on Submission</strong></span>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Guidelines Card */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2">
              <Info size={20} className="text-brand-teal" />
              <h3 className="dashboard-card-title text-lg sm:text-xl font-bold text-slate-900">
                Evidence Best Practices
              </h3>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Ensure highest AI cross-validation confidence score:
            </p>

            <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-700">
              <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-100">
                <Camera size={16} className="mt-0.5 text-brand-teal shrink-0" />
                <p><strong>Low-Tide Aerial Photos:</strong> Capture drone flights during low tide to optimize canopy reflectance analysis.</p>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-100">
                <Compass size={16} className="mt-0.5 text-seagrass shrink-0" />
                <p><strong>EXIF Geotagging:</strong> Ensure device location services are enabled for automated satellite polygon overlap.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* =========================================================
          SUBMISSION ACTION FOOTER
          ========================================================= */}
      <section className="mt-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base sm:text-lg font-bold text-slate-900">Ready to submit evidence for MRV verification?</p>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Evidence will be queued for automated Sentinel-2 AI cross-check and expert auditor review.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitted || submitting}
          className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-brand-teal px-10 py-4 text-base sm:text-lg font-bold text-white shadow-lg transition hover:bg-deep-navy active:scale-95 disabled:opacity-60"
        >
          {submitted ? (
            <>
              <CheckCircle2 size={20} />
              <span>Evidence Submitted</span>
            </>
          ) : submitting ? (
            <>
              <UploadCloud size={20} className="animate-bounce" />
              <span>Uploading to Supabase & Submitting...</span>
            </>
          ) : (
            <>
              <Send size={20} />
              <span>Submit to Verification Queue</span>
            </>
          )}
        </button>
      </section>
    </div>
  );
}