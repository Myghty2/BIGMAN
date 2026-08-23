import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  CheckCircle2,
  MapPin,
  Calendar,
  FileText,
  Send,
} from "lucide-react";
import { projects } from "../data/mockData";

export default function Evidence() {
  const navigate = useNavigate();

  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || "");
  const [evidenceType, setEvidenceType] = useState("Restoration Progress");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const selectedProjectData = projects.find(
    (project) => project.id === selectedProject
  );

  const handleFiles = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const handleSubmit = () => {
    if (!selectedProject || files.length === 0) {
      alert("Please select a project and upload at least one evidence file.");
      return;
    }

    const existingEvidence = JSON.parse(
      localStorage.getItem("blueguard_evidence") || "[]"
    );

    const evidenceId = `EV-${1042 + existingEvidence.length + 1}`;

    const evidenceRecord = {
      id: evidenceId,
      projectId: selectedProject,
      projectName: selectedProjectData?.name || "Unknown Project",
      evidenceType,
      description,
      capturedAt: new Date().toISOString(),
      gpsCoordinates: selectedProjectData?.coordinates || null,

      // Mock file metadata.
      // Actual file storage will be handled by the backend later.
      files: files.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      })),

      uploadedBy: "Current Organization",
      status: "Pending Verification",
    };

    localStorage.setItem(
      "blueguard_evidence",
      JSON.stringify([...existingEvidence, evidenceRecord])
    );

    setSubmitted(true);

    setTimeout(() => {
      navigate("/verification");
    }, 700);
  };

  return (
    <div className="p-6 lg:p-8">
      <p className="text-sm font-medium text-emerald-600">
        EVIDENCE COLLECTION
      </p>

      <h2 className="mt-1 text-3xl font-bold">Upload Evidence</h2>

      <p className="mt-2 text-slate-500">
        Submit geo-tagged photos, videos and documents for project verification.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Main Evidence Form */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
          <div className="grid gap-5 md:grid-cols-2">
            {/* Project */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Project
              </label>

              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Evidence Type */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Evidence Type
              </label>

              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option>Restoration Progress</option>
                <option>Plantation Activity</option>
                <option>Site Condition</option>
                <option>Community Activity</option>
                <option>Monitoring Evidence</option>
                <option>Project Document</option>
              </select>
            </div>
          </div>

          {/* Location */}
          {selectedProjectData && (
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <MapPin className="text-emerald-600" size={20} />

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Project Location
                </p>

                <p className="text-sm font-semibold text-slate-800">
                  {selectedProjectData.location}
                </p>

                <p className="text-xs text-slate-500">
                  GPS: {selectedProjectData.coordinates[0]},{" "}
                  {selectedProjectData.coordinates[1]}
                </p>
              </div>
            </div>
          )}

          {/* Upload */}
          <label className="mt-6 flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 p-8 text-center transition hover:bg-emerald-50">
            <UploadCloud size={46} className="text-emerald-600" />

            <h3 className="mt-4 text-lg font-semibold">
              Drop files here or click to browse
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              JPG, PNG, MP4 or PDF
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Demo storage only — actual file storage comes with the backend.
            </p>

            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.mp4,.pdf"
              className="hidden"
              onChange={handleFiles}
            />
          </label>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-sm font-semibold text-slate-700">
                Selected Evidence
              </p>

              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText
                      size={18}
                      className="shrink-0 text-slate-500"
                    />

                    <span className="truncate">{file.name}</span>
                  </div>

                  <CheckCircle2
                    className="shrink-0 text-emerald-600"
                    size={18}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Evidence Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe what this evidence shows..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitted}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitted ? (
              <>
                <CheckCircle2 size={18} />
                Evidence Submitted
              </>
            ) : (
              <>
                <Send size={18} />
                Submit Evidence
              </>
            )}
          </button>
        </div>

        {/* Checklist */}
        <div className="rounded-2xl bg-ocean p-6 text-white">
          <h3 className="font-semibold">Evidence checklist</h3>

          <p className="mt-2 text-sm text-slate-400">
            BlueGuard records these fields for every submission.
          </p>

          <ul className="mt-6 space-y-5 text-sm text-slate-300">
            <li className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-400" />
              Project ID attached
            </li>

            <li className="flex items-center gap-3">
              <Calendar size={18} className="text-emerald-400" />
              Capture date & time
            </li>

            <li className="flex items-center gap-3">
              <MapPin size={18} className="text-emerald-400" />
              GPS location
            </li>

            <li className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-400" />
              Uploader identity
            </li>

            <li className="flex items-center gap-3">
              <FileText size={18} className="text-emerald-400" />
              Evidence metadata
            </li>
          </ul>

          {selectedProjectData && (
            <div className="mt-8 rounded-xl bg-white/10 p-4">
              <p className="text-xs text-slate-400">Selected Project</p>

              <p className="mt-1 font-semibold">
                {selectedProjectData.name}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {selectedProjectData.area} • {selectedProjectData.status}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}