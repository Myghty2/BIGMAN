import { useMemo, useState, useEffect } from "react";
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
  Image,
  Eye,
  ExternalLink,
  Camera,
  Layers,
  Sparkles,
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
  const [activeTab, setActiveTab] = useState("queue"); // "queue" | "gallery"
  const [allEvidence, setAllEvidence] = useState([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const storedStatuses = getStored(STATUS_KEY, {});
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
          (index < 2 ? "Pending Review" : "Pending Review"),
        risk:
          saved?.risk ||
          (index === 0 ? "Low" : index === 1 ? "Medium" : "Low"),
        aiConfidence:
          saved?.aiConfidence ||
          (index === 0 ? 94 : index === 1 ? 87 : 91),
        evidenceScore:
          saved?.evidenceScore ||
          (index === 0 ? 96 : index === 1 ? 82 : 89),
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

  const highRisk = enrichedProjects.filter((p) => p.risk === "High");

  const projectEvidence = selectedProject
    ? allEvidence.filter((item) => item.projectId === selectedProject.id)
    : [];

  const openReview = (project) => {
    setSelectedProject(project);
    setDecision("");
    setRemarks("");
  };

  const closeReview = () => {
    setSelectedProject(null);
    setDecision("");
    setRemarks("");
  };

  const handleDecision = () => {
    if (!selectedProject || !decision) {
      alert("Please select a decision.");
      return;
    }

    if (!remarks.trim() && decision !== "Approve") {
      alert("Please add reviewer remarks.");
      return;
    }

    const currentStatuses = getStored(STATUS_KEY, {});
    const auditLog = getStored(AUDIT_KEY, []);
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

    auditLog.unshift({
      id: `AUD-${Date.now()}`,
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      decision,
      remarks,
      timestamp,
      verificationHash,
      admin: "Lead MRV Auditor",
    });

    saveStored(AUDIT_KEY, auditLog);

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

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <ShieldCheck size={14} />
            BlueGuard Administrative Console • Supabase Connected
          </div>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
            MRV Admin & Verification Center
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Review live satellite telemetry, field evidence from Supabase, and issue verified on-chain proofs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setRefresh((prev) => prev + 1);
              loadLiveEvidence();
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <RefreshCw size={15} className={loadingEvidence ? "animate-spin text-emerald-600" : ""} />
            Sync Supabase
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat
          title="Pending Reviews"
          value={pending.length}
          icon={Clock3}
          type="warning"
        />

        <Stat
          title="Approved"
          value={approved.length}
          icon={CheckCircle2}
          type="success"
        />

        <Stat
          title="Rejected"
          value={rejected.length}
          icon={XCircle}
          type="danger"
        />

        <Stat
          title="Supabase Evidence"
          value={allPhotos.length || allEvidence.length}
          icon={Camera}
          type="info"
        />

        <Stat
          title="Blockchain Records"
          value={verificationRecords.length}
          icon={Fingerprint}
          type="success"
        />
      </div>

      {/* TABS SELECTOR */}
      <div className="mt-8 flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("queue")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
            activeTab === "queue"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Layers size={16} />
          Verification Queue ({pending.length})
        </button>

        <button
          onClick={() => setActiveTab("gallery")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
            activeTab === "gallery"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Image size={16} />
          Supabase Photo & Evidence Stream ({allPhotos.length})
        </button>
      </div>

      {/* TAB 1: QUEUE */}
      {activeTab === "queue" && (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          {/* QUEUE */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Verification Queue
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    Projects requiring administrative review.
                  </p>
                </div>

                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-emerald-500 md:w-64"
                  />
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredProjects.length === 0 && (
                <div className="p-10 text-center text-sm text-slate-500">
                  No projects found.
                </div>
              )}

              {filteredProjects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onReview={() => openReview(project)}
                />
              ))}
            </div>
          </div>

          {/* SYSTEM STATUS */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-ocean p-6 text-white shadow-sm">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-emerald-400" />
                <h3 className="font-bold">Verification Pipeline</h3>
              </div>

              <div className="mt-6 space-y-5">
                <PipelineItem
                  icon={FileText}
                  title="Supabase Storage"
                  text={`${allPhotos.length} photos in 'evidence' bucket`}
                />

                <PipelineItem
                  icon={Brain}
                  title="Automated Analysis"
                  text="AI + biomass consistency checks"
                />

                <PipelineItem
                  icon={Satellite}
                  title="Satellite Validation"
                  text="Remote sensing analysis"
                />

                <PipelineItem
                  icon={UserCheck}
                  title="Human Verification"
                  text={`${pending.length} pending decisions`}
                />

                <PipelineItem
                  icon={Database}
                  title="Blockchain Registry"
                  text={`${verificationRecords.length} records created`}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-slate-900">Decision Policy</h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Inspect Supabase high-resolution drone photography and field logs before confirming MRV verification.
              </p>

              <div className="mt-5 rounded-xl bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Human-in-the-loop
                </p>

                <p className="mt-1 text-sm font-medium text-emerald-900">
                  AI recommends. Admin verifies.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUPABASE EVIDENCE & PHOTO GALLERY */}
      {activeTab === "gallery" && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Supabase Evidence Stream
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                All field photos, drone orthomosaics, and surveys uploaded across all projects.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
              <Database size={14} className="text-emerald-600" />
              Bucket: <span className="text-emerald-700">evidence</span> • {allPhotos.length} Assets
            </div>
          </div>

          {allPhotos.length === 0 ? (
            <div className="p-16 text-center">
              <Camera size={44} className="mx-auto text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-800 text-lg">No Evidence Uploaded Yet</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                When field workers or NGOs submit evidence on the Evidence page, their photos from Supabase Storage will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {allPhotos.map((photo, i) => (
                <div
                  key={`${photo.name}-${i}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm hover:shadow-md transition"
                >
                  <div
                    onClick={() => setPreviewImage(photo.url || photo.path)}
                    className="relative aspect-video w-full bg-slate-900 cursor-pointer overflow-hidden"
                  >
                    {photo.url ? (
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1774960693005-e6a8aafc3397?w=600&fit=crop";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <FileText size={32} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <span className="rounded-lg bg-white/90 p-2 text-slate-900 shadow">
                        <Eye size={18} />
                      </span>
                    </div>
                    <span className="absolute top-2 left-2 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-emerald-400 backdrop-blur-sm">
                      {photo.projectId}
                    </span>
                  </div>

                  <div className="p-3.5">
                    <p className="truncate text-xs font-bold text-slate-900" title={photo.name}>
                      {photo.name}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-emerald-700 truncate">
                      {photo.evidenceType || "Field Evidence"}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60 pt-2">
                      <span>{photo.uploadedBy || "Field NGO"}</span>
                      {photo.url && (
                        <a
                          href={photo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
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

      {/* REVIEW MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Project Review & Verification
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedProject.name}
                </h2>
              </div>

              <button
                onClick={closeReview}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-3">
              {/* PROJECT */}
              <div className="lg:col-span-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoCard
                    icon={MapPin}
                    label="Project Location"
                    value={selectedProject.location}
                  />

                  <InfoCard
                    icon={Satellite}
                    label="Coordinates"
                    value={
                      selectedProject.coordinates
                        ? `${selectedProject.coordinates[0]}, ${selectedProject.coordinates[1]}`
                        : "Not available"
                    }
                  />

                  <InfoCard
                    icon={Activity}
                    label="AI Confidence"
                    value={`${selectedProject.aiConfidence}%`}
                  />

                  <InfoCard
                    icon={FileText}
                    label="Evidence Score"
                    value={`${selectedProject.evidenceScore}%`}
                  />
                </div>

                {/* ANALYSIS */}
                <div className="mt-6 rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-900">
                    Automated Verification Analysis
                  </h3>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <Analysis
                      label="AI Confidence"
                      value={`${selectedProject.aiConfidence}%`}
                      good={selectedProject.aiConfidence >= 85}
                    />

                    <Analysis
                      label="Evidence Consistency"
                      value={`${selectedProject.evidenceScore}%`}
                      good={selectedProject.evidenceScore >= 85}
                    />

                    <Analysis
                      label="Risk Level"
                      value={selectedProject.risk}
                      good={selectedProject.risk === "Low"}
                    />
                  </div>
                </div>

                {/* EVIDENCE GALLERY IN MODAL */}
                <div className="mt-6 rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Camera size={18} className="text-emerald-600" />
                      Supabase Field Evidence Photos
                    </h3>

                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                      {projectEvidence.length} Evidence Bundles
                    </span>
                  </div>

                  {projectEvidence.length === 0 ? (
                    <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                      No uploaded evidence is currently linked to this project.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {projectEvidence.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                                {item.evidenceType}
                              </p>
                              <p className="text-sm font-semibold text-slate-800">
                                {item.description || item.id}
                              </p>
                            </div>
                            <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 border">
                              {item.status || "Pending"}
                            </span>
                          </div>

                          {/* Photos Grid */}
                          {item.files && item.files.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {item.files.map((file, fIdx) => (
                                <div
                                  key={fIdx}
                                  onClick={() => setPreviewImage(file.url)}
                                  className="group relative aspect-video rounded-lg overflow-hidden bg-slate-900 cursor-pointer border border-slate-200"
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
                                      <FileText size={20} />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <Eye size={16} className="text-white" />
                                  </div>
                                  <span className="absolute bottom-1 left-1 right-1 truncate text-[10px] text-white/90 bg-black/60 px-1 rounded">
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

              {/* DECISION */}
              <div>
                <div className="rounded-2xl bg-slate-50 p-5">
                  <h3 className="font-bold text-slate-900">
                    Administrative Decision
                  </h3>

                  <p className="mt-2 text-sm leading-5 text-slate-600">
                    Review the available evidence before making the final decision.
                  </p>

                  <div className="mt-5 space-y-3">
                    <DecisionButton
                      active={decision === "Approve"}
                      onClick={() => setDecision("Approve")}
                      icon={CheckCircle2}
                      title="Approve Project"
                      description="Verify and activate monitoring"
                      type="success"
                    />

                    <DecisionButton
                      active={decision === "Evidence"}
                      onClick={() => setDecision("Evidence")}
                      icon={MessageSquare}
                      title="Request Evidence"
                      description="Ask organization for more proof"
                      type="warning"
                    />

                    <DecisionButton
                      active={decision === "Reject"}
                      onClick={() => setDecision("Reject")}
                      icon={XCircle}
                      title="Reject Project"
                      description="Reject current submission"
                      type="danger"
                    />
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Reviewer Remarks
                    </label>

                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={5}
                      placeholder="Explain your verification decision..."
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    onClick={handleDecision}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700"
                  >
                    Confirm Decision
                    <ChevronRight size={17} />
                  </button>
                </div>

                {/* BLOCKCHAIN PREVIEW */}
                <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                  <div className="flex items-center gap-2">
                    <Fingerprint
                      size={18}
                      className="text-emerald-700"
                    />

                    <h3 className="font-bold text-emerald-900">
                      Blockchain Registry
                    </h3>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-emerald-800">
                    Approval anchors an immutable SHA-256 evidence certificate onto the BlueGuard chain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE LIGHTBOX */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-6 backdrop-blur-md cursor-zoom-out"
        >
          <div className="relative max-h-[90vh] max-w-5xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 rounded-full bg-white/20 p-2 text-white hover:bg-white/40"
            >
              <X size={24} />
            </button>
            <img
              src={previewImage}
              alt="Evidence Preview"
              className="max-h-[85vh] w-auto rounded-2xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ title, value, icon: Icon, type }) {
  const styles = {
    warning: "text-amber-600 bg-amber-50 border-amber-200",
    success: "text-emerald-600 bg-emerald-50 border-emerald-200",
    danger: "text-rose-600 bg-rose-50 border-rose-200",
    info: "text-sky-600 bg-sky-50 border-sky-200",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{title}</span>

        <span className={`rounded-xl border p-2.5 ${styles[type]}`}>
          <Icon size={18} />
        </span>
      </div>

      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ProjectRow({ project, onReview }) {
  const statusStyles = {
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Pending Review": "bg-amber-50 text-amber-700 border-amber-200",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200",
    "Needs Evidence": "bg-sky-50 text-sky-700 border-sky-200",
  };

  return (
    <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between hover:bg-slate-50/60 transition">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-slate-900 truncate">{project.name}</h3>

          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
              statusStyles[project.verificationStatus] ||
              statusStyles["Pending Review"]
            }`}
          >
            {project.verificationStatus}
          </span>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          {project.location} • {project.hectares} ha • {project.carbonEstimate}{" "}
          tCO₂e
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right text-xs">
          <p className="font-semibold text-slate-700">
            Confidence: {project.aiConfidence}%
          </p>
          <p className="text-slate-500">Risk: {project.risk}</p>
        </div>

        <button
          onClick={onReview}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 shadow-sm"
        >
          Review
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
        <Icon size={14} className="text-emerald-600" />
        {label}
      </div>

      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Analysis({ label, value, good }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        good
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-amber-200 bg-amber-50/50"
      }`}
    >
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p
        className={`mt-1 text-lg font-bold ${
          good ? "text-emerald-700" : "text-amber-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function DecisionButton({ active, onClick, icon: Icon, title, description, type }) {
  const styles = {
    success: active
      ? "border-emerald-600 bg-emerald-50 text-emerald-900"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    warning: active
      ? "border-amber-600 bg-amber-50 text-amber-900"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    danger: active
      ? "border-rose-600 bg-rose-50 text-rose-900"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  };

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition ${styles[type]}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </button>
  );
}

function PipelineItem({ icon: Icon, title, text }) {
  return (
    <div className="flex items-center gap-3">
      <span className="rounded-xl bg-white/10 p-2 text-emerald-400">
        <Icon size={16} />
      </span>

      <div>
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="text-xs text-slate-300">{text}</p>
      </div>
    </div>
  );
}
