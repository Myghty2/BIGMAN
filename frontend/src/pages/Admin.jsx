import { useMemo, useState } from "react";
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
} from "lucide-react";
import { projects } from "../data/mockData";

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

  const storedStatuses = getStored(STATUS_KEY, {});
  const evidence = getStored("blueguard_evidence", []);
  const verificationRecords = getStored(VERIFICATION_KEY, []);

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
    ? evidence.filter((item) => item.projectId === selectedProject.id)
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
          : "Evidence Required",

      risk: selectedProject.risk,

      aiConfidence: selectedProject.aiConfidence,

      evidenceScore: selectedProject.evidenceScore,

      verifiedAt: decision === "Approve" ? timestamp : null,

      verifiedBy: "BlueGuard Admin",

      verificationHash,
    };

    saveStored(STATUS_KEY, currentStatuses);

    auditLog.push({
      id: `AUD-${Date.now()}`,
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      action:
        decision === "Approve"
          ? "Project Approved"
          : decision === "Reject"
          ? "Project Rejected"
          : "Additional Evidence Requested",
      performedBy: "BlueGuard Admin",
      remarks,
      timestamp,
    });

    saveStored(AUDIT_KEY, auditLog);

    if (decision === "Approve") {
      currentVerifications.push({
        id: `VER-${Date.now()}`,
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        status: "Verified",
        verifiedBy: "BlueGuard Admin",
        verifiedAt: timestamp,
        blockchainHash: verificationHash,
        aiConfidence: selectedProject.aiConfidence,
        evidenceScore: selectedProject.evidenceScore,
      });

      saveStored(VERIFICATION_KEY, currentVerifications);
    }

    alert(
      decision === "Approve"
        ? "Project approved and verification record created."
        : decision === "Reject"
        ? "Project rejected."
        : "Additional evidence requested."
    );

    closeReview();
    setRefresh((value) => value + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
              <ShieldCheck size={17} />
              ADMINISTRATION & VERIFICATION
            </div>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              BlueGuard Verification Center
            </h1>

            <p className="mt-2 max-w-2xl text-slate-600">
              Review project evidence, evaluate automated analysis and make the
              final verification decision.
            </p>
          </div>

          <button
            onClick={() => setRefresh((value) => value + 1)}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
          title="High Risk"
          value={highRisk.length}
          icon={AlertTriangle}
          type="danger"
        />

        <Stat
          title="Blockchain Records"
          value={verificationRecords.length}
          icon={Fingerprint}
          type="info"
        />
      </div>

      {/* MAIN */}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
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
                title="Evidence Collection"
                text={`${evidence.length} evidence records`}
              />

              <PipelineItem
                icon={Brain}
                title="Automated Analysis"
                text="AI + consistency checks"
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
              Automated analysis provides evidence and risk indicators.
              The final approval decision remains with the authorized
              BlueGuard administrator.
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

      {/* REVIEW MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Project Review
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

                {/* EVIDENCE */}
                <div className="mt-6 rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">
                      Submitted Evidence
                    </h3>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {projectEvidence.length} files
                    </span>
                  </div>

                  {projectEvidence.length === 0 ? (
                    <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                      No uploaded evidence is currently linked to this
                      project.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {projectEvidence.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                        >
                          <FileText
                            size={18}
                            className="text-emerald-600"
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {item.files?.[0]?.name || item.id}
                            </p>

                            <p className="text-xs text-slate-500">
                              {item.evidenceType} •{" "}
                              {item.status || "Pending"}
                            </p>
                          </div>
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
                    Review the available evidence before making the final
                    decision.
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

                  <p className="mt-2 text-sm leading-5 text-emerald-800">
                    When approved, this project's verification result will
                    generate a unique verification hash ready for blockchain
                    recording.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Stat({ title, value, icon: Icon, type }) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>

        <div className={`rounded-xl p-3 ${styles[type]}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function ProjectRow({ project, onReview }) {
  const statusStyle =
    project.verificationStatus === "Approved"
      ? "bg-emerald-50 text-emerald-700"
      : project.verificationStatus === "Rejected"
      ? "bg-red-50 text-red-700"
      : "bg-amber-50 text-amber-700";

  return (
    <div className="p-5 transition hover:bg-slate-50">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <ShieldCheck size={21} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-slate-900">
                {project.name}
              </h3>

              <span className="text-xs font-semibold text-slate-400">
                {project.id}
              </span>
            </div>

            <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
              <MapPin size={14} />
              {project.location}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle}`}>
                {project.verificationStatus}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                AI {project.aiConfidence}%
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Risk: {project.risk}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onReview}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Review
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function PipelineItem({ icon: Icon, title, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-white/10 p-2 text-emerald-400">
        <Icon size={16} />
      </div>

      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-slate-400">{text}</p>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={16} />
        <span className="text-xs font-semibold">{label}</span>
      </div>

      <p className="mt-2 break-words text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Analysis({ label, value, good }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-600">{label}</p>

      <p
        className={`mt-2 text-xl font-bold ${
          good ? "text-emerald-700" : "text-amber-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function DecisionButton({
  active,
  onClick,
  icon: Icon,
  title,
  description,
  type,
}) {
  const styles = {
    success: active
      ? "border-emerald-500 bg-emerald-50"
      : "border-slate-200 hover:border-emerald-300",

    warning: active
      ? "border-amber-500 bg-amber-50"
      : "border-slate-200 hover:border-amber-300",

    danger: active
      ? "border-red-500 bg-red-50"
      : "border-slate-200 hover:border-red-300",
  };

  const iconStyles = {
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  };

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${styles[type]}`}
    >
      <Icon size={20} className={iconStyles[type]} />

      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>

        <p className="mt-0.5 text-xs text-slate-600">
          {description}
        </p>
      </div>
    </button>
  );
}