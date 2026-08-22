import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FolderKanban,
  Leaf,
  MapPin,
  RefreshCw,
  Satellite,
  Search,
  ShieldCheck,
  TrendingUp,
  UploadCloud,
} from "lucide-react";

import {
  projects,
  monitoringData,
} from "../data/mockData";

import { getCurrentUser } from "../services/authService";


/*
  BlueGuard Dashboard

  Current prototype data sources:
  - Project registry       -> mockData.js
  - Monitoring indicators -> mockData.js
  - Evidence               -> localStorage
  - Verification           -> localStorage
  - Organization           -> authService.js

  Future production integration:
  Frontend
      ↓
  FastAPI
      ↓
  MongoDB
      ↓
  Planet / GIS / AI / Blockchain
*/


const STORAGE_KEYS = {
  evidence: "blueguard_evidence",
  verifications: "blueguard_verifications",
};


function readLocalStorageArray(key) {
  try {
    const stored = localStorage.getItem(key);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Unable to read ${key}:`, error);
    return [];
  }
}


function formatCarbonValue(value) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return value.toLocaleString();
}


function getCarbonNumber(carbon) {
  if (typeof carbon === "number") {
    return carbon;
  }

  if (!carbon) {
    return 0;
  }

  const numericValue = Number(
    String(carbon).replace(/[^0-9.]/g, "")
  );

  return Number.isFinite(numericValue)
    ? numericValue
    : 0;
}


export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);

  const [evidence, setEvidence] = useState([]);
  const [verifications, setVerifications] = useState([]);

  const [search, setSearch] = useState("");

  const [lastUpdated, setLastUpdated] = useState(
    new Date()
  );


  /*
    Load local application data.

    Later this same section can be replaced with
    API calls to FastAPI without changing the UI.
  */
  const loadDashboardData = () => {
    setCurrentUser(getCurrentUser());

    setEvidence(
      readLocalStorageArray(STORAGE_KEYS.evidence)
    );

    setVerifications(
      readLocalStorageArray(STORAGE_KEYS.verifications)
    );

    setLastUpdated(new Date());
  };


  useEffect(() => {
    loadDashboardData();

    /*
      Listen for storage changes so the dashboard
      can react when another part of the application
      updates evidence or verification records.
    */
    const handleStorageChange = () => {
      loadDashboardData();
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);


  /*
    -------------------------------------------------------
    PROJECT METRICS
    -------------------------------------------------------
  */

  const activeProjects = useMemo(() => {
    return projects.filter(
      (project) =>
        project.status !== "Archived"
    ).length;
  }, []);


  const verifiedProjects = useMemo(() => {
    return projects.filter(
      (project) =>
        project.status === "Verified"
    ).length;
  }, []);


  const monitoringProjects = useMemo(() => {
    return projects.filter(
      (project) =>
        project.status === "Monitoring"
    ).length;
  }, []);


  const totalCarbon = useMemo(() => {
    return projects.reduce(
      (total, project) =>
        total + getCarbonNumber(project.carbon),
      0
    );
  }, []);


  /*
    -------------------------------------------------------
    VERIFICATION METRICS
    -------------------------------------------------------
  */

  const verifiedSubmissions = useMemo(() => {
    return verifications.filter(
      (item) =>
        item.result === "Pass"
    ).length;
  }, [verifications]);


  const reviewSubmissions = useMemo(() => {
    return verifications.filter(
      (item) =>
        item.result === "Review"
    ).length;
  }, [verifications]);


  const averageConfidence = useMemo(() => {
    if (verifications.length === 0) {
      return 0;
    }

    const total = verifications.reduce(
      (sum, item) =>
        sum + (Number(item.confidence) || 0),
      0
    );

    return Math.round(
      total / verifications.length
    );
  }, [verifications]);


  /*
    If no verification records exist yet,
    the project registry still provides a useful
    prototype-level review count.
  */
  const pendingProjectReviews = useMemo(() => {
    return projects.filter(
      (project) =>
        project.status === "Under Review"
    ).length;
  }, []);


  const verificationQueue =
    reviewSubmissions > 0
      ? reviewSubmissions
      : pendingProjectReviews;


  /*
    -------------------------------------------------------
    MONITORING METRICS
    -------------------------------------------------------
  */

  const latestMonitoring =
    monitoringData.length > 0
      ? monitoringData[monitoringData.length - 1]
      : null;


  const previousMonitoring =
    monitoringData.length > 1
      ? monitoringData[monitoringData.length - 2]
      : null;


  const vegetationChange =
    latestMonitoring && previousMonitoring
      ? latestMonitoring.vegetation -
        previousMonitoring.vegetation
      : 0;


  const carbonChange =
    latestMonitoring && previousMonitoring
      ? latestMonitoring.carbon -
        previousMonitoring.carbon
      : 0;


  /*
    -------------------------------------------------------
    PROJECT SEARCH
    -------------------------------------------------------
  */

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return projects;
    }

    return projects.filter((project) =>
      [
        project.id,
        project.name,
        project.location,
        project.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [search]);


  /*
    -------------------------------------------------------
    PROJECT HEALTH
    -------------------------------------------------------
  */

  const healthProjects = useMemo(() => {
    return projects.slice(0, 3);
  }, []);


  return (
    <div className="p-6 lg:p-8">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

        <div>
          <p className="text-sm font-semibold tracking-wide text-emerald-600">
            OVERVIEW
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-900">
            Blue Carbon Dashboard
          </h2>

          <p className="mt-2 text-slate-600">
            Monitor restoration projects, evidence,
            verification and environmental impact.
          </p>

          {currentUser && (
            <p className="mt-2 text-sm text-slate-600">
              Welcome back,{" "}
              <span className="font-semibold text-slate-700">
                {currentUser.organizationName}
              </span>
            </p>
          )}
        </div>


        <div className="flex items-center gap-3">

          <span className="hidden text-xs text-slate-500 sm:block">
            Updated{" "}
            {lastUpdated.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          <button
            onClick={loadDashboardData}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

        </div>

      </div>


      {/* ==================================================
          MAIN METRICS
      ================================================== */}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          label="Active Projects"
          value={activeProjects}
          icon={<FolderKanban size={21} />}
          description="Projects currently in registry"
        />

        <StatCard
          label="Verified Projects"
          value={verifiedProjects}
          icon={<ShieldCheck size={21} />}
          description="Projects with verified status"
        />

        <StatCard
          label="Monitoring Projects"
          value={monitoringProjects}
          icon={<Satellite size={21} />}
          description="Projects under continuous monitoring"
        />

        <StatCard
          label="Carbon Impact"
          value={`${formatCarbonValue(totalCarbon)} tCO₂e`}
          icon={<Leaf size={21} />}
          description="Estimated registered project impact"
        />

      </div>


      {/* ==================================================
          QUICK ACTIONS
      ================================================== */}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <QuickAction
          to="/projects"
          icon={<FolderKanban size={20} />}
          title="Explore Projects"
          description="View registered restoration projects"
        />

        <QuickAction
          to="/evidence"
          icon={<UploadCloud size={20} />}
          title="Submit Evidence"
          description="Upload project evidence for review"
        />

        <QuickAction
          to="/verification"
          icon={<ClipboardCheck size={20} />}
          title="Review Verification"
          description="Inspect MRV verification results"
        />

        <QuickAction
          to="/monitoring"
          icon={<Satellite size={20} />}
          title="Open Monitoring"
          description="Track environmental indicators"
        />

      </div>


      {/* ==================================================
          PROJECTS + VERIFICATION QUEUE
      ================================================== */}

      <div className="mt-8 grid gap-6 xl:grid-cols-3">

        {/* Recent / Searchable Projects */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>
              <h3 className="font-semibold text-slate-900">
                Project Registry
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Search and access registered environmental projects.
              </p>
            </div>

            <Link
              to="/projects"
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View all
              <ArrowRight size={15} />
            </Link>

          </div>


          {/* Search */}

          <div className="relative mt-5">

            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search project, location or status..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-500 focus:border-emerald-500 focus:bg-white"
            />

          </div>


          {/* Project list */}

          <div className="mt-5 space-y-3">

            {filteredProjects.length > 0 ? (

              filteredProjects.slice(0, 5).map((project) => (

                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="group flex flex-col justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/30 sm:flex-row sm:items-center"
                >

                  <div className="min-w-0">

                    <div className="flex items-center gap-2">

                      <p className="truncate font-semibold text-slate-900">
                        {project.name}
                      </p>

                      <span className="shrink-0 text-xs font-medium text-slate-500">
                        {project.id}
                      </span>

                    </div>

                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                      <MapPin size={14} />
                      {project.location}
                      <span className="text-slate-400">
                        •
                      </span>
                      {project.area}
                    </p>

                  </div>


                  <div className="flex items-center gap-3">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        project.status === "Verified"
                          ? "bg-emerald-50 text-emerald-700"
                          : project.status === "Monitoring"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {project.status}
                    </span>

                    <ArrowRight
                      size={18}
                      className="text-slate-500 transition group-hover:text-emerald-600"
                    />

                  </div>

                </Link>

              ))

            ) : (

              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">

                <Search
                  size={28}
                  className="mx-auto text-slate-400"
                />

                <p className="mt-3 font-semibold text-slate-700">
                  No projects found
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Try searching for another project or location.
                </p>

              </div>

            )}

          </div>

        </div>


        {/* Verification Queue */}

        <div className="rounded-2xl bg-ocean p-6 text-white shadow-sm">

          <div className="flex items-center justify-between">

            <p className="text-sm font-semibold tracking-wide text-emerald-400">
              VERIFICATION QUEUE
            </p>

            <ShieldCheck
              size={20}
              className="text-emerald-400"
            />

          </div>

          <p className="mt-4 text-5xl font-bold text-white">
            {String(verificationQueue).padStart(2, "0")}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            evidence submissions or project reviews
            currently requiring attention.
          </p>


          <div className="mt-6 space-y-3">

            <QueueRow
              label="Needs review"
              value={reviewSubmissions}
            />

            <QueueRow
              label="Verified"
              value={verifiedSubmissions}
            />

            <QueueRow
              label="Evidence uploaded"
              value={evidence.length}
            />

          </div>


          <Link
            to="/verification"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Review verification
            <ArrowRight size={16} />
          </Link>

        </div>

      </div>


      {/* ==================================================
          MONITORING SNAPSHOT
      ================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">

        {/* Monitoring overview */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <div className="flex items-center gap-2">

                <Activity
                  size={18}
                  className="text-emerald-600"
                />

                <h3 className="font-semibold text-slate-900">
                  Monitoring Snapshot
                </h3>

              </div>

              <p className="mt-1 text-sm text-slate-600">
                Latest environmental indicators from the prototype monitoring layer.
              </p>

            </div>


            <Link
              to="/monitoring"
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Open monitoring
              <ArrowRight size={15} />
            </Link>

          </div>


          {latestMonitoring ? (

            <div className="mt-6 grid gap-4 sm:grid-cols-3">

              <MonitoringCard
                icon={<Leaf size={19} />}
                label="Vegetation Index"
                value={`${latestMonitoring.vegetation}%`}
                change={`+${vegetationChange}%`}
              />

              <MonitoringCard
                icon={<TrendingUp size={19} />}
                label="Carbon Indicator"
                value={`${latestMonitoring.carbon}`}
                change={`+${carbonChange} pts`}
              />

              <MonitoringCard
                icon={<Satellite size={19} />}
                label="Latest Period"
                value={latestMonitoring.month}
                change="Monitoring available"
              />

            </div>

          ) : (

            <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center">

              <Satellite
                size={28}
                className="mx-auto text-slate-400"
              />

              <p className="mt-3 font-semibold text-slate-700">
                No monitoring data available
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Monitoring data will appear here once a project is connected.
              </p>

            </div>

          )}

        </div>


        {/* Verification confidence */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-2">

            <FileCheck2
              size={18}
              className="text-emerald-600"
            />

            <h3 className="font-semibold text-slate-900">
              Verification Health
            </h3>

          </div>

          <p className="mt-1 text-sm text-slate-600">
            Current prototype verification performance.
          </p>


          <div className="mt-6">

            <div className="flex items-end justify-between">

              <div>

                <p className="text-sm font-medium text-slate-600">
                  Average confidence
                </p>

                <p className="mt-1 text-4xl font-bold text-emerald-700">
                  {averageConfidence}%
                </p>

              </div>

              <CheckCircle2
                size={28}
                className="text-emerald-600"
              />

            </div>


            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">

              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${Math.min(
                    Math.max(averageConfidence, 0),
                    100
                  )}%`,
                }}
              />

            </div>


            <div className="mt-5 space-y-3">

              <HealthRow
                label="Verified results"
                value={verifiedSubmissions}
              />

              <HealthRow
                label="Needs review"
                value={reviewSubmissions}
              />

              <HealthRow
                label="Evidence records"
                value={evidence.length}
              />

            </div>

          </div>

        </div>

      </div>


      {/* ==================================================
          PROJECT HEALTH
      ================================================== */}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>

            <h3 className="font-semibold text-slate-900">
              Project Health
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              Current restoration progress across registered projects.
            </p>

          </div>

          <Link
            to="/projects"
            className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Manage projects
            <ArrowRight size={15} />
          </Link>

        </div>


        <div className="mt-6 grid gap-4 md:grid-cols-3">

          {healthProjects.map((project) => (

            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="rounded-xl border border-slate-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/20"
            >

              <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">

                  <p className="truncate font-semibold text-slate-900">
                    {project.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    {project.location}
                  </p>

                </div>

                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {project.progress}%
                </span>

              </div>


              <div className="mt-4">

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${Math.min(
                        Math.max(project.progress, 0),
                        100
                      )}%`,
                    }}
                  />

                </div>

              </div>


              <div className="mt-4 flex items-center justify-between text-xs">

                <span className="text-slate-600">
                  {project.area}
                </span>

                <span className="font-semibold text-emerald-700">
                  {project.carbon}
                </span>

              </div>

            </Link>

          ))}

        </div>

      </div>


      {/* ==================================================
          SYSTEM / INTEGRATION STATUS
      ================================================== */}

      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-sm font-semibold text-emerald-700">
              BLUEGUARD PLATFORM
            </p>

            <p className="mt-1 text-sm text-slate-700">
              Dashboard is running in prototype data mode.
              Live backend, satellite and blockchain services
              can be connected to the same interface later.
            </p>

          </div>


          <div className="flex flex-wrap gap-2">

            <IntegrationBadge
              label="Registry"
              active
            />

            <IntegrationBadge
              label="Verification"
              active={verifications.length > 0}
            />

            <IntegrationBadge
              label="Monitoring"
              active={monitoringData.length > 0}
            />

            <IntegrationBadge
              label="Planet"
              active={false}
            />

            <IntegrationBadge
              label="Blockchain"
              active={false}
            />

          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  label,
  value,
  icon,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">

          <p className="text-sm font-medium text-slate-700">
            {label}
          </p>

          <p className="mt-2 break-words text-2xl font-bold text-emerald-700">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-600">
            {description}
          </p>

        </div>


        <div className="shrink-0 rounded-xl bg-emerald-50 p-3 text-emerald-600">
          {icon}
        </div>

      </div>

    </div>
  );
}


/* =========================================================
   QUICK ACTION
   ========================================================= */

function QuickAction({
  to,
  icon,
  title,
  description,
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
    >

      <div className="flex items-start gap-4">

        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 transition group-hover:bg-emerald-100">
          {icon}
        </div>

        <div className="min-w-0">

          <div className="flex items-center gap-2">

            <h3 className="font-semibold text-slate-900">
              {title}
            </h3>

            <ArrowRight
              size={15}
              className="text-slate-400 transition group-hover:text-emerald-600"
            />

          </div>

          <p className="mt-1 text-sm leading-5 text-slate-600">
            {description}
          </p>

        </div>

      </div>

    </Link>
  );
}


/* =========================================================
   QUEUE ROW
   ========================================================= */

function QueueRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0">

      <span className="text-sm text-slate-300">
        {label}
      </span>

      <span className="font-semibold text-white">
        {value}
      </span>

    </div>
  );
}


/* =========================================================
   MONITORING CARD
   ========================================================= */

function MonitoringCard({
  icon,
  label,
  value,
  change,
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">

      <div className="flex items-center gap-2">

        <div className="text-emerald-600">
          {icon}
        </div>

        <p className="text-sm font-medium text-slate-700">
          {label}
        </p>

      </div>

      <p className="mt-3 text-2xl font-bold text-emerald-700">
        {value}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-600">
        {change}
      </p>

    </div>
  );
}


/* =========================================================
   HEALTH ROW
   ========================================================= */

function HealthRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">

      <span className="text-sm text-slate-700">
        {label}
      </span>

      <span className="font-semibold text-emerald-700">
        {value}
      </span>

    </div>
  );
}


/* =========================================================
   INTEGRATION BADGE
   ========================================================= */

function IntegrationBadge({
  label,
  active,
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
        active
          ? "bg-white text-emerald-700"
          : "bg-white/70 text-slate-600"
      }`}
    >

      <span
        className={`h-2 w-2 rounded-full ${
          active
            ? "bg-emerald-500"
            : "bg-slate-400"
        }`}
      />

      {label}

    </span>
  );
}