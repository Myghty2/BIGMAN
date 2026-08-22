import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Filter,
  Grid2X2,
  Leaf,
  List,
  MapPin,
  Plus,
  Search,
  Satellite,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Waves,
  X,
} from "lucide-react";

import { projects as seedProjects } from "../data/mockData";

const STORAGE_KEY = "blueguard_projects";

/* =========================================================
   PROJECT STORAGE
========================================================= */

function loadProjects() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return seedProjects;
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return seedProjects;
    }

    const merged = [...seedProjects];

    parsed.forEach((savedProject) => {
      const existingIndex = merged.findIndex(
        (project) => project.id === savedProject.id
      );

      if (existingIndex >= 0) {
        merged[existingIndex] = savedProject;
      } else {
        merged.push(savedProject);
      }
    });

    return merged;
  } catch {
    return seedProjects;
  }
}

function saveProjects(projects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Prototype continues even if storage fails.
  }
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function Projects() {
  const [allProjects, setAllProjects] = useState(loadProjects);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [habitatFilter, setHabitatFilter] = useState("All");

  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");

  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    saveProjects(allProjects);
  }, [allProjects]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const statistics = useMemo(() => {
    const verified = allProjects.filter(
      (project) => project.status === "Verified"
    ).length;

    const monitoring = allProjects.filter(
      (project) => project.status === "Monitoring"
    ).length;

    const review = allProjects.filter(
      (project) => project.status === "Under Review"
    ).length;

    const draft = allProjects.filter(
      (project) => project.status === "Draft"
    ).length;

    const totalArea = allProjects.reduce((total, project) => {
      const value = parseFloat(
        String(project.area || "").replace(/[^\d.]/g, "")
      );

      return total + (Number.isFinite(value) ? value : 0);
    }, 0);

    const totalCarbon = allProjects.reduce((total, project) => {
      const value = parseFloat(
        String(project.carbon || "").replace(/[^\d.]/g, "")
      );

      return total + (Number.isFinite(value) ? value : 0);
    }, 0);

    const averageProgress =
      allProjects.length > 0
        ? Math.round(
            allProjects.reduce(
              (sum, project) => sum + Number(project.progress || 0),
              0
            ) / allProjects.length
          )
        : 0;

    return {
      total: allProjects.length,
      verified,
      monitoring,
      review,
      draft,
      totalArea,
      totalCarbon,
      averageProgress,
    };
  }, [allProjects]);

  /* =========================================================
     FILTER + SEARCH + SORT
  ========================================================= */

  const filteredProjects = useMemo(() => {
    let result = [...allProjects];

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((project) => {
        return (
          project.name?.toLowerCase().includes(query) ||
          project.location?.toLowerCase().includes(query) ||
          project.id?.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query) ||
          project.habitat?.toLowerCase().includes(query) ||
          project.projectType?.toLowerCase().includes(query)
        );
      });
    }

    if (statusFilter !== "All") {
      result = result.filter(
        (project) => project.status === statusFilter
      );
    }

    if (habitatFilter !== "All") {
      result = result.filter((project) => {
        const habitat =
          project.habitat ||
          getHabitatFromType(project.projectType);

        return habitat === habitatFilter;
      });
    }

    result.sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }

      if (sortBy === "progress") {
        return (
          Number(b.progress || 0) -
          Number(a.progress || 0)
        );
      }

      if (sortBy === "area") {
        return (
          getNumber(b.area) -
          getNumber(a.area)
        );
      }

      if (sortBy === "carbon") {
        return (
          getNumber(b.carbon) -
          getNumber(a.carbon)
        );
      }

      return String(b.id || "").localeCompare(
        String(a.id || "")
      );
    });

    return result;
  }, [
    allProjects,
    search,
    statusFilter,
    habitatFilter,
    sortBy,
  ]);

  /* =========================================================
     CREATE PROJECT
  ========================================================= */

  const handleCreateProject = (newProject) => {
    setAllProjects((current) => [
      newProject,
      ...current,
    ]);

    setShowCreateModal(false);
  };

  /* =========================================================
     CLEAR FILTERS
  ========================================================= */

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setHabitatFilter("All");
  };

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-8">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="mb-8">

        <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">

          <div>

            <div className="flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                <Waves
                  size={18}
                  className="text-emerald-600"
                />
              </div>

              <p className="text-sm font-bold tracking-wide text-emerald-700">
                BLUEGUARD REGISTRY
              </p>

            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight !text-slate-900 lg:text-4xl">
              Restoration Projects
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 !text-slate-600">
              Discover, manage and monitor environmental projects
              before they move through BlueGuard's evidence,
              geospatial, satellite and verification pipeline.
            </p>

          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
          >
            <Plus size={18} />
            New Project
          </button>

        </div>


        {/* ===================================================
            REGISTRY STATS
        =================================================== */}

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

          <RegistryMetric
            icon={<BarChart3 size={19} />}
            label="Total Projects"
            value={statistics.total}
            description="Registered projects"
          />

          <RegistryMetric
            icon={<CheckCircle2 size={19} />}
            label="Verified"
            value={statistics.verified}
            description="Passed verification"
            accent
          />

          <RegistryMetric
            icon={<Satellite size={19} />}
            label="Monitoring"
            value={statistics.monitoring}
            description="Active monitoring"
          />

          <RegistryMetric
            icon={<MapPin size={19} />}
            label="Registered Area"
            value={`${statistics.totalArea.toFixed(0)} ha`}
            description="Across projects"
          />

          <RegistryMetric
            icon={<Activity size={19} />}
            label="Avg. Progress"
            value={`${statistics.averageProgress}%`}
            description="Overall restoration"
            accent
          />

        </div>

      </section>


      {/* =====================================================
          SEARCH / FILTER BAR
      ===================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 xl:flex-row">

          {/* SEARCH */}

          <div className="relative flex-1">

            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search project, location, habitat or ID..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm !text-slate-900 outline-none placeholder:!text-slate-500 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 !text-slate-500 hover:bg-slate-100 hover:!text-slate-900"
              >
                <X size={16} />
              </button>
            )}

          </div>


          {/* STATUS */}

          <div className="flex flex-wrap gap-2">

            {[
              "All",
              "Verified",
              "Under Review",
              "Monitoring",
              "Draft",
            ].map((status) => (

              <button
                key={status}
                type="button"
                onClick={() =>
                  setStatusFilter(status)
                }
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  statusFilter === status
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-50 !text-slate-700 hover:bg-slate-100"
                }`}
              >
                {status}
              </button>

            ))}

          </div>

        </div>


        {/* SECONDARY CONTROLS */}

        <div className="mt-4 flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">

          <div className="flex flex-wrap items-center gap-2">

            <button
              type="button"
              onClick={() =>
                setShowFilters((current) => !current)
              }
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                showFilters
                  ? "bg-emerald-50 !text-emerald-700"
                  : "!text-slate-700 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal size={16} />
              Advanced filters
            </button>

            <span className="h-5 w-px bg-slate-200" />

            <span className="text-sm !text-slate-600">
              Showing{" "}
              <strong className="!text-slate-900">
                {filteredProjects.length}
              </strong>{" "}
              of{" "}
              <strong className="!text-slate-900">
                {allProjects.length}
              </strong>{" "}
              projects
            </span>

          </div>


          <div className="flex items-center gap-2">

            {/* SORT */}

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold !text-slate-700 outline-none focus:border-emerald-400"
            >
              <option value="newest">
                Project ID
              </option>

              <option value="name">
                Name
              </option>

              <option value="progress">
                Progress
              </option>

              <option value="area">
                Area
              </option>

              <option value="carbon">
                Carbon
              </option>
            </select>


            {/* VIEW MODE */}

            <div className="hidden rounded-lg border border-slate-200 bg-slate-50 p-1 sm:flex">

              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-md p-2 ${
                  viewMode === "grid"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "!text-slate-500"
                }`}
                title="Grid view"
              >
                <Grid2X2 size={16} />
              </button>

              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-md p-2 ${
                  viewMode === "list"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "!text-slate-500"
                }`}
                title="List view"
              >
                <List size={16} />
              </button>

            </div>

          </div>

        </div>


        {/* ADVANCED FILTERS */}

        {showFilters && (
          <div className="mt-4 grid gap-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 md:grid-cols-3">

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide !text-slate-600">
                Habitat
              </label>

              <select
                value={habitatFilter}
                onChange={(event) =>
                  setHabitatFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold !text-slate-700"
              >
                <option>All</option>
                <option>Mangrove</option>
                <option>Seagrass</option>
                <option>Salt Marsh</option>
                <option>Coastal Wetland</option>
                <option>Mixed Coastal Habitat</option>
              </select>
            </div>

            <FilterInfo
              icon={<ShieldCheck size={16} />}
              title="Verification"
              value={
                statusFilter === "All"
                  ? "All verification states"
                  : statusFilter
              }
            />

            <FilterInfo
              icon={<Satellite size={16} />}
              title="Monitoring"
              value="Satellite-ready registry"
            />

          </div>
        )}

      </section>


      {/* =====================================================
          PROJECT RESULTS
      ===================================================== */}

      <section className="mt-6">

        {filteredProjects.length === 0 ? (

          <EmptyState
            search={search}
            onClear={clearFilters}
            onCreate={() => setShowCreateModal(true)}
          />

        ) : (

          <div
            className={
              viewMode === "grid"
                ? "grid gap-5 lg:grid-cols-2 xl:grid-cols-3"
                : "space-y-4"
            }
          >

            {filteredProjects.map((project) => (

              <ProjectCard
                key={project.id}
                project={project}
                listView={viewMode === "list"}
              />

            ))}

          </div>

        )}

      </section>


      {/* =====================================================
          LIFECYCLE INFORMATION
      ===================================================== */}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-3">

            <div className="rounded-xl bg-emerald-50 p-2.5">
              <Sparkles
                size={18}
                className="text-emerald-600"
              />
            </div>

            <div>

              <p className="text-sm font-bold !text-slate-900">
                BlueGuard verification lifecycle
              </p>

              <p className="mt-1 text-xs leading-5 !text-slate-600">
                Registration → Evidence → Geospatial analysis →
                Satellite monitoring → Automated analysis →
                Human verifier → Blockchain proof
              </p>

            </div>

          </div>

          <div className="flex flex-wrap gap-2">

            <LifecycleBadge
              icon={<MapPin size={13} />}
              text="Geospatial"
            />

            <LifecycleBadge
              icon={<Satellite size={13} />}
              text="Satellite"
            />

            <LifecycleBadge
              icon={<ShieldCheck size={13} />}
              text="Verification"
            />

            <LifecycleBadge
              icon={<ClipboardCheck size={13} />}
              text="Evidence"
            />

          </div>

        </div>

      </section>


      {/* =====================================================
          CREATE MODAL
      ===================================================== */}

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateProject}
        />
      )}

    </div>
  );
}


/* =========================================================
   PROJECT CARD
========================================================= */

function ProjectCard({ project, listView }) {

  const progress = Math.min(
    Math.max(Number(project.progress || 0), 0),
    100
  );

  const readiness = calculateReadiness(project);

  const habitat =
    project.habitat ||
    getHabitatFromType(project.projectType);

  if (listView) {
    return (
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">

        <div className="flex flex-col gap-5 xl:flex-row xl:items-center">

          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-2">

              <span className="text-xs font-bold tracking-wide !text-slate-500">
                {project.id}
              </span>

              <StatusBadge status={project.status} />

            </div>

            <h3 className="mt-2 truncate text-lg font-bold !text-slate-900">
              {project.name}
            </h3>

            <p className="mt-1 flex items-center gap-1.5 text-sm !text-slate-600">

              <MapPin
                size={15}
                className="shrink-0 text-emerald-600"
              />

              {project.location}

            </p>

          </div>


          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[480px]">

            <MiniStat
              label="Area"
              value={project.area || "—"}
            />

            <MiniStat
              label="Carbon"
              value={project.carbon || "Pending"}
              accent
            />

            <MiniStat
              label="Progress"
              value={`${progress}%`}
              accent
            />

            <MiniStat
              label="Readiness"
              value={`${readiness}%`}
              accent
            />

          </div>


          <Link
            to={`/projects/${project.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold !text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:!text-emerald-700"
          >
            Explore
            <ArrowRight size={16} />
          </Link>

        </div>

      </article>
    );
  }


  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">

      {/* TOP ACCENT */}

      <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />


      <div className="p-5">

        {/* ID / STATUS */}

        <div className="flex items-center justify-between gap-3">

          <span className="text-xs font-bold tracking-wide !text-slate-500">
            {project.id}
          </span>

          <StatusBadge status={project.status} />

        </div>


        {/* NAME */}

        <h3 className="mt-4 text-xl font-bold leading-tight !text-slate-900">
          {project.name}
        </h3>


        {/* LOCATION */}

        <p className="mt-2 flex items-center gap-1.5 text-sm !text-slate-600">

          <MapPin
            size={15}
            className="shrink-0 text-emerald-600"
          />

          {project.location}

        </p>


        {/* DESCRIPTION */}

        <p className="mt-3 line-clamp-2 text-sm leading-5 !text-slate-600">
          {project.description ||
            "Environmental restoration project registered with BlueGuard."}
        </p>


        {/* HABITAT */}

        <div className="mt-4 flex flex-wrap gap-2">

          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold !text-emerald-700">
            {habitat}
          </span>

          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold !text-slate-600">
            Geospatial ready
          </span>

          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold !text-slate-600">
            Satellite ready
          </span>

        </div>


        {/* CORE METRICS */}

        <div className="mt-5 grid grid-cols-2 gap-3">

          <MetricBox
            icon={<MapPin size={16} />}
            label="Project Area"
            value={project.area || "Pending"}
          />

          <MetricBox
            icon={<Leaf size={16} />}
            label="Carbon Impact"
            value={project.carbon || "Pending"}
          />

        </div>


        {/* PROGRESS */}

        <div className="mt-5">

          <div className="mb-2 flex items-center justify-between">

            <span className="text-xs font-semibold !text-slate-600">
              Restoration progress
            </span>

            <span className="text-sm font-bold !text-emerald-700">
              {progress}%
            </span>

          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">

            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

        </div>


        {/* INTELLIGENCE */}

        <div className="mt-5 grid grid-cols-3 gap-2">

          <IntelligenceChip
            icon={<ShieldCheck size={14} />}
            label="Readiness"
            value={`${readiness}%`}
          />

          <IntelligenceChip
            icon={<Satellite size={14} />}
            label="Satellite"
            value="Ready"
          />

          <IntelligenceChip
            icon={<Activity size={14} />}
            label="Tracking"
            value={
              project.status === "Monitoring"
                ? "Active"
                : "Queued"
            }
          />

        </div>


        {/* COORDINATES */}

        {Array.isArray(project.coordinates) &&
          project.coordinates.length >= 2 && (

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">

              <MapPin
                size={14}
                className="text-emerald-600"
              />

              <span className="text-xs font-medium !text-slate-600">
                {Number(project.coordinates[0]).toFixed(4)}
                {" , "}
                {Number(project.coordinates[1]).toFixed(4)}
              </span>

              <span className="ml-auto text-[10px] font-bold uppercase tracking-wide !text-slate-500">
                Coordinates
              </span>

            </div>

          )}


        {/* ACTION */}

        <Link
          to={`/projects/${project.id}`}
          className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold !text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:!text-emerald-700"
        >
          Explore project
          <ArrowRight size={16} />
        </Link>

      </div>

    </article>
  );
}


