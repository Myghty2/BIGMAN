import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MapPin,
  ArrowRight,
  Plus,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Building2,
  Satellite,
  Activity,
  FileCheck2,
  Leaf,
  Globe2,
  CalendarDays,
  UserRound,
} from "lucide-react";
import { projects as initialProjects } from "../data/mockData";

const STORAGE_KEY = "blueguard_projects";

function loadProjects() {
  try {
    const savedProjects = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!Array.isArray(savedProjects)) return initialProjects || [];

    const projectMap = new Map(
      [...(initialProjects || []), ...savedProjects].map((project) => [
        project.id,
        project,
      ])
    );

    return [...projectMap.values()];
  } catch {
    return initialProjects || [];
  }
}

export default function Projects() {
  const location = useLocation();
  const navigate = useNavigate();
  const [projectList, setProjectList] = useState(loadProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: "",
    type: "Mangrove Restoration",
    organization: "",
    location: "",
    latitude: "",
    longitude: "",
    area: "",
    startDate: "",
    expectedEndDate: "",
    monitoringFrequency: "Monthly",
    description: "",
  });

  const [errors, setErrors] = useState({});

  const totalArea = useMemo(() => {
    return projectList.reduce((sum, project) => {
      const value = parseFloat(
        String(project.area || "").replace(/[^0-9.]/g, "")
      );

      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
  }, [projectList]);

  const verifiedCount = projectList.filter(
    (project) => project.status === "Verified"
  ).length;

  const monitoringCount = projectList.filter(
    (project) => project.status === "Monitoring"
  ).length;

  const finishedCount = projectList.filter(
    (project) => project.status === "Finished"
  ).length;

  const averageProgress =
    projectList.length > 0
      ? Math.round(
          projectList.reduce(
            (sum, project) => sum + Number(project.progress || 0),
            0
          ) / projectList.length
        )
      : 0;

  const visibleProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return projectList.filter((project) => {
      const matchesStatus =
        statusFilter === "All" || project.status === statusFilter;
      const matchesQuery =
        !query ||
        [project.name, project.location, project.id, project.organization]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      return matchesStatus && matchesQuery;
    });
  }, [projectList, searchQuery, statusFilter]);

  const openModal = () => {
    setStep(1);
    setErrors({});
    setForm({
      name: "",
      type: "Mangrove Restoration",
      organization: "",
      location: "",
      latitude: "",
      longitude: "",
      area: "",
      startDate: "",
      expectedEndDate: "",
      monitoringFrequency: "Monthly",
      description: "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setStep(1);
    setErrors({});
  };

  useEffect(() => {
    if (new URLSearchParams(location.search).get("new") === "true") {
      openModal();
      navigate("/projects", { replace: true });
    }
  }, [location.search, navigate]);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateStep = () => {
    const nextErrors = {};

    if (step === 1) {
      if (!form.name.trim()) {
        nextErrors.name = "Project name is required.";
      }

      if (!form.organization.trim()) {
        nextErrors.organization = "Responsible organization is required.";
      }
    }

    if (step === 2) {
      if (!form.location.trim()) {
        nextErrors.location = "Project location is required.";
      }

      if (!form.latitude.trim()) {
        nextErrors.latitude = "Latitude is required.";
      }

      if (!form.longitude.trim()) {
        nextErrors.longitude = "Longitude is required.";
      }

      if (!form.area.trim()) {
        nextErrors.area = "Project area is required.";
      }
    }

    if (step === 3) {
      if (!form.startDate) {
        nextErrors.startDate = "Start date is required.";
      }

      if (!form.monitoringFrequency) {
        nextErrors.monitoringFrequency =
          "Monitoring frequency is required.";
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) return;

    setStep((current) => Math.min(current + 1, 4));
  };

  const previousStep = () => {
    setErrors({});
    setStep((current) => Math.max(current - 1, 1));
  };

  const createProject = () => {
    const projectId = `BG-${String(
      Math.max(
        0,
        ...projectList.map((project) => Number(project.id?.split("-")[1]) || 0)
      ) + 1
    ).padStart(3, "0")}`;

    const newProject = {
      id: projectId,
      name: form.name.trim(),
      location: form.location.trim(),
      area: `${form.area} ha`,
      carbon: "Pending assessment",
      progress: 0,
      status: "Under Review",
      type: form.type,
      organization: form.organization.trim(),
      coordinates: [
        Number(form.latitude),
        Number(form.longitude),
      ],
      startDate: form.startDate,
      expectedEndDate: form.expectedEndDate,
      monitoringFrequency: form.monitoringFrequency,
      description: form.description.trim(),
    };

    const updatedProjects = [...projectList, newProject];

    setProjectList(updatedProjects);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedProjects)
    );

    setStep(4);
  };

  const markFinished = (projectId) => {
    const updatedProjects = projectList.map((project) =>
      project.id === projectId
        ? { ...project, status: "Finished", progress: 100 }
        : project
    );

    setProjectList(updatedProjects);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
  };

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-8">
      {/* HEADER */}
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50">
              <Leaf size={17} />
            </span>

            BLUEGUARD REGISTRY
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950 lg:text-4xl">
            Restoration Projects
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Discover, manage and monitor environmental projects before they
            move through BlueGuard&apos;s evidence, geospatial, satellite and
            verification pipeline.
          </p>
        </div>

        {/* THIS IS THE IMPORTANT FIX */}
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-teal px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-deep-navy active:scale-[0.98]"
        >
          <Plus size={19} />
          New Project
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<Building2 size={19} />}
          label="Total Projects"
          value={projectList.length}
          description="Registered projects"
        />

        <SummaryCard
          icon={<Check size={19} />}
          label="Verified"
          value={verifiedCount}
          description="Passed verification"
        />

        <SummaryCard
          icon={<MapPin size={19} />}
          label="Finished"
          value={finishedCount}
          description="Restoration complete"
          highlight
        />
      </div>

      {/* SEARCH / FILTER BAR */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Globe2 size={19} className="text-emerald-600" />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search projects, locations or IDs..."
                aria-label="Search projects"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {["All", "Verified", "Under Review", "Monitoring", "Finished"].map(
              (status) => (
                <FilterButton
                  key={status}
                  active={statusFilter === status}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </FilterButton>
              )
            )}
          </div>
        </div>
      </div>

      {/* PROJECT GRID */}
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {visibleProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onFinish={markFinished}
          />
        ))}

        {visibleProjects.length === 0 && (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center lg:col-span-2 xl:col-span-3">
            <Globe2 size={28} className="text-emerald-600" />
            <h3 className="mt-3 text-lg font-bold text-slate-900">
              No projects found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try a different search or change the project status filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("All");
              }}
              className="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* CREATE CARD */}
        <button
          type="button"
          onClick={openModal}
          className="group flex min-h-[350px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 text-center transition hover:border-emerald-300 hover:bg-emerald-50/30"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition group-hover:scale-105 group-hover:bg-emerald-100">
            <Plus size={27} />
          </span>

          <h3 className="mt-4 text-lg font-bold text-slate-900">
            Register New Project
          </h3>

          <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
            Add a restoration project to the BlueGuard verification and
            monitoring pipeline.
          </p>
        </button>
      </div>

      {/* REGISTRATION MODAL */}
      {showModal && (
        <ProjectRegistrationModal
          step={step}
          form={form}
          errors={errors}
          onClose={closeModal}
          onChange={updateField}
          onNext={nextStep}
          onPrevious={previousStep}
          onCreate={createProject}
          onFinish={closeModal}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SUMMARY CARD                                                               */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  icon,
  label,
  value,
  description,
  highlight = false,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>

          <p
            className={`mt-3 text-2xl font-bold ${
              highlight ? "text-emerald-600" : "text-slate-950"
            }`}
          >
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FILTER BUTTON                                                              */
/* -------------------------------------------------------------------------- */

function FilterButton({ children, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        active
              ? "bg-brand-teal text-white"
          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* PROJECT CARD                                                               */
/* -------------------------------------------------------------------------- */

function ProjectCard({ project, onFinish }) {
  const statusClass =
    project.status === "Verified"
      ? "bg-seagrass/15 text-seagrass"
    : project.status === "Monitoring"
      ? "bg-brand-teal/10 text-brand-teal"
      : project.status === "Finished"
      ? "bg-sand text-deep-navy"
      : "bg-amber-50 text-amber-700";

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="h-1 bg-gradient-to-r from-brand-teal to-seagrass" />

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold tracking-wide text-slate-400">
            {project.id}
          </span>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
          >
            {project.status}
          </span>
        </div>

        <h3 className="mt-5 text-xl font-bold text-slate-950">
          {project.name}
        </h3>

        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin size={15} className="text-emerald-600" />
          {project.location}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Area</p>

            <p className="mt-1 font-bold text-slate-800">
              {project.area}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Carbon</p>

            <p className="mt-1 font-bold text-slate-800">
              {project.carbon}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-slate-500">
              Restoration progress
            </span>

            <strong className="text-slate-700">
              {project.progress || 0}%
            </strong>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-seagrass transition-all"
              style={{
                width: `${project.progress || 0}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            to={`/projects/${project.id}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-teal hover:bg-sand/30 hover:text-brand-teal"
          >
            View
            <ArrowRight size={16} />
          </Link>
          {project.status !== "Finished" ? (
            <button
              type="button"
              onClick={() => onFinish(project.id)}
              className="rounded-xl bg-seagrass px-3 py-3 text-sm font-semibold text-white transition hover:bg-brand-teal"
            >
              Mark finished
            </button>
          ) : (
            <span className="flex items-center justify-center rounded-xl bg-sand px-3 py-3 text-sm font-semibold text-deep-navy">
              Complete
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PROJECT REGISTRATION MODAL                                                 */
/* -------------------------------------------------------------------------- */

function ProjectRegistrationModal({
  step,
  form,
  errors,
  onClose,
  onChange,
  onNext,
  onPrevious,
  onCreate,
  onFinish,
}) {
  const steps = [
    {
      number: 1,
      label: "Basics",
      icon: <Building2 size={17} />,
    },
    {
      number: 2,
      label: "Site",
      icon: <MapPin size={17} />,
    },
    {
      number: 3,
      label: "Monitoring",
      icon: <Satellite size={17} />,
    },
    {
      number: 4,
      label: "Review",
      icon: <FileCheck2 size={17} />,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* MODAL HEADER */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 lg:px-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Plus size={22} />
            </div>

            <div>
              <p className="text-sm font-bold tracking-wide text-emerald-700">
                PROJECT REGISTRATION
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-950">
                Create a BlueGuard Project
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Register the project so it can enter the evidence,
                geospatial, monitoring and verification pipeline.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={22} />
          </button>
        </div>

        {/* STEPPER */}
        <div className="border-b border-slate-200 px-6 py-5 lg:px-8">
          <div className="flex items-center justify-between">
            {steps.map((item, index) => (
              <div
                key={item.number}
                className="flex flex-1 items-center"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      step >= item.number
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {step > item.number ? (
                      <Check size={17} />
                    ) : (
                      item.number
                    )}
                  </div>

                  <span
                    className={`hidden text-sm font-semibold sm:block ${
                      step >= item.number
                        ? "text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                {index !== steps.length - 1 && (
                  <div
                    className={`mx-3 h-px flex-1 ${
                      step > item.number
                        ? "bg-emerald-500"
                        : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto px-6 py-7 lg:px-8">
          {step === 1 && (
            <StepBasics
              form={form}
              errors={errors}
              onChange={onChange}
            />
          )}

          {step === 2 && (
            <StepSite
              form={form}
              errors={errors}
              onChange={onChange}
            />
          )}

          {step === 3 && (
            <StepMonitoring
              form={form}
              errors={errors}
              onChange={onChange}
            />
          )}

          {step === 4 && (
            <StepReview
              form={form}
              onEdit={(targetStep) => {
                // This is intentionally handled by the parent navigation
                // buttons below through the Previous button.
                void targetStep;
              }}
            />
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 lg:px-8">
          <button
            type="button"
            onClick={step === 1 ? onClose : onPrevious}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            {step === 1 ? (
              "Cancel"
            ) : (
              <>
                <ChevronLeft size={17} />
                Back
              </>
            )}
          </button>

          {step < 3 && (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Continue
              <ChevronRight size={17} />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={() => {
                if (!validateMonitoringStep(form, errors, onChange)) {
                  return;
                }

                onCreate();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Review Project
              <ChevronRight size={17} />
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={onFinish}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Check size={17} />
              Finish Registration
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* STEP 1                                                                      */
/* -------------------------------------------------------------------------- */

function StepBasics({ form, errors, onChange }) {
  return (
    <div>
      <p className="text-sm font-bold tracking-wide text-emerald-700">
        STEP 01
      </p>

      <h3 className="mt-2 text-2xl font-bold text-slate-950">
        Project identity
      </h3>

      <p className="mt-2 text-slate-500">
        Tell BlueGuard what this project is and who is responsible
        for it.
      </p>

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <Input
          label="Project name"
          required
          placeholder="e.g. Mumbai Mangrove Revival"
          value={form.name}
          error={errors.name}
          onChange={(value) => onChange("name", value)}
          full
        />

        <Select
          label="Project type"
          value={form.type}
          onChange={(value) => onChange("type", value)}
          options={[
            "Mangrove Restoration",
            "Seagrass Restoration",
            "Wetland Restoration",
            "Coastal Restoration",
            "Blue Carbon Conservation",
            "Other",
          ]}
        />

        <Input
          label="Responsible organization"
          required
          placeholder="Foundation / NGO / Organization"
          value={form.organization}
          error={errors.organization}
          onChange={(value) => onChange("organization", value)}
        />

        <Input
          label="Project description"
          placeholder="Briefly describe the restoration project"
          value={form.description}
          onChange={(value) => onChange("description", value)}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* STEP 2                                                                      */
/* -------------------------------------------------------------------------- */

function StepSite({ form, errors, onChange }) {
  return (
    <div>
      <p className="text-sm font-bold tracking-wide text-emerald-700">
        STEP 02
      </p>

      <h3 className="mt-2 text-2xl font-bold text-slate-950">
        Project site
      </h3>

      <p className="mt-2 text-slate-500">
        Define the geographic location that BlueGuard will use for
        geospatial and satellite monitoring.
      </p>

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <Input
          label="Project location"
          required
          placeholder="e.g. Sundarbans, West Bengal, India"
          value={form.location}
          error={errors.location}
          onChange={(value) => onChange("location", value)}
          full
        />

        <Input
          label="Project area (hectares)"
          required
          type="number"
          placeholder="e.g. 125"
          value={form.area}
          error={errors.area}
          onChange={(value) => onChange("area", value)}
        />

        <Input
          label="Latitude"
          required
          type="number"
          placeholder="e.g. 21.9497"
          value={form.latitude}
          error={errors.latitude}
          onChange={(value) => onChange("latitude", value)}
        />

        <Input
          label="Longitude"
          required
          type="number"
          placeholder="e.g. 89.1833"
          value={form.longitude}
          error={errors.longitude}
          onChange={(value) => onChange("longitude", value)}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
        <div className="flex gap-3">
          <MapPin className="mt-0.5 shrink-0 text-emerald-600" size={20} />

          <div>
            <p className="font-semibold text-emerald-900">
              Geospatial monitoring
            </p>

            <p className="mt-1 text-sm leading-6 text-emerald-800/70">
              These coordinates will be associated with the project
              and can later be used for satellite imagery, boundary
              analysis and monitoring points.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* STEP 3                                                                      */
/* -------------------------------------------------------------------------- */

function StepMonitoring({ form, errors, onChange }) {
  return (
    <div>
      <p className="text-sm font-bold tracking-wide text-emerald-700">
        STEP 03
      </p>

      <h3 className="mt-2 text-2xl font-bold text-slate-950">
        Monitoring configuration
      </h3>

      <p className="mt-2 text-slate-500">
        Configure the initial monitoring schedule and project
        timeline.
      </p>

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <Input
          label="Project start date"
          required
          type="date"
          value={form.startDate}
          error={errors.startDate}
          onChange={(value) => onChange("startDate", value)}
        />

        <Input
          label="Expected completion date"
          type="date"
          value={form.expectedEndDate}
          onChange={(value) => onChange("expectedEndDate", value)}
        />

        <Select
          label="Monitoring frequency"
          value={form.monitoringFrequency}
          error={errors.monitoringFrequency}
          onChange={(value) =>
            onChange("monitoringFrequency", value)
          }
          options={[
            "Weekly",
            "Bi-weekly",
            "Monthly",
            "Quarterly",
            "Semi-annually",
          ]}
        />
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <InfoBox
          icon={<Satellite size={19} />}
          title="Satellite"
          text="Remote sensing analysis"
        />

        <InfoBox
          icon={<Activity size={19} />}
          title="Change Detection"
          text="Track restoration changes"
        />

        <InfoBox
          icon={<FileCheck2 size={19} />}
          title="Verification"
          text="Evidence-based review"
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* STEP 4                                                                      */
/* -------------------------------------------------------------------------- */

function StepReview({ form }) {
  return (
    <div>
      <p className="text-sm font-bold tracking-wide text-emerald-700">
        STEP 04
      </p>

      <h3 className="mt-2 text-2xl font-bold text-slate-950">
        Review project
      </h3>

      <p className="mt-2 text-slate-500">
        Review the information before registering the project.
      </p>

      <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200">
        <ReviewRow
          icon={<Building2 size={18} />}
          label="Project"
          value={form.name || "Not provided"}
        />

        <ReviewRow
          icon={<Leaf size={18} />}
          label="Project type"
          value={form.type}
        />

        <ReviewRow
          icon={<UserRound size={18} />}
          label="Organization"
          value={form.organization || "Not provided"}
        />

        <ReviewRow
          icon={<MapPin size={18} />}
          label="Location"
          value={form.location || "Not provided"}
        />

        <ReviewRow
          icon={<Globe2 size={18} />}
          label="Coordinates"
          value={
            form.latitude && form.longitude
              ? `${form.latitude}, ${form.longitude}`
              : "Not provided"
          }
        />

        <ReviewRow
          icon={<Activity size={18} />}
          label="Area"
          value={form.area ? `${form.area} ha` : "Not provided"}
        />

        <ReviewRow
          icon={<CalendarDays size={18} />}
          label="Start date"
          value={form.startDate || "Not provided"}
        />

        <ReviewRow
          icon={<Satellite size={18} />}
          label="Monitoring"
          value={form.monitoringFrequency}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
        <div className="flex gap-3">
          <Check className="mt-0.5 shrink-0 text-emerald-600" size={20} />

          <div>
            <p className="font-semibold text-emerald-900">
              Ready for registration
            </p>

            <p className="mt-1 text-sm leading-6 text-emerald-800/70">
              After registration, the project will appear in the
              BlueGuard registry with an initial status of
              <strong> Under Review</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* INPUT                                                                       */
/* -------------------------------------------------------------------------- */

function Input({
  label,
  required = false,
  placeholder,
  value,
  error,
  onChange,
  type = "text",
  full = false,
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-emerald-600">*</span>
        )}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition ${
          error
            ? "border-red-300 focus:border-red-500"
            : "border-slate-200 focus:border-emerald-500"
        }`}
      />

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SELECT                                                                      */
/* -------------------------------------------------------------------------- */

function Select({
  label,
  value,
  onChange,
  options,
  error,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition ${
          error
            ? "border-red-300"
            : "border-slate-200 focus:border-emerald-500"
        }`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* INFO BOX                                                                    */
/* -------------------------------------------------------------------------- */

function InfoBox({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        {icon}
      </div>

      <p className="mt-3 text-sm font-bold text-slate-800">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">{text}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* REVIEW ROW                                                                  */
/* -------------------------------------------------------------------------- */

function ReviewRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-100 p-4 last:border-b-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MONITORING VALIDATION                                                       */
/* -------------------------------------------------------------------------- */

function validateMonitoringStep(form, errors, onChange) {
  if (!form.startDate) {
    onChange("startDate", form.startDate);
    return false;
  }

  return true;
}
