import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Cloud,
  CloudOff,
  Compass,
  Crosshair,
  Download,
  Eye,
  EyeOff,
  Gauge,
  Layers3,
  Leaf,
  LocateFixed,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Minus,
  Navigation,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Satellite,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Waves,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  ScaleControl,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { projects, monitoringData } from "../data/mockData";

/*
  ================================================================
  BLUEGUARD — SATELLITE MONITORING COMMAND CENTER
  ================================================================

  Current mode:
    - Uses the existing project/mock monitoring data.
    - Uses public OpenStreetMap + ArcGIS World Imagery tiles.
    - Generates a clearly-labelled prototype analysis layer.

  Production integration:
    - Planet imagery/data should be requested by the FastAPI backend.
    - Never put the Planet API key in React/Vite frontend code.
    - Set VITE_API_BASE_URL when the backend endpoint is ready.

  Expected future backend endpoint:
    GET /monitoring/projects/{projectId}

  Suggested response shape:
    {
      "project_id": "BG-001",
      "source": "Planet",
      "latest_observation": "2026-08-21",
      "cloud_cover": 8.4,
      "resolution_m": 3,
      "imagery_url": "...",
      "vegetation_index": 74.2,
      "water_coverage": 38.6,
      "restoration_health": 86,
      "change_percent": 12.4,
      "risk_level": "Low",
      "observations": [...]
    }
*/

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const DEFAULT_CENTER = [20.5937, 78.9629];

const satelliteTile =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const mapTile =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";

const terrainTile =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";

const labelsTile =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

const projectIcon = L.divIcon({
  className: "blueguard-monitoring-marker",
  html: `
    <div style="
      width:34px;
      height:34px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      background:#059669;
      border:3px solid #ffffff;
      box-shadow:0 5px 18px rgba(15,23,42,.35);
      display:flex;
      align-items:center;
      justify-content:center;
    ">
      <div style="
        width:10px;
        height:10px;
        border-radius:50%;
        background:#ffffff;
      "></div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getCoordinates(project) {
  if (
    Array.isArray(project?.coordinates) &&
    project.coordinates.length >= 2
  ) {
    const lat = safeNumber(project.coordinates[0], DEFAULT_CENTER[0]);
    const lng = safeNumber(project.coordinates[1], DEFAULT_CENTER[1]);
    return [lat, lng];
  }

  return DEFAULT_CENTER;
}

function createBoundary([lat, lng], scale = 1) {
  const latOffset = 0.035 * scale;
  const lngOffset = 0.045 * scale;

  return [
    [lat + latOffset, lng - lngOffset],
    [lat + latOffset * 0.55, lng + lngOffset],
    [lat - latOffset * 0.55, lng + lngOffset * 0.85],
    [lat - latOffset, lng - lngOffset * 0.7],
  ];
}

function createMonitoringPoints(center) {
  const [lat, lng] = center;

  return [
    {
      id: "MP-01",
      coordinates: [lat + 0.011, lng - 0.014],
      health: 91,
      type: "Healthy",
      signal: "Vegetation",
    },
    {
      id: "MP-02",
      coordinates: [lat - 0.008, lng + 0.018],
      health: 84,
      type: "Stable",
      signal: "Water",
    },
    {
      id: "MP-03",
      coordinates: [lat - 0.018, lng - 0.006],
      health: 72,
      type: "Watch",
      signal: "Change detected",
    },
  ];
}

function getHistory(source) {
  if (Array.isArray(source) && source.length) {
    return source.map((item, index) => ({
      label: item.month || item.date || `Observation ${index + 1}`,
      vegetation: safeNumber(item.vegetation, 60 + index * 2),
      carbon: safeNumber(item.carbon, 50 + index * 3),
    }));
  }

  return [
    { label: "Jan", vegetation: 61, carbon: 54 },
    { label: "Feb", vegetation: 64, carbon: 57 },
    { label: "Mar", vegetation: 66, carbon: 61 },
    { label: "Apr", vegetation: 69, carbon: 64 },
    { label: "May", vegetation: 71, carbon: 67 },
    { label: "Jun", vegetation: 73, carbon: 70 },
  ];
}

function MapInteraction({ onCursorMove }) {
  useMapEvents({
    mousemove(event) {
      onCursorMove?.([event.latlng.lat, event.latlng.lng]);
    },
    mouseout() {
      onCursorMove?.(null);
    },
  });

  return null;
}

function MapController({
  coordinates,
  onZoomIn,
  onZoomOut,
  onLocate,
  onFullscreen,
}) {
  const map = useMap();

  useEffect(() => {
    if (!Array.isArray(coordinates)) return;

    map.flyTo(coordinates, 12, {
      duration: 0.8,
    });
  }, [coordinates, map]);

  useEffect(() => {
    onZoomIn.current = () => map.zoomIn();
    onZoomOut.current = () => map.zoomOut();
    onLocate.current = () =>
      map.flyTo(coordinates, 13, {
        duration: 0.8,
      });
    onFullscreen.current = () => {
      const container = map.getContainer();

      if (!document.fullscreenElement) {
        container.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    };
  }, [
    coordinates,
    map,
    onFullscreen,
    onLocate,
    onZoomIn,
    onZoomOut,
  ]);

  return null;
}

function MapControlButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:bg-emerald-50 hover:text-emerald-700"
    >
      {icon}
    </button>
  );
}

function MetricCard({
  icon,
  label,
  value,
  change,
  description,
  trend = "up",
}) {
  const positive = trend === "up";
  const negative = trend === "down";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
          {icon}
        </div>

        {change && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
              positive
                ? "bg-emerald-50 text-emerald-700"
                : negative
                ? "bg-rose-50 text-rose-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {positive ? (
              <TrendingUp size={13} />
            ) : negative ? (
              <TrendingDown size={13} />
            ) : null}
            {change}
          </span>
        )}
      </div>

      <p className="mt-5 text-sm font-semibold text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

function MiniSparkline({ values }) {
  const safeValues = values.length ? values : [0, 10, 20];

  const width = 300;
  const height = 72;
  const padding = 6;
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = max - min || 1;

  const points = safeValues
    .map((value, index) => {
      const x =
        padding +
        (index / Math.max(safeValues.length - 1, 1)) *
          (width - padding * 2);

      const y =
        height -
        padding -
        ((value - min) / range) *
          (height - padding * 2);

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-16 w-full overflow-visible"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="#059669"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusPill({ children, tone = "green" }) {
  const styles = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-sky-50 text-sky-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        styles[tone] || styles.green
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

function LayerToggle({ icon, label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-2.5 transition hover:bg-slate-50">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className="text-emerald-600">{icon}</span>
        {label}
      </span>

      <button
        type="button"
        onClick={onChange}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-emerald-500" : "bg-slate-300"
        }`}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </label>
  );
}

export default function Monitoring() {
  const [selectedProject, setSelectedProject] = useState(
    projects[0]?.id || ""
  );

  const [mapMode, setMapMode] = useState("satellite");
  const [cursorCoordinates, setCursorCoordinates] = useState(null);
  const [showLayers, setShowLayers] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [showProject, setShowProject] = useState(true);
  const [showMonitoringPoints, setShowMonitoringPoints] =
    useState(true);
  const [showChangeZone, setShowChangeZone] = useState(false);
  const [showNearbyProjects, setShowNearbyProjects] =
    useState(false);

  const [selectedObservation, setSelectedObservation] =
    useState("latest");

  const [playingTimeline, setPlayingTimeline] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [opacity, setOpacity] = useState(100);

  const [apiState, setApiState] = useState("demo");
  const [apiData, setApiData] = useState(null);
  const [apiError, setApiError] = useState("");

  const zoomInRef = useMemo(() => ({ current: null }), []);
  const zoomOutRef = useMemo(() => ({ current: null }), []);
  const locateRef = useMemo(() => ({ current: null }), []);
  const fullscreenRef = useMemo(() => ({ current: null }), []);

  const project =
    projects.find((item) => item.id === selectedProject) ||
    projects[0];

  const coordinates = useMemo(
    () => getCoordinates(project),
    [project]
  );

  const boundary = useMemo(
    () => createBoundary(coordinates),
    [coordinates]
  );

  const monitoringPoints = useMemo(
    () => createMonitoringPoints(coordinates),
    [coordinates]
  );

  const history = useMemo(
    () => getHistory(monitoringData),
    []
  );

  const latest = history[history.length - 1] || {
    vegetation: 72,
    carbon: 70,
    label: "Latest",
  };

  const previous =
    history[history.length - 2] || latest;

  const vegetationChange =
    latest.vegetation - previous.vegetation;

  const carbonChange =
    latest.carbon - previous.carbon;

  const health = Math.min(
    98,
    Math.max(
      45,
      Math.round(
        latest.vegetation * 0.75 +
          Math.min(project?.progress || 50, 100) * 0.25
      )
    )
  );

  const waterCoverage = Math.min(
    95,
    Math.max(15, Math.round(28 + latest.vegetation * 0.14))
  );

  const changeArea = Math.max(
    0.5,
    Number(
      ((safeNumber(project?.progress, 60) / 100) *
        safeNumber(
          String(project?.area || "").replace(/[^\d.]/g, ""),
          100
        ) *
        0.124
      ).toFixed(1)
    )
  );

  const observationDate = new Date().toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  const observationLabel =
    selectedObservation === "latest"
      ? observationDate
      : selectedObservation;

  /*
    Optional real backend integration.
    Planet credentials remain server-side.
  */
  useEffect(() => {
    let cancelled = false;

    async function loadMonitoring() {
      setApiError("");

      if (!API_BASE_URL || !project?.id) {
        setApiState("demo");
        setApiData(null);
        return;
      }

      try {
        setApiState("loading");

        const response = await fetch(
          `${API_BASE_URL.replace(/\/$/, "")}/monitoring/projects/${project.id}`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Monitoring API returned ${response.status}`
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setApiData(data);
          setApiState("live");
        }
      } catch (error) {
        if (!cancelled) {
          setApiState("error");
          setApiData(null);
          setApiError(
            error?.message ||
              "Monitoring API is currently unavailable."
          );
        }
      }
    }

    loadMonitoring();

    return () => {
      cancelled = true;
    };
  }, [project?.id]);

  useEffect(() => {
    if (!playingTimeline) return;

    const timer = setInterval(() => {
      setSelectedObservation((current) => {
        if (current === "latest") return history[0]?.label || "latest";

        const index = history.findIndex(
          (item) => item.label === current
        );

        const next = index + 1;

        if (next >= history.length) {
          return "latest";
        }

        return history[next].label;
      });
    }, 1400);

    return () => clearInterval(timer);
  }, [playingTimeline, history]);

  const liveVegetation =
    safeNumber(
      apiData?.vegetation_index ??
        apiData?.vegetation ??
        latest.vegetation,
      latest.vegetation
    );

  const liveHealth = safeNumber(
    apiData?.restoration_health ?? health,
    health
  );

  const liveWater = safeNumber(
    apiData?.water_coverage ?? waterCoverage,
    waterCoverage
  );

  const sourceLabel =
    apiState === "live"
      ? apiData?.source || "Planet"
      : "Prototype dataset";

  const nearbyProjects = projects.filter(
    (item) => item.id !== project?.id
  );

  const currentTimeline =
    selectedObservation === "latest"
      ? latest
      : history.find(
          (item) => item.label === selectedObservation
        ) || latest;

  const mapCenter = coordinates || DEFAULT_CENTER;

  function handleRefresh() {
    if (!project) return;

    setSelectedObservation("latest");

    if (API_BASE_URL) {
      setApiState("loading");

      fetch(
        `${API_BASE_URL.replace(
          /\/$/,
          ""
        )}/monitoring/projects/${project.id}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          return response.json();
        })
        .then((data) => {
          setApiData(data);
          setApiState("live");
          setApiError("");
        })
        .catch((error) => {
          setApiState("error");
          setApiData(null);
          setApiError(error?.message || "Unable to refresh.");
        });
    }
  }

  function exportSnapshot() {
    const payload = {
      project: project?.name,
      project_id: project?.id,
      location: project?.location,
      coordinates,
      observation_date: observationLabel,
      source: sourceLabel,
      vegetation_index: liveVegetation,
      water_coverage: liveWater,
      monitoring_health: liveHealth,
      vegetation_change_percent: Number(
        vegetationChange.toFixed(2)
      ),
      carbon_change_points: Number(
        carbonChange.toFixed(2)
      ),
      change_area_ha: changeArea,
      risk:
        liveHealth >= 80
          ? "Low"
          : liveHealth >= 65
          ? "Moderate"
          : "High",
      generated_at: new Date().toISOString(),
      prototype: apiState !== "live",
    };

    const blob = new Blob(
      [JSON.stringify(payload, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${project?.id || "blueguard"}-monitoring-snapshot.json`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-8">
      {/* =========================================================
          HEADER
      ========================================================= */}
      <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Satellite size={19} />
            </span>

            <p className="text-sm font-bold tracking-wide text-emerald-700">
              BLUEGUARD • SATELLITE INTELLIGENCE
            </p>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl">
            Environmental Monitoring
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Observe restoration progress, satellite observations,
            environmental signals and spatial changes over time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <StatusPill
            tone={
              apiState === "live"
                ? "green"
                : apiState === "loading"
                ? "blue"
                : apiState === "error"
                ? "red"
                : "amber"
            }
          >
            {apiState === "live"
              ? "Satellite API Connected"
              : apiState === "loading"
              ? "Updating"
              : apiState === "error"
              ? "API Unavailable"
              : "Prototype Data"}
          </StatusPill>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700"
          >
            <RefreshCw
              size={16}
              className={
                apiState === "loading"
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportSnapshot}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* =========================================================
          PROJECT SELECTOR / OBSERVATION BAR
      ========================================================= */}
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(220px,1fr)_auto] lg:items-end">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Monitoring Project
            </label>

            <div className="relative">
              <select
                value={selectedProject}
                onChange={(event) =>
                  setSelectedProject(event.target.value)
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
              >
                {projects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id} • {item.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3 top-3.5 text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Observation
            </label>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <CalendarDays
                size={16}
                className="text-emerald-600"
              />
              {observationLabel}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setPlayingTimeline((value) => !value)
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
            >
              {playingTimeline ? (
                <Pause size={16} />
              ) : (
                <Play size={16} />
              )}
              Timeline
            </button>

            <button
              type="button"
              onClick={() => setCompareMode((value) => !value)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                compareMode
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-200"
              }`}
            >
              <Layers3 size={16} />
              Compare
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          PROJECT MISSION CARD
      ========================================================= */}
      {project && (
        <section className="mt-6 overflow-hidden rounded-3xl bg-ocean shadow-sm">
          <div className="p-6 lg:p-7">
            <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill
                    tone={
                      project.status === "Verified"
                        ? "green"
                        : project.status === "Under Review"
                        ? "amber"
                        : "blue"
                    }
                  >
                    {project.status}
                  </StatusPill>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
                    {project.id}
                  </span>

                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                    {sourceLabel}
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-bold text-white lg:text-3xl">
                  {project.name}
                </h2>

                <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                  <Navigation size={15} />
                  {project.location}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <DarkStat
                  label="Area"
                  value={project.area || "—"}
                />
                <DarkStat
                  label="Carbon"
                  value={project.carbon || "—"}
                />
                <DarkStat
                  label="Progress"
                  value={`${safeNumber(project.progress, 0)}%`}
                />
                <DarkStat
                  label="Health"
                  value={`${liveHealth}%`}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          KPI GRID
      ========================================================= */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={<Leaf size={20} />}
          label="Vegetation Index"
          value={`${liveVegetation.toFixed(1)}%`}
          change={`${vegetationChange >= 0 ? "+" : ""}${vegetationChange.toFixed(1)}%`}
          description="Latest environmental signal"
          trend={vegetationChange >= 0 ? "up" : "down"}
        />

        <MetricCard
          icon={<Waves size={20} />}
          label="Water Coverage"
          value={`${liveWater.toFixed(1)}%`}
          change="+4.8%"
          description="Estimated monitored coverage"
        />

        <MetricCard
          icon={<Gauge size={20} />}
          label="Monitoring Health"
          value={`${liveHealth}%`}
          change={liveHealth >= 80 ? "Healthy" : "Watch"}
          description="Composite prototype score"
        />

        <MetricCard
          icon={<Satellite size={20} />}
          label="Satellite Feed"
          value={apiState === "live" ? "LIVE" : "DEMO"}
          change={apiState === "live" ? "Connected" : "Awaiting API"}
          description={
            apiState === "live"
              ? "Backend satellite service"
              : "Safe prototype fallback"
          }
        />

        <MetricCard
          icon={<Activity size={20} />}
          label="Detected Change"
          value={`${changeArea} ha`}
          change="Spatial signal"
          description="Area requiring analysis"
        />
      </div>

      {/* =========================================================
          MAIN MAP + INTELLIGENCE
      ========================================================= */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(330px,0.8fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <MapIcon
                  size={18}
                  className="text-emerald-600"
                />
                <h3 className="font-bold text-slate-900">
                  Geospatial Monitoring Map
                </h3>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Project boundary, observation zones and satellite
                context.
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {[
                ["map", "Map"],
                ["satellite", "Satellite"],
                ["terrain", "Terrain"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMapMode(value)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold ${
                    mapMode === value
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative h-[500px] w-full">
            <MapContainer
              center={mapCenter}
              zoom={12}
              scrollWheelZoom
              className="h-full w-full"
            >
              {mapMode === "map" && (
                <TileLayer
                  attribution="Tiles &copy; Esri"
                  url={mapTile}
                />
              )}

              {mapMode === "terrain" && (
                <TileLayer
                  attribution="Tiles &copy; Esri"
                  url={terrainTile}
                />
              )}

              {mapMode === "satellite" && (
                <>
                  <TileLayer
                    attribution="Tiles &copy; Esri"
                    url={satelliteTile}
                    opacity={opacity / 100}
                  />
                  <TileLayer
                    attribution="&copy; Esri"
                    url={labelsTile}
                    opacity={Math.min(1, opacity / 100 + 0.15)}
                  />
                </>
              )}

              <ScaleControl position="bottomleft" imperial={false} maxWidth={180} />
              <MapInteraction onCursorMove={setCursorCoordinates} />

              <MapController
                coordinates={mapCenter}
                onZoomIn={zoomInRef}
                onZoomOut={zoomOutRef}
                onLocate={locateRef}
                onFullscreen={fullscreenRef}
              />

              {showBoundary && (
                <Polygon
                  positions={boundary}
                  pathOptions={{
                    color: "#059669",
                    fillColor: "#10b981",
                    fillOpacity: 0.17,
                    weight: 3,
                  }}
                >
                  <Popup>
                    <div className="min-w-[220px]">
                      <p className="text-xs font-bold text-emerald-600">
                        PROJECT BOUNDARY
                      </p>
                      <p className="mt-1 font-bold text-slate-900">
                        {project?.name}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Area:{" "}
                        <strong className="text-slate-900">
                          {project?.area || "—"}
                        </strong>
                      </p>
                    </div>
                  </Popup>
                </Polygon>
              )}

              {showProject && (
                <Marker
                  position={mapCenter}
                  icon={projectIcon}
                >
                  <Popup>
                    <div className="min-w-[230px]">
                      <p className="text-xs font-bold text-emerald-600">
                        BLUEGUARD PROJECT
                      </p>
                      <p className="mt-1 font-bold text-slate-900">
                        {project?.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {project?.location}
                      </p>
                      <div className="mt-3 border-t border-slate-200 pt-3">
                        <p className="text-xs text-slate-500">
                          Coordinates
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-900">
                          {mapCenter[0].toFixed(5)},{" "}
                          {mapCenter[1].toFixed(5)}
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {showMonitoringPoints &&
                monitoringPoints.map((point) => (
                  <CircleMarker
                    key={point.id}
                    center={point.coordinates}
                    radius={8}
                    pathOptions={{
                      color:
                        point.health >= 85
                          ? "#059669"
                          : point.health >= 75
                          ? "#d97706"
                          : "#e11d48",
                      fillColor:
                        point.health >= 85
                          ? "#10b981"
                          : point.health >= 75
                          ? "#f59e0b"
                          : "#f43f5e",
                      fillOpacity: 0.75,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="min-w-[190px]">
                        <p className="text-xs font-bold text-emerald-600">
                          MONITORING POINT
                        </p>
                        <p className="mt-1 font-bold text-slate-900">
                          {point.id}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Signal: {point.signal}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          Health: {point.health}%
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Status: {point.type}
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}

              {showChangeZone && (
                <Circle
                  center={[
                    mapCenter[0] - 0.012,
                    mapCenter[1] + 0.014,
                  ]}
                  radius={1800}
                  pathOptions={{
                    color: "#f59e0b",
                    fillColor: "#f59e0b",
                    fillOpacity: 0.14,
                    dashArray: "8 8",
                    weight: 2,
                  }}
                >
                  <Popup>
                    <p className="font-bold text-amber-700">
                      CHANGE DETECTION ZONE
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Prototype spatial-change overlay. Real
                      boundaries will come from satellite analysis.
                    </p>
                  </Popup>
                </Circle>
              )}

              {showNearbyProjects &&
                nearbyProjects.map((item, index) => {
                  const itemCoords = getCoordinates(item);

                  return (
                    <CircleMarker
                      key={`nearby-${item.id}`}
                      center={[
                        itemCoords[0] +
                          (index + 1) * 0.03,
                        itemCoords[1] +
                          (index % 2 === 0 ? 1 : -1) *
                            0.03,
                      ]}
                      radius={6}
                      pathOptions={{
                        color: "#0f766e",
                        fillColor: "#14b8a6",
                        fillOpacity: 0.8,
                      }}
                    >
                      <Popup>
                        <p className="text-xs font-bold text-teal-700">
                          BLUEGUARD PROJECT
                        </p>
                        <p className="mt-1 font-bold text-slate-900">
                          {item.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {item.location}
                        </p>
                      </Popup>
                    </CircleMarker>
                  );
                })}
            </MapContainer>

            <div className="pointer-events-none absolute left-4 top-4 z-[1000] rounded-xl border border-white/60 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  {mapMode === "satellite" ? "Satellite + Places" : mapMode === "terrain" ? "Topographic" : "Detailed Street Map"}
                </p>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                {project?.location || "Project area"}
              </p>
            </div>

            <div className="pointer-events-none absolute bottom-4 right-4 z-[1000] rounded-xl border border-white/60 bg-slate-950/90 px-3 py-2 text-white shadow-lg">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-300">
                Cursor coordinates
              </p>
              <p className="mt-1 font-mono text-xs font-semibold">
                {cursorCoordinates
                  ? `${cursorCoordinates[0].toFixed(5)}°, ${cursorCoordinates[1].toFixed(5)}°`
                  : `${coordinates[0].toFixed(5)}°, ${coordinates[1].toFixed(5)}°`}
              </p>
            </div>

            {/* Map controls */}
            <div className="pointer-events-none absolute right-20 top-4 z-[1000] flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-800 shadow-lg">
              <div className="text-center leading-none">
                <div className="text-[9px] font-black">N</div>
                <Navigation size={14} className="mx-auto mt-0.5 rotate-0 text-emerald-600" />
              </div>
            </div>

            <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
              <MapControlButton
                icon={<Plus size={17} />}
                label="Zoom in"
                onClick={() =>
                  zoomInRef.current?.()
                }
              />

              <MapControlButton
                icon={<Minus size={17} />}
                label="Zoom out"
                onClick={() =>
                  zoomOutRef.current?.()
                }
              />

              <MapControlButton
                icon={<LocateFixed size={17} />}
                label="Center on project"
                onClick={() =>
                  locateRef.current?.()
                }
              />

              <MapControlButton
                icon={<Maximize2 size={17} />}
                label="Fullscreen map"
                onClick={() =>
                  fullscreenRef.current?.()
                }
              />
            </div>

            {/* Layer panel */}
            {showLayers && (
              <div className="absolute left-4 top-4 z-[1000] w-[245px] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur">
                <div className="mb-2 flex items-center justify-between px-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Map layers
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Control spatial overlays
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowLayers(false)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Close layers"
                  >
                    <X size={15} />
                  </button>
                </div>

                <LayerToggle
                  icon={<Eye size={15} />}
                  label="Project boundary"
                  checked={showBoundary}
                  onChange={() =>
                    setShowBoundary((value) => !value)
                  }
                />

                <LayerToggle
                  icon={<MapIcon size={15} />}
                  label="Project location"
                  checked={showProject}
                  onChange={() =>
                    setShowProject((value) => !value)
                  }
                />

                <LayerToggle
                  icon={<Crosshair size={15} />}
                  label="Monitoring points"
                  checked={showMonitoringPoints}
                  onChange={() =>
                    setShowMonitoringPoints(
                      (value) => !value
                    )
                  }
                />

                <LayerToggle
                  icon={<AlertTriangle size={15} />}
                  label="Change zone"
                  checked={showChangeZone}
                  onChange={() =>
                    setShowChangeZone((value) => !value)
                  }
                />

                <LayerToggle
                  icon={<Navigation size={15} />}
                  label="Nearby projects"
                  checked={showNearbyProjects}
                  onChange={() =>
                    setShowNearbyProjects(
                      (value) => !value
                    )
                  }
                />

                {mapMode === "satellite" && (
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-xs font-bold text-slate-600">
                        Imagery opacity
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        {opacity}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={opacity}
                      onChange={(event) =>
                        setOpacity(
                          Number(event.target.value)
                        )
                      }
                      className="mt-2 w-full accent-emerald-600"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Layer open button */}
            {!showLayers && (
              <button
                type="button"
                onClick={() => setShowLayers(true)}
                className="absolute bottom-4 right-4 z-[1000] inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 shadow-lg hover:text-emerald-700"
              >
                <Layers3 size={15} />
                Layers
              </button>
            )}

            {/* Map legend */}
            <div className="absolute bottom-4 left-4 z-[1000] rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Legend
              </p>

              <LegendItem
                color="bg-emerald-500"
                label="Project boundary"
              />
              <LegendItem
                color="bg-sky-500"
                label="Monitoring point"
              />
              {showChangeZone && (
                <LegendItem
                  color="bg-amber-500"
                  label="Change zone"
                />
              )}
            </div>

            {/* Compare overlay */}
            {compareMode && (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-[900] flex justify-center pt-4">
                <div className="rounded-full bg-slate-900/90 px-4 py-2 text-xs font-bold text-white shadow-lg">
                  BEFORE / AFTER COMPARISON • Prototype
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span>
                Source:{" "}
                <strong className="text-slate-700">
                  {sourceLabel}
                </strong>
              </span>
              <span>
                Observation:{" "}
                <strong className="text-slate-700">
                  {observationLabel}
                </strong>
              </span>
              <span>
                Coordinates:{" "}
                <strong className="text-slate-700">
                  {mapCenter[0].toFixed(4)},{" "}
                  {mapCenter[1].toFixed(4)}
                </strong>
              </span>
            </div>

            <StatusPill
              tone={apiState === "live" ? "green" : "amber"}
            >
              {apiState === "live"
                ? "Verified API response"
                : "Prototype visualization"}
            </StatusPill>
          </div>
        </section>

        {/* =======================================================
            INTELLIGENCE PANEL
        ======================================================= */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Environmental intelligence
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Site health
                </h3>
              </div>

              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <Sparkles size={19} />
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold text-slate-900">
                  {liveHealth}%
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  composite monitoring health
                </p>
              </div>

              <StatusPill
                tone={
                  liveHealth >= 80
                    ? "green"
                    : liveHealth >= 65
                    ? "amber"
                    : "red"
                }
              >
                {liveHealth >= 80
                  ? "Healthy"
                  : liveHealth >= 65
                  ? "Watch"
                  : "High Risk"}
              </StatusPill>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{
                  width: `${Math.min(
                    Math.max(liveHealth, 0),
                    100
                  )}%`,
                }}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniValue
                label="Vegetation"
                value={`${liveVegetation.toFixed(1)}%`}
              />
              <MiniValue
                label="Water"
                value={`${liveWater.toFixed(1)}%`}
              />
              <MiniValue
                label="Change"
                value={`${changeArea} ha`}
              />
              <MiniValue
                label="Risk"
                value={
                  liveHealth >= 80
                    ? "Low"
                    : liveHealth >= 65
                    ? "Moderate"
                    : "High"
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">
                  Data quality
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Observation readiness
                </p>
              </div>

              {apiState === "live" ? (
                <CheckCircle2
                  size={21}
                  className="text-emerald-600"
                />
              ) : (
                <CloudOff
                  size={21}
                  className="text-amber-600"
                />
              )}
            </div>

            <div className="mt-5 space-y-3">
              <QualityRow
                label="Location"
                value="Available"
                good
              />
              <QualityRow
                label="Boundary"
                value="Available"
                good
              />
              <QualityRow
                label="Satellite feed"
                value={
                  apiState === "live"
                    ? "Connected"
                    : "Demo"
                }
                good={apiState === "live"}
              />
              <QualityRow
                label="Environmental analysis"
                value={
                  apiState === "live"
                    ? "Available"
                    : "Prototype"
                }
                good={apiState === "live"}
              />
            </div>
          </section>
        </div>
      </div>

      {/* =========================================================
          TIMELINE + CHANGE DETECTION
      ========================================================= */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.75fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3
                  size={18}
                  className="text-emerald-600"
                />
                <h3 className="font-bold text-slate-900">
                  Satellite observation timeline
                </h3>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Review environmental signals across monitoring
                periods.
              </p>
            </div>

            <StatusPill tone="blue">
              {history.length} observations
            </StatusPill>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Selected observation
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {currentTimeline.label}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-500">
                  Vegetation
                </p>
                <p className="text-lg font-bold text-emerald-700">
                  {currentTimeline.vegetation}%
                </p>
              </div>
            </div>

            <div className="mt-5">
              <MiniSparkline
                values={history.map(
                  (item) => item.vegetation
                )}
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto pb-2">
            <div className="flex min-w-max items-center gap-2">
              {history.map((item, index) => {
                const active =
                  selectedObservation === item.label;

                return (
                  <button
                    type="button"
                    key={`${item.label}-${index}`}
                    onClick={() =>
                      setSelectedObservation(item.label)
                    }
                    className="group flex min-w-[105px] flex-col items-center"
                  >
                    <span
                      className={`h-3 w-3 rounded-full border-4 transition ${
                        active
                          ? "border-emerald-100 bg-emerald-600"
                          : "border-slate-100 bg-slate-400 group-hover:bg-emerald-500"
                      }`}
                    />

                    {index < history.length - 1 && (
                      <span className="absolute" />
                    )}

                    <span
                      className={`mt-2 text-xs font-bold ${
                        active
                          ? "text-emerald-700"
                          : "text-slate-500"
                      }`}
                    >
                      {item.label}
                    </span>

                    <span className="mt-1 text-[11px] text-slate-400">
                      {item.vegetation}%
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() =>
                  setSelectedObservation("latest")
                }
                className={`flex min-w-[105px] flex-col items-center ${
                  selectedObservation === "latest"
                    ? "text-emerald-700"
                    : "text-slate-500"
                }`}
              >
                <span className="h-3 w-3 rounded-full border-4 border-emerald-100 bg-emerald-600" />
                <span className="mt-2 text-xs font-bold">
                  Latest
                </span>
                <span className="mt-1 text-[11px] text-slate-400">
                  {latest.vegetation}%
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                Change detection
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">
                Before → After
              </h3>
            </div>

            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <Activity size={19} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <CompareBox
              label="Previous"
              value={`${previous.vegetation}%`}
              sublabel={previous.label}
            />
            <CompareBox
              label="Latest"
              value={`${latest.vegetation}%`}
              sublabel={latest.label}
              active
            />
          </div>

          <div className="mt-5 rounded-xl bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <TrendingUp
                size={19}
                className="mt-0.5 text-emerald-600"
              />
              <div>
                <p className="font-bold text-emerald-800">
                  {vegetationChange >= 0
                    ? "Positive vegetation signal"
                    : "Vegetation signal declined"}
                </p>
                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  {Math.abs(
                    vegetationChange
                  ).toFixed(1)}
                  % change compared with the previous available
                  observation.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniValue
              label="Area flagged"
              value={`${changeArea} ha`}
            />
            <MiniValue
              label="Carbon signal"
              value={`${carbonChange >= 0 ? "+" : ""}${carbonChange.toFixed(1)} pts`}
            />
          </div>
        </section>
      </div>

      {/* =========================================================
          ALERTS / VERIFICATION CONNECTION
      ========================================================= */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">
                  Monitoring events
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Events that may require attention.
                </p>
              </div>

              <StatusPill tone="green">
                System stable
              </StatusPill>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            <EventRow
              icon={<CheckCircle2 size={18} />}
              title="Vegetation signal improving"
              message={`Current signal is ${latest.vegetation}% with a ${vegetationChange >= 0 ? "+" : ""}${vegetationChange.toFixed(1)}% change.`}
              tone="green"
            />

            <EventRow
              icon={<Satellite size={18} />}
              title="Satellite observation available"
              message={
                apiState === "live"
                  ? "Latest observation received from the monitoring backend."
                  : "Prototype observation is available while the satellite API is being connected."
              }
              tone={apiState === "live" ? "green" : "amber"}
            />

            <EventRow
              icon={<AlertTriangle size={18} />}
              title="Spatial change requires analysis"
              message={`${changeArea} ha is currently flagged as a prototype change-detection zone.`}
              tone="amber"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Verification pipeline
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">
                Monitoring → Human verifier
              </h3>
            </div>

            <ShieldCheck
              size={21}
              className="text-emerald-600"
            />
          </div>

          <div className="mt-6 space-y-3">
            <PipelineStep
              number="01"
              title="Satellite observation"
              description="Acquire imagery and metadata."
              active
            />

            <PipelineStep
              number="02"
              title="Environmental analysis"
              description="Calculate change and risk indicators."
              active={apiState === "live"}
            />

            <PipelineStep
              number="03"
              title="Evidence consistency"
              description="Compare monitoring results with submitted evidence."
              active={false}
            />

            <PipelineStep
              number="04"
              title="Human verification"
              description="Final approve/reject decision by verifier."
              active={false}
            />
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-700">
              Important
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Satellite analysis supports the verifier. It does
              not automatically approve an environmental project.
            </p>
          </div>
        </section>
      </div>

      {/* =========================================================
          API ERROR / PROTOTYPE NOTICE
      ========================================================= */}
      {apiError && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <AlertTriangle
            size={19}
            className="mt-0.5 text-rose-600"
          />
          <div>
            <p className="font-bold text-rose-800">
              Satellite backend unavailable
            </p>
            <p className="mt-1 text-sm text-rose-700">
              {apiError}. BlueGuard is safely using the prototype
              dataset instead of pretending that live imagery was
              received.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <Cloud
            size={19}
            className="mt-0.5 text-emerald-700"
          />

          <div>
            <p className="font-bold text-emerald-900">
              Satellite integration status
            </p>

            <p className="mt-1 text-sm leading-6 text-emerald-800">
              The monitoring interface is ready for a real
              satellite backend. Current values are explicitly
              treated as prototype data until the Planet/FastAPI
              pipeline is connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SMALL UI COMPONENTS
   ================================================================ */

function DarkStat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/10 px-4 py-3">
      <p className="text-[11px] font-semibold text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function MiniValue({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function QualityRow({ label, value, good }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <span
        className={`inline-flex items-center gap-1.5 text-xs font-bold ${
          good ? "text-emerald-700" : "text-amber-700"
        }`}
      >
        {good ? (
          <CheckCircle2 size={14} />
        ) : (
          <AlertTriangle size={14} />
        )}
        {value}
      </span>
    </div>
  );
}

function CompareBox({
  label,
  value,
  sublabel,
  active = false,
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        active
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className="text-xs font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-slate-500">
        {sublabel}
      </p>
    </div>
  );
}

function EventRow({
  icon,
  title,
  message,
  tone = "green",
}) {
  const styles = {
    green: {
      box: "bg-emerald-50 text-emerald-600",
      title: "text-slate-900",
    },
    amber: {
      box: "bg-amber-50 text-amber-600",
      title: "text-slate-900",
    },
    red: {
      box: "bg-rose-50 text-rose-600",
      title: "text-slate-900",
    },
  };

  const style = styles[tone] || styles.green;

  return (
    <div className="flex items-start gap-4 p-5">
      <div
        className={`rounded-xl p-3 ${style.box}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`font-bold ${style.title}`}>
          {title}
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          {message}
        </p>
      </div>
    </div>
  );
}

function PipelineStep({
  number,
  title,
  description,
  active,
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
          active
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {number}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-900">
          {title}
        </p>

        <p className="mt-0.5 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <div className="ml-auto">
        {active ? (
          <CheckCircle2
            size={17}
            className="text-emerald-600"
          />
        ) : (
          <span className="block h-2.5 w-2.5 rounded-full bg-slate-300" />
        )}
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${color}`}
      />
      <span className="text-[11px] font-semibold text-slate-600">
        {label}
      </span>
    </div>
  );
}