/* =========================================================
   CREATE PROJECT MODAL
========================================================= */

function CreateProjectModal({ onClose, onCreate }) {

  const [step, setStep] = useState(1);

  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    projectType: "Mangrove Restoration",
    location: "",
    organization: "",
    description: "",

    latitude: "",
    longitude: "",
    area: "",
    habitat: "Mangrove",

    startDate: "",
    monitoringFrequency: "Monthly",

    estimatedCarbon: "",
  });


  const updateField = (field, value) => {

    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));

  };


  const validateStep = () => {

    const nextErrors = {};


    if (step === 1) {

      if (!form.name.trim()) {
        nextErrors.name = "Project name is required.";
      }

      if (!form.location.trim()) {
        nextErrors.location = "Project location is required.";
      }

      if (!form.organization.trim()) {
        nextErrors.organization =
          "Organization name is required.";
      }

      if (!form.description.trim()) {
        nextErrors.description =
          "Add a short project description.";
      }

    }


    if (step === 2) {

      const latitude = Number(form.latitude);
      const longitude = Number(form.longitude);
      const area = Number(form.area);


      if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        nextErrors.latitude =
          "Latitude must be between -90 and 90.";
      }


      if (
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        nextErrors.longitude =
          "Longitude must be between -180 and 180.";
      }


      if (!Number.isFinite(area) || area <= 0) {
        nextErrors.area =
          "Enter a valid project area.";
      }

    }


    if (step === 3) {

      if (!form.startDate) {
        nextErrors.startDate =
          "Select the project start date.";
      }

    }


    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };


  const nextStep = () => {

    if (!validateStep()) {
      return;
    }

    setStep((current) =>
      Math.min(current + 1, 4)
    );

  };


  const previousStep = () => {

    setErrors({});

    setStep((current) =>
      Math.max(current - 1, 1)
    );

  };


  const createProject = (status) => {

    if (step === 4) {
      // Final review already validated.
    } else if (!validateStep()) {
      return;
    }


    const existingNumbers = seedProjects
      .map((project) =>
        Number(
          String(project.id).replace("BG-", "")
        )
      )
      .filter(Number.isFinite);


    let savedProjects = [];

    try {

      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      if (Array.isArray(saved)) {
        savedProjects = saved;
      }

    } catch {
      savedProjects = [];
    }


    const savedNumbers = savedProjects
      .map((project) =>
        Number(
          String(project.id).replace("BG-", "")
        )
      )
      .filter(Number.isFinite);


    const nextNumber =
      Math.max(
        0,
        ...existingNumbers,
        ...savedNumbers
      ) + 1;


    const newId =
      `BG-${String(nextNumber).padStart(3, "0")}`;


    const newProject = {

      id: newId,

      name: form.name.trim(),

      location: form.location.trim(),

      status,

      area:
        `${Number(form.area).toLocaleString()} ha`,

      progress: 0,

      carbon:
        form.estimatedCarbon
          ? `${Number(form.estimatedCarbon).toLocaleString()} tCO₂e`
          : "Pending",

      coordinates: [
        Number(form.latitude),
        Number(form.longitude),
      ],

      description:
        form.description.trim(),

      projectType:
        form.projectType,

      organization:
        form.organization.trim(),

      habitat:
        form.habitat,

      startDate:
        form.startDate,

      monitoringFrequency:
        form.monitoringFrequency,

      createdAt:
        new Date().toISOString(),

      source:
        "BlueGuard Registry",

      monitoringReady: true,

      satelliteReady: true,

      geospatialReady: true,

      verificationReady:
        status === "Under Review",

      blockchainReady: false,

    };


    onCreate(newProject);

  };


  return (

    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >

      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 lg:px-8">

          <div>

            <div className="flex items-center gap-2">

              <div className="rounded-xl bg-emerald-50 p-2">
                <Plus
                  size={18}
                  className="text-emerald-600"
                />
              </div>

              <p className="text-sm font-bold text-emerald-700">
                PROJECT REGISTRATION
              </p>

            </div>

            <h2 className="mt-2 text-2xl font-bold !text-slate-900">
              Create a BlueGuard Project
            </h2>

            <p className="mt-1 text-sm !text-slate-600">
              Register the project so it can enter the
              evidence, geospatial, monitoring and
              verification pipeline.
            </p>

          </div>


          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 !text-slate-500 hover:bg-slate-100 hover:!text-slate-900"
          >
            <X size={20} />
          </button>

        </div>


        {/* STEPPER */}

        <div className="border-b border-slate-200 px-6 py-4 lg:px-8">

          <div className="flex items-center">

            {[
              ["1", "Basics"],
              ["2", "Site"],
              ["3", "Monitoring"],
              ["4", "Review"],
            ].map(([number, label], index) => {

              const current =
                Number(number) === step;

              const complete =
                Number(number) < step;

              return (

                <div
                  key={number}
                  className="flex flex-1 items-center"
                >

                  <div className="flex items-center gap-2">

                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        current
                          ? "bg-emerald-600 text-white"
                          : complete
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 !text-slate-500"
                      }`}
                    >
                      {complete ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        number
                      )}
                    </div>

                    <span
                      className={`hidden text-xs font-bold sm:block ${
                        current || complete
                          ? "!text-slate-900"
                          : "!text-slate-500"
                      }`}
                    >
                      {label}
                    </span>

                  </div>


                  {index < 3 && (
                    <div
                      className={`mx-3 h-px flex-1 ${
                        complete
                          ? "bg-emerald-300"
                          : "bg-slate-200"
                      }`}
                    />
                  )}

                </div>

              );

            })}

          </div>

        </div>


        {/* BODY */}

        <div className="overflow-y-auto px-6 py-6 lg:px-8">

          {step === 1 && (
            <StepBasics
              form={form}
              errors={errors}
              updateField={updateField}
            />
          )}

          {step === 2 && (
            <StepSite
              form={form}
              errors={errors}
              updateField={updateField}
            />
          )}

          {step === 3 && (
            <StepMonitoring
              form={form}
              errors={errors}
              updateField={updateField}
            />
          )}

          {step === 4 && (
            <StepReview form={form} />
          )}

        </div>


        {/* FOOTER */}

        <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center lg:px-8">

          <div className="flex items-center gap-2 text-xs !text-slate-600">

            <ClipboardCheck
              size={15}
              className="text-emerald-600"
            />

            Prototype data is saved locally.

          </div>


          <div className="flex justify-end gap-2">

            {step > 1 && (

              <button
                type="button"
                onClick={previousStep}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold !text-slate-700 hover:bg-slate-50"
              >
                <ChevronLeft size={16} />
                Back
              </button>

            )}


            {step < 4 ? (

              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
              >
                Continue
                <ChevronRight size={16} />
              </button>

            ) : (

              <>

                <button
                  type="button"
                  onClick={() =>
                    createProject("Draft")
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold !text-slate-700 hover:bg-slate-50"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={() =>
                    createProject("Under Review")
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  <ShieldCheck size={16} />
                  Submit for Verification
                </button>

              </>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   STEP 1
========================================================= */

function StepBasics({
  form,
  errors,
  updateField,
}) {

  return (

    <div>

      <StepHeading
        eyebrow="STEP 01"
        title="Project identity"
        description="Tell BlueGuard what this project is and who is responsible for it."
      />


      <div className="mt-6 grid gap-5 md:grid-cols-2">

        <FormField
          label="Project name"
          required
          error={errors.name}
          className="md:col-span-2"
        >
          <input
            value={form.name}
            onChange={(event) =>
              updateField(
                "name",
                event.target.value
              )
            }
            placeholder="e.g. Mumbai Mangrove Revival"
            className={inputClass(errors.name)}
          />
        </FormField>


        <FormField
          label="Project type"
          required
        >
          <select
            value={form.projectType}
            onChange={(event) =>
              updateField(
                "projectType",
                event.target.value
              )
            }
            className={inputClass()}
          >
            <option>Mangrove Restoration</option>
            <option>Seagrass Restoration</option>
            <option>Coastal Wetland Restoration</option>
            <option>Salt Marsh Restoration</option>
            <option>Blue Carbon Conservation</option>
          </select>
        </FormField>


        <FormField
          label="Responsible organization"
          required
          error={errors.organization}
        >
          <input
            value={form.organization}
            onChange={(event) =>
              updateField(
                "organization",
                event.target.value
              )
            }
            placeholder="Foundation / NGO / Organization"
            className={inputClass(
              errors.organization
            )}
          />
        </FormField>


        <FormField
          label="Project location"
          required
          error={errors.location}
          className="md:col-span-2"
        >
          <input
            value={form.location}
            onChange={(event) =>
              updateField(
                "location",
                event.target.value
              )
            }
            placeholder="e.g. Mumbai, Maharashtra, India"
            className={inputClass(
              errors.location
            )}
          />
        </FormField>


        <FormField
          label="Project description"
          required
          error={errors.description}
          className="md:col-span-2"
        >
          <textarea
            rows={4}
            value={form.description}
            onChange={(event) =>
              updateField(
                "description",
                event.target.value
              )
            }
            placeholder="Describe the restoration objective, ecosystem and project activities..."
            className={inputClass(
              errors.description
            )}
          />
        </FormField>

      </div>

    </div>
  );
}


/* =========================================================
   STEP 2
========================================================= */

function StepSite({
  form,
  errors,
  updateField,
}) {

  return (

    <div>

      <StepHeading
        eyebrow="STEP 02"
        title="Project site"
        description="Add the geographic information that will power BlueGuard's map and future satellite monitoring."
      />


      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">

        <div className="flex items-start gap-3">

          <MapPin
            size={20}
            className="mt-0.5 text-emerald-600"
          />

          <div>

            <p className="text-sm font-bold !text-slate-900">
              Geospatial foundation
            </p>

            <p className="mt-1 text-xs leading-5 !text-slate-600">
              Coordinates will later define the project
              map, boundary, satellite search area,
              monitoring region and environmental analysis.
            </p>

          </div>

        </div>

      </div>


      <div className="mt-6 grid gap-5 md:grid-cols-2">

        <FormField
          label="Latitude"
          required
          error={errors.latitude}
        >
          <input
            type="number"
            step="any"
            value={form.latitude}
            onChange={(event) =>
              updateField(
                "latitude",
                event.target.value
              )
            }
            placeholder="e.g. 19.0760"
            className={inputClass(
              errors.latitude
            )}
          />
        </FormField>


        <FormField
          label="Longitude"
          required
          error={errors.longitude}
        >
          <input
            type="number"
            step="any"
            value={form.longitude}
            onChange={(event) =>
              updateField(
                "longitude",
                event.target.value
              )
            }
            placeholder="e.g. 72.8777"
            className={inputClass(
              errors.longitude
            )}
          />
        </FormField>


        <FormField
          label="Project area"
          required
          error={errors.area}
        >
          <div className="relative">

            <input
              type="number"
              min="0"
              step="0.1"
              value={form.area}
              onChange={(event) =>
                updateField(
                  "area",
                  event.target.value
                )
              }
              placeholder="e.g. 125"
              className={`${inputClass(
                errors.area
              )} pr-12`}
            />

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold !text-slate-500">
              ha
            </span>

          </div>
        </FormField>


        <FormField
          label="Primary habitat"
          required
        >
          <select
            value={form.habitat}
            onChange={(event) =>
              updateField(
                "habitat",
                event.target.value
              )
            }
            className={inputClass()}
          >
            <option>Mangrove</option>
            <option>Seagrass</option>
            <option>Salt Marsh</option>
            <option>Coastal Wetland</option>
            <option>Mixed Coastal Habitat</option>
          </select>
        </FormField>

      </div>


      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">

        <Satellite
          size={19}
          className="mt-0.5 text-emerald-600"
        />

        <div>

          <p className="text-sm font-bold !text-slate-900">
            Satellite monitoring preparation
          </p>

          <p className="mt-1 text-xs leading-5 !text-slate-600">
            This project is being registered with
            geospatial information so future satellite
            imagery and monitoring APIs can operate on
            the correct location.
          </p>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   STEP 3
========================================================= */

function StepMonitoring({
  form,
  errors,
  updateField,
}) {

  return (

    <div>

      <StepHeading
        eyebrow="STEP 03"
        title="Monitoring configuration"
        description="Define the initial monitoring context for this project."
      />


      <div className="mt-6 grid gap-5 md:grid-cols-2">

        <FormField
          label="Project start date"
          required
          error={errors.startDate}
        >
          <input
            type="date"
            value={form.startDate}
            onChange={(event) =>
              updateField(
                "startDate",
                event.target.value
              )
            }
            className={inputClass(
              errors.startDate
            )}
          />
        </FormField>


        <FormField
          label="Monitoring frequency"
          required
        >
          <select
            value={form.monitoringFrequency}
            onChange={(event) =>
              updateField(
                "monitoringFrequency",
                event.target.value
              )
            }
            className={inputClass()}
          >
            <option>Monthly</option>
            <option>Quarterly</option>
            <option>Biannual</option>
            <option>Annual</option>
          </select>
        </FormField>


        <FormField
          label="Estimated carbon impact"
          hint="Optional — can be calculated later."
          className="md:col-span-2"
        >
          <div className="relative">

            <input
              type="number"
              min="0"
              step="1"
              value={form.estimatedCarbon}
              onChange={(event) =>
                updateField(
                  "estimatedCarbon",
                  event.target.value
                )
              }
              placeholder="e.g. 15000"
              className={`${inputClass()} pr-20`}
            />

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold !text-slate-500">
              tCO₂e
            </span>

          </div>
        </FormField>

      </div>


      <div className="mt-6 grid gap-4 sm:grid-cols-3">

        <PipelinePreview
          icon={<MapPin size={18} />}
          title="Geospatial"
          description="Coordinates captured"
        />

        <PipelinePreview
          icon={<Satellite size={18} />}
          title="Satellite"
          description="Ready for integration"
        />

        <PipelinePreview
          icon={<ShieldCheck size={18} />}
          title="Verification"
          description="Evidence can be submitted"
        />

      </div>

    </div>
  );
}


/* =========================================================
   STEP 4
========================================================= */

function StepReview({ form }) {

  return (

    <div>

      <StepHeading
        eyebrow="STEP 04"
        title="Review project"
        description="Check the project information before adding it to the BlueGuard registry."
      />


      <div className="mt-6 grid gap-4 md:grid-cols-2">

        <ReviewBlock
          title="Project identity"
          icon={<ClipboardCheck size={17} />}
          rows={[
            ["Name", form.name || "Not provided"],
            ["Type", form.projectType],
            ["Organization", form.organization || "Not provided"],
            ["Location", form.location || "Not provided"],
          ]}
        />


        <ReviewBlock
          title="Project site"
          icon={<MapPin size={17} />}
          rows={[
            [
              "Coordinates",
              `${form.latitude || "—"}, ${form.longitude || "—"}`,
            ],
            [
              "Area",
              form.area
                ? `${form.area} ha`
                : "Not provided",
            ],
            ["Habitat", form.habitat],
          ]}
        />


        <ReviewBlock
          title="Monitoring"
          icon={<Satellite size={17} />}
          rows={[
            [
              "Start date",
              form.startDate || "Not provided",
            ],
            [
              "Frequency",
              form.monitoringFrequency,
            ],
            [
              "Estimated carbon",
              form.estimatedCarbon
                ? `${form.estimatedCarbon} tCO₂e`
                : "Pending",
            ],
          ]}
        />


        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">

          <div className="flex items-center gap-2">

            <Sparkles
              size={17}
              className="text-emerald-600"
            />

            <h3 className="font-bold !text-slate-900">
              What happens next?
            </h3>

          </div>


          <div className="mt-4 space-y-3">

            <PipelineRow
              number="01"
              text="Project registered"
            />

            <PipelineRow
              number="02"
              text="Evidence submitted"
            />

            <PipelineRow
              number="03"
              text="Geospatial & satellite analysis"
            />

            <PipelineRow
              number="04"
              text="Automated verification"
            />

            <PipelineRow
              number="05"
              text="Human verifier review"
            />

            <PipelineRow
              number="06"
              text="Blockchain proof after approval"
            />

          </div>

        </div>

      </div>


      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">

        <p className="text-xs font-bold uppercase tracking-wide !text-slate-500">
          Project description
        </p>

        <p className="mt-2 text-sm leading-6 !text-slate-700">
          {form.description ||
            "No description provided."}
        </p>

      </div>

    </div>
  );
}


/* =========================================================
   SMALL COMPONENTS
========================================================= */

function RegistryMetric({
  icon,
  label,
  value,
  description,
  accent = false,
}) {

  return (

    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="text-xs font-semibold !text-slate-600">
            {label}
          </p>

          <p
            className={`mt-2 text-2xl font-bold ${
              accent
                ? "!text-emerald-700"
                : "!text-slate-900"
            }`}
          >
            {value}
          </p>

          <p className="mt-1 text-xs !text-slate-500">
            {description}
          </p>

        </div>

        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
          {icon}
        </div>

      </div>

    </div>
  );
}


function MetricBox({
  icon,
  label,
  value,
}) {

  return (

    <div className="rounded-xl bg-slate-50 p-3">

      <div className="flex items-center gap-1.5 text-emerald-600">

        {icon}

        <span className="text-xs font-semibold !text-slate-600">
          {label}
        </span>

      </div>

      <p className="mt-1 text-sm font-bold !text-emerald-700">
        {value}
      </p>

    </div>
  );
}


function MiniStat({
  label,
  value,
  accent = false,
}) {

  return (

    <div className="rounded-xl bg-slate-50 px-3 py-2.5">

      <p className="text-[11px] font-semibold !text-slate-600">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-bold ${
          accent
            ? "!text-emerald-700"
            : "!text-slate-900"
        }`}
      >
        {value}
      </p>

    </div>
  );
}


function IntelligenceChip({
  icon,
  label,
  value,
}) {

  return (

    <div className="rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2">

      <div className="flex items-center gap-1 text-emerald-600">

        {icon}

        <span className="truncate text-[10px] font-semibold !text-slate-600">
          {label}
        </span>

      </div>

      <p className="mt-1 truncate text-xs font-bold !text-slate-900">
        {value}
      </p>

    </div>
  );
}


function FilterInfo({
  icon,
  title,
  value,
}) {

  return (

    <div className="rounded-xl border border-emerald-100 bg-white p-3">

      <div className="flex items-center gap-2 text-emerald-600">

        {icon}

        <span className="text-xs font-bold !text-slate-700">
          {title}
        </span>

      </div>

      <p className="mt-2 text-sm font-bold !text-slate-900">
        {value}
      </p>

    </div>
  );
}


function StatusBadge({ status }) {

  const config = getStatusConfig(status);

  return (

    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${config.bg} ${config.text}`}
    >

      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
      />

      {status}

    </span>
  );
}


function LifecycleBadge({
  icon,
  text,
}) {

  return (

    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold !text-slate-600">

      <span className="text-emerald-600">
        {icon}
      </span>

      {text}

    </span>
  );
}


function EmptyState({
  search,
  onClear,
  onCreate,
}) {

  return (

    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
        <Search
          size={24}
          className="text-emerald-600"
        />
      </div>

      <h3 className="mt-4 text-lg font-bold !text-slate-900">
        No projects found
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 !text-slate-600">
        {search
          ? `Nothing matched "${search}". Try another project name, location or ID.`
          : "No projects match the selected filters."}
      </p>

      <div className="mt-5 flex justify-center gap-3">

        <button
          type="button"
          onClick={onClear}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold !text-slate-700 hover:bg-slate-50"
        >
          Clear filters
        </button>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
        >
          <Plus size={16} />
          New Project
        </button>

      </div>

    </div>
  );
}


function StepHeading({
  eyebrow,
  title,
  description,
}) {

  return (

    <div>

      <p className="text-xs font-bold tracking-widest text-emerald-700">
        {eyebrow}
      </p>

      <h3 className="mt-2 text-xl font-bold !text-slate-900">
        {title}
      </h3>

      <p className="mt-1 max-w-2xl text-sm leading-6 !text-slate-600">
        {description}
      </p>

    </div>
  );
}


function FormField({
  label,
  required = false,
  error,
  hint,
  children,
  className = "",
}) {

  return (

    <div className={className}>

      <label className="mb-2 block text-sm font-bold !text-slate-700">

        {label}

        {required && (
          <span className="ml-1 text-emerald-600">
            *
          </span>
        )}

      </label>

      {children}

      {error && (
        <p className="mt-1.5 text-xs font-semibold text-red-600">
          {error}
        </p>
      )}

      {!error && hint && (
        <p className="mt-1.5 text-xs !text-slate-500">
          {hint}
        </p>
      )}

    </div>
  );
}


function PipelinePreview({
  icon,
  title,
  description,
}) {

  return (

    <div className="rounded-2xl border border-slate-200 bg-white p-4">

      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        {icon}
      </div>

      <p className="mt-3 text-sm font-bold !text-slate-900">
        {title}
      </p>

      <p className="mt-1 text-xs !text-slate-600">
        {description}
      </p>

    </div>
  );
}


function ReviewBlock({
  title,
  icon,
  rows,
}) {

  return (

    <div className="rounded-2xl border border-slate-200 bg-white p-5">

      <div className="flex items-center gap-2">

        <span className="text-emerald-600">
          {icon}
        </span>

        <h3 className="font-bold !text-slate-900">
          {title}
        </h3>

      </div>

      <div className="mt-4 space-y-3">

        {rows.map(([label, value]) => (

          <div
            key={label}
            className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
          >

            <span className="text-xs font-semibold !text-slate-600">
              {label}
            </span>

            <span className="text-right text-sm font-bold !text-slate-900">
              {value}
            </span>

          </div>

        ))}

      </div>

    </div>
  );
}


function PipelineRow({
  number,
  text,
}) {

  return (

    <div className="flex items-center gap-3">

      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] font-bold text-emerald-700">
        {number}
      </span>

      <span className="text-sm font-semibold !text-slate-700">
        {text}
      </span>

    </div>
  );
}


/* =========================================================
   HELPERS
========================================================= */

function getNumber(value) {

  const number = parseFloat(
    String(value || "").replace(/[^\d.]/g, "")
  );

  return Number.isFinite(number)
    ? number
    : 0;
}


function getHabitatFromType(type) {

  if (!type) {
    return "Mangrove";
  }

  if (
    type.toLowerCase().includes("seagrass")
  ) {
    return "Seagrass";
  }

  if (
    type.toLowerCase().includes("marsh")
  ) {
    return "Salt Marsh";
  }

  if (
    type.toLowerCase().includes("wetland")
  ) {
    return "Coastal Wetland";
  }

  return "Mangrove";
}


function calculateReadiness(project) {

  let score = 0;

  if (project.name) score += 20;
  if (project.location) score += 20;
  if (project.area) score += 15;

  if (
    Array.isArray(project.coordinates) &&
    project.coordinates.length >= 2
  ) {
    score += 20;
  }

  if (project.description) score += 15;

  if (
    project.organization ||
    project.habitat
  ) {
    score += 10;
  }

  return Math.min(score, 100);
}


function getStatusConfig(status) {

  switch (status) {

    case "Verified":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      };

    case "Monitoring":
      return {
        bg: "bg-teal-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      };

    case "Under Review":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
      };

    case "Draft":
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        dot: "bg-slate-500",
      };

    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        dot: "bg-slate-500",
      };

  }
}


function inputClass(error) {

  return `
    w-full rounded-xl border bg-white px-4 py-3
    text-sm !text-slate-900 outline-none transition
    placeholder:!text-slate-500
    ${
      error
        ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
    }
  `;
}