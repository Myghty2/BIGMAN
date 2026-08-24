import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
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
  Flame,
  Gauge,
  Layers3,
  Leaf,
  LocateFixed,
  Lock,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Minus,
  Navigation,
  Pause,
  Play,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Satellite,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  TrendingDown,
  TrendingUp,
  Waves,
  Wind,
  X,
  Zap,
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

import { projects as seedProjects, monitoringData } from "../data/mockData";

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

const customProjectMarker = L.divIcon({
  className: "blueguard-pulsing-marker",
  html: `
    <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
      <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:#12545A; opacity:0.35; animation:pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
      <div style="width:28px; height:28px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); background:#12545A; border:2.5px solid #E7DEC7; box-shadow:0 6px 16px rgba(11,43,51,0.45); display:flex; align-items:center; justify-content:center;">
        <div style="width:8px; height:8px; border-radius:50%; background:#E7DEC7;"></div>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

function safeNum(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function getCoords(project) {
  if (Array.isArray(project?.coordinates) && project.coordinates.length >= 2) {
    return [safeNum(project.coordinates[0], DEFAULT_CENTER[0]), safeNum(project.coordinates[1], DEFAULT_CENTER[1])];
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
    { id: "MP-01", coordinates: [lat + 0.011, lng - 0.014], health: 94, type: "Rhizophora Canopy", signal: "Dense Propagule Growth" },
    { id: "MP-02", coordinates: [lat - 0.008, lng + 0.018], health: 88, type: "Tidal Inundation Zone", signal: "Regular Tidal Flushing" },
    { id: "MP-03", coordinates: [lat - 0.018, lng - 0.006], health: 76, type: "Avicennia Nursery Plot", signal: "Sapling Regrowth" },
  ];
}

function getHistory(source) {
  if (Array.isArray(source) && source.length) {
    return source.map((item, index) => ({
      label: item.month || item.date || `Obs ${index + 1}`,
      vegetation: safeNum(item.vegetation, 62 + index * 3.5),
      carbon: safeNum(item.carbon, 42 + index * 4.2),
      survival: safeNum(item.survival, 84 + index * 1.5),
    }));
  }
  return [
    { label: "Jan", vegetation: 62, carbon: 41, survival: 85 },
    { label: "Feb", vegetation: 67, carbon: 45, survival: 87 },
    { label: "Mar", vegetation: 71, carbon: 49, survival: 89 },
    { label: "Apr", vegetation: 76, carbon: 54, survival: 90 },
    { label: "May", vegetation: 81, carbon: 61, survival: 92 },
    { label: "Jun", vegetation: 86, carbon: 68, survival: 94 },
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

function MapController({ coordinates, onZoomIn, onZoomOut, onLocate, onFullscreen }) {
  const map = useMap();

  useEffect(() => {
    if (!Array.isArray(coordinates)) return;
    map.flyTo(coordinates, 12, { duration: 0.9 });
  }, [coordinates, map]);

  useEffect(() => {
    onZoomIn.current = () => map.zoomIn();
    onZoomOut.current = () => map.zoomOut();
    onLocate.current = () => map.flyTo(coordinates, 13, { duration: 0.9 });
    onFullscreen.current = () => {
      const container = map.getContainer();
      if (!document.fullscreenElement) {
        container.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    };
  }, [coordinates, map, onFullscreen, onLocate, onZoomIn, onZoomOut]);

  return null;
}

export default function Monitoring() {
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
  const [mapMode, setMapMode] = useState("satellite");
  const [cursorCoordinates, setCursorCoordinates] = useState(null);
  const [showLayers, setShowLayers] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [showProject, setShowProject] = useState(true);
  const [showMonitoringPoints, setShowMonitoringPoints] = useState(true);
  const [showChangeZone, setShowChangeZone] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState("latest");
  const [playingTimeline, setPlayingTimeline] = useState(false);
  const [chartMetric, setChartMetric] = useState("both"); // 'vegetation', 'carbon', 'both'
  const [opacity, setOpacity] = useState(95);
  const [apiState, setApiState] = useState("demo");
  const [apiData, setApiData] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const zoomInRef = useRef(null);
  const zoomOutRef = useRef(null);
  const locateRef = useRef(null);
  const fullscreenRef = useRef(null);

  const project = useMemo(() => {
    return projectsList.find((p) => p.id === selectedProject) || projectsList[0] || seedProjects[0];
  }, [projectsList, selectedProject]);

  const coordinates = useMemo(() => getCoords(project), [project]);
  const boundary = useMemo(() => createBoundary(coordinates), [coordinates]);
  const monitoringPoints = useMemo(() => createMonitoringPoints(coordinates), [coordinates]);
  const history = useMemo(() => getHistory(monitoringData), []);

  const latest = history[history.length - 1] || { vegetation: 86, carbon: 68, survival: 94, label: "Latest" };
  const previous = history[history.length - 2] || latest;
  const vegetationChange = latest.vegetation - previous.vegetation;
  const carbonChange = latest.carbon - previous.carbon;

  const currentTimelineItem = useMemo(() => {
    if (selectedObservation === "latest") return latest;
    return history.find((h) => h.label === selectedObservation) || latest;
  }, [selectedObservation, history, latest]);

  const liveVegetation = safeNum(apiData?.vegetation_index ?? currentTimelineItem.vegetation, currentTimelineItem.vegetation);
  const liveCarbon = safeNum(apiData?.carbon_index ?? currentTimelineItem.carbon, currentTimelineItem.carbon);
  const liveHealth = Math.min(99, Math.max(40, Math.round(liveVegetation * 0.7 + (project?.progress || 60) * 0.3)));
  const liveSurvival = currentTimelineItem.survival || 92;
  const waterCoverage = Math.min(95, Math.max(15, Math.round(30 + liveVegetation * 0.15)));

  // Timeline player
  useEffect(() => {
    if (!playingTimeline) return;
    const timer = setInterval(() => {
      setSelectedObservation((curr) => {
        if (curr === "latest") return history[0]?.label || "latest";
        const idx = history.findIndex((h) => h.label === curr);
        const next = idx + 1;
        if (next >= history.length) return "latest";
        return history[next].label;
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [playingTimeline, history]);

  const handleRefresh = () => {
    setProjectsList(loadProjects());
    setLastRefreshed(new Date());
  };

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-8">
      {/* =========================================================
          HERO MONITORING BANNER (Deep Navy, Brand Teal & Sand)
          ========================================================= */}
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-deep-navy via-brand-teal to-seagrass p-6 shadow-xl lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sand/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-seagrass/30 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-sand/30 bg-sand/15 px-4 py-2 text-xs sm:text-sm font-extrabold tracking-wider text-sand backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </span>
              <Sprout size={18} className="text-emerald-300" />
              <span>MANGROVE RESTORATION TELEMETRY</span>
            </div>

            <h1 className="dashboard-display mt-3 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white">
              Mangrove Monitoring Hub
            </h1>

            <p className="mt-3 text-base sm:text-lg lg:text-xl font-medium leading-relaxed text-slate-100">
              High-resolution remote sensing for NGO restoration sites, tracking canopy NDVI expansion, seedling survival rates, tidal flushing, and verified blue carbon gains.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="hidden text-sm font-medium text-slate-200 sm:block">
              Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm sm:text-base font-bold text-white shadow-sm transition hover:bg-white/20 backdrop-blur"
              aria-label="Refresh telemetry data"
            >
              <RefreshCw size={17} />
              Sync Sensors
            </button>
            <div className="flex items-center gap-2 rounded-2xl bg-sand/20 px-4 py-3 border border-sand/30 text-sm font-bold text-sand backdrop-blur">
              <Radio size={16} className="text-emerald-300 animate-pulse" />
              <span>Sentinel-2 L2A Active</span>
            </div>
          </div>
        </div>

        {/* Real-time Mangrove NGO KPI Ribbon with INCREASED WHITE TEXT */}
        <div className="relative mt-8 grid grid-cols-2 gap-3 border-t border-white/15 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.12]">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand">Mangrove Canopy NDVI</p>
            <p className="dashboard-display mt-1 text-3xl sm:text-4xl lg:text-5xl font-black text-white">
              {liveVegetation.toFixed(1)}% <span className="text-sm sm:text-base font-bold text-emerald-300">+{vegetationChange.toFixed(1)}%</span>
            </p>
            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-200">Sentinel multi-spectral index</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.12]">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand">Seedling Survival Rate</p>
            <p className="dashboard-display mt-1 text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-300">
              {liveSurvival}% <span className="text-xs sm:text-sm rounded-full bg-emerald-500/30 px-2.5 py-0.5 text-emerald-100 font-bold">High Vigor</span>
            </p>
            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-200">Nursery & field plot count</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.12]">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand">Blue Carbon Density</p>
            <p className="dashboard-display mt-1 text-3xl sm:text-4xl lg:text-5xl font-black text-white">
              {liveCarbon} <span className="text-lg sm:text-xl font-bold text-sand">tCO₂e/ha</span>
            </p>
            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-200">Soil & above-ground biomass</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.12]">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand">Tidal Flushing Cycle</p>
            <p className="dashboard-display mt-1 text-3xl sm:text-4xl lg:text-5xl font-black text-white">
              {waterCoverage}% <span className="text-lg sm:text-xl font-bold text-sand">active</span>
            </p>
            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-200">Hydrological sediment health</p>
          </div>
        </div>
      </header>

      {/* =========================================================
          PROJECT SELECTOR & OBSERVATION TIMELINE CONTROLLER
          ========================================================= */}
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(240px,1fr)_auto] lg:items-center">
          {/* Project selector */}
          <div>
            <label className="mb-1.5 block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
              Active Mangrove Project Site
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
              <ChevronDown size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Observation state indicator */}
          <div>
            <label className="mb-1.5 block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
              Observation Period
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm sm:text-base font-bold text-slate-800">
              <CalendarDays size={18} className="text-brand-teal" />
              <span>Epoch: <strong className="text-deep-navy">{selectedObservation === "latest" ? "Current (Live Cycle)" : selectedObservation}</strong></span>
            </div>
          </div>

          {/* Timeline Playback Controls */}
          <div className="flex items-center gap-2 pt-2 lg:pt-5">
            <button
              type="button"
              onClick={() => setPlayingTimeline((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3.5 text-xs sm:text-sm font-bold shadow-sm transition-all duration-300 ${
                playingTimeline
                  ? "bg-coral text-white shadow-coral/30 ring-2 ring-coral/40"
                  : "bg-brand-teal text-white hover:bg-deep-navy"
              }`}
            >
              {playingTimeline ? <Pause size={17} className="animate-pulse" /> : <Play size={17} />}
              {playingTimeline ? "Pause Simulation" : "Animate Growth"}
            </button>

            <button
              type="button"
              onClick={() => setSelectedObservation("latest")}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-xs sm:text-sm font-bold text-slate-700 hover:border-brand-teal hover:text-brand-teal"
              title="Reset to latest observation"
            >
              <RotateCcw size={16} />
              Latest
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          MAIN INTERACTIVE MAP & INTEL SECTION
          ========================================================= */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.85fr)_minmax(340px,0.85fr)]">
        {/* MAP CONTAINER */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <MapIcon size={19} className="text-brand-teal" />
                <h3 className="dashboard-card-title text-base sm:text-lg font-bold text-slate-900">
                  Mangrove Canopy Multispectral Map
                </h3>
              </div>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                Sentinel-2 optical bands with vector plot boundaries and monitoring stations.
              </p>
            </div>

            {/* Map Mode Buttons */}
            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {[
                ["satellite", "Satellite Optical"],
                ["map", "Vector Map"],
                ["terrain", "Topography"],
              ].map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMapMode(mode)}
                  className={`rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition ${
                    mapMode === mode ? "bg-brand-teal text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Map Viewer */}
          <div className="relative h-[440px] w-full">
            <MapContainer center={coordinates} zoom={12} scrollWheelZoom className="h-full w-full">
              {mapMode === "map" && <TileLayer attribution="Tiles &copy; Esri" url={mapTile} />}
              {mapMode === "terrain" && <TileLayer attribution="Tiles &copy; Esri" url={terrainTile} />}
              {mapMode === "satellite" && (
                <>
                  <TileLayer attribution="Tiles &copy; Esri" url={satelliteTile} opacity={opacity / 100} />
                  <TileLayer attribution="&copy; Esri" url={labelsTile} opacity={1} />
                </>
              )}

              <ScaleControl position="bottomleft" imperial={false} maxWidth={180} />
              <MapInteraction onCursorMove={setCursorCoordinates} />

              <MapController
                coordinates={coordinates}
                onZoomIn={zoomInRef}
                onZoomOut={zoomOutRef}
                onLocate={locateRef}
                onFullscreen={fullscreenRef}
              />

              {showBoundary && (
                <Polygon
                  positions={boundary}
                  pathOptions={{
                    color: "#12545A",
                    fillColor: "#3F7D5C",
                    fillOpacity: 0.22,
                    weight: 3,
                  }}
                >
                  <Popup>
                    <div className="min-w-[210px] p-1 font-sans">
                      <p className="text-xs font-bold uppercase text-brand-teal">Mangrove Plot Boundary</p>
                      <p className="mt-1 font-bold text-slate-900 text-sm">{project.name}</p>
                      <p className="mt-1 text-xs text-slate-600">Restoration Area: <strong>{project.area}</strong></p>
                    </div>
                  </Popup>
                </Polygon>
              )}

              {showProject && (
                <Marker position={coordinates} icon={customProjectMarker}>
                  <Popup>
                    <div className="min-w-[220px] p-1 font-sans">
                      <p className="text-xs font-bold uppercase text-brand-teal">Core Sensor Beacon</p>
                      <p className="mt-1 font-bold text-slate-900 text-sm">{project.name}</p>
                      <p className="mt-1 text-xs text-slate-600">{project.location}</p>
                      <p className="mt-2 font-mono text-[11px] text-slate-500">
                        {coordinates[0].toFixed(4)}° N, {coordinates[1].toFixed(4)}° E
                      </p>
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
                      color: point.health >= 85 ? "#3F7D5C" : point.health >= 75 ? "#12545A" : "#C46A3F",
                      fillColor: point.health >= 85 ? "#34D399" : point.health >= 75 ? "#12545A" : "#C46A3F",
                      fillOpacity: 0.85,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="min-w-[180px] p-1 font-sans">
                        <p className="text-xs font-bold text-brand-teal">{point.id} • {point.type}</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">Health: {point.health}%</p>
                        <p className="text-xs text-slate-600">Telemetry: {point.signal}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}

              {showChangeZone && (
                <Circle
                  center={[coordinates[0] - 0.012, coordinates[1] + 0.014]}
                  radius={1600}
                  pathOptions={{
                    color: "#C46A3F",
                    fillColor: "#C46A3F",
                    fillOpacity: 0.2,
                    dashArray: "6 6",
                    weight: 2,
                  }}
                >
                  <Popup>
                    <p className="font-bold text-coral text-xs">CANOPY EXPANSION ZONE</p>
                    <p className="mt-1 text-xs text-slate-600">Automated NDVI shows propagule establishment.</p>
                  </Popup>
                </Circle>
              )}
            </MapContainer>

            {/* Float Coordinates badge with Increased Font */}
            <div className="pointer-events-none absolute bottom-4 right-4 z-[1000] rounded-2xl border border-white/20 bg-deep-navy/90 px-4 py-2.5 text-white shadow-xl backdrop-blur-md">
              <p className="text-[11px] font-bold uppercase tracking-wider text-sand">Sensor Position</p>
              <p className="mt-0.5 font-mono text-sm font-extrabold text-emerald-300">
                {cursorCoordinates
                  ? `${cursorCoordinates[0].toFixed(5)}°, ${cursorCoordinates[1].toFixed(5)}°`
                  : `${coordinates[0].toFixed(5)}°, ${coordinates[1].toFixed(5)}°`}
              </p>
            </div>

            {/* Map Controls */}
            <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
              <button
                type="button"
                onClick={() => zoomInRef.current?.()}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-brand-teal hover:text-white"
                title="Zoom In"
              >
                <Plus size={18} />
              </button>
              <button
                type="button"
                onClick={() => zoomOutRef.current?.()}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-brand-teal hover:text-white"
                title="Zoom Out"
              >
                <Minus size={18} />
              </button>
              <button
                type="button"
                onClick={() => locateRef.current?.()}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-brand-teal hover:text-white"
                title="Center on Plot"
              >
                <LocateFixed size={18} />
              </button>
            </div>

            {/* Layers Toggle Overlay */}
            {showLayers && (
              <div className="absolute left-4 top-4 z-[1000] w-60 rounded-3xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-deep-navy">Mangrove Layers</p>
                  <button onClick={() => setShowLayers(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
                    <X size={15} />
                  </button>
                </div>
                <div className="space-y-1.5 text-xs font-semibold text-slate-700">
                  <label className="flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-slate-50 cursor-pointer">
                    <span className="flex items-center gap-2"><Leaf size={14} className="text-seagrass" /> Plot Boundary</span>
                    <input type="checkbox" checked={showBoundary} onChange={(e) => setShowBoundary(e.target.checked)} className="accent-brand-teal" />
                  </label>
                  <label className="flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-slate-50 cursor-pointer">
                    <span className="flex items-center gap-2"><MapIcon size={14} className="text-brand-teal" /> Center Beacon</span>
                    <input type="checkbox" checked={showProject} onChange={(e) => setShowProject(e.target.checked)} className="accent-brand-teal" />
                  </label>
                  <label className="flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-slate-50 cursor-pointer">
                    <span className="flex items-center gap-2"><Crosshair size={14} className="text-emerald-600" /> Monitoring Stations</span>
                    <input type="checkbox" checked={showMonitoringPoints} onChange={(e) => setShowMonitoringPoints(e.target.checked)} className="accent-brand-teal" />
                  </label>
                  <label className="flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-slate-50 cursor-pointer">
                    <span className="flex items-center gap-2"><Flame size={14} className="text-coral" /> Regrowth Hotspots</span>
                    <input type="checkbox" checked={showChangeZone} onChange={(e) => setShowChangeZone(e.target.checked)} className="accent-brand-teal" />
                  </label>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SATELLITE INTELLIGENCE & RADIAL GAUGE */}
        <div className="flex flex-col gap-6">
          {/* Compact Radial Gauge for Mangrove Biomass */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-teal">Mangrove Health</p>
                <h3 className="dashboard-card-title mt-0.5 text-base sm:text-lg font-bold text-slate-900">
                  Canopy Density Index
                </h3>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sand text-deep-navy">
                <Gauge size={17} />
              </span>
            </div>

            {/* Compact Radial SVG Gauge */}
            <div className="relative mt-4 flex flex-col items-center justify-center">
              <svg className="h-36 w-36 -rotate-90 transform" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" className="stroke-slate-100" strokeWidth="8" fill="transparent" />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  stroke="url(#blueguardGaugeGrad)"
                  strokeWidth="8"
                  strokeDasharray={301.6}
                  strokeDashoffset={301.6 - (301.6 * liveHealth) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="blueguardGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#12545A" />
                    <stop offset="50%" stopColor="#3F7D5C" />
                    <stop offset="100%" stopColor="#34D399" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="dashboard-display text-3xl sm:text-4xl font-black text-slate-900">{liveHealth}%</span>
                <span className="text-xs font-bold text-emerald-700">Optimal Canopy</span>
              </div>
            </div>

            {/* Sub Metric Pills */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-2 text-center">
                <p className="text-[11px] font-bold uppercase text-slate-500">NDVI Greenness</p>
                <p className="text-base font-extrabold text-brand-teal">{liveVegetation.toFixed(1)}%</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-2 text-center">
                <p className="text-[11px] font-bold uppercase text-slate-500">Seedling Survival</p>
                <p className="text-base font-extrabold text-seagrass">{liveSurvival}%</p>
              </div>
            </div>
          </section>

          {/* Quick Mission Brief with Increased White Text */}
          <section className="rounded-3xl border border-white/10 bg-deep-navy p-6 text-white shadow-md">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/15 px-3.5 py-1 text-xs sm:text-sm font-extrabold text-sand">
                {project.id}
              </span>
              <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-300">
                <ShieldCheck size={16} /> MRV Monitored
              </span>
            </div>

            <h4 className="mt-3 text-xl sm:text-2xl font-extrabold text-white">{project.name}</h4>
            <p className="mt-2 text-sm sm:text-base text-slate-200 leading-relaxed">{project.description || "Community-led mangrove planting and mudflat stabilization."}</p>

            <div className="mt-4 border-t border-white/15 pt-4 flex items-center justify-between text-sm sm:text-base text-slate-200">
              <span>Area: <strong className="text-sand font-bold">{project.area}</strong></span>
              <span>Total Est. Carbon: <strong className="text-emerald-300 font-bold">{project.carbon}</strong></span>
            </div>
          </section>
        </div>
      </div>

      {/* =========================================================
          COMPACT MANGROVE NGO GROWTH GRAPH & SPECIES VITALS
          ========================================================= */}
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
          {/* COMPACT ANIMATED GRAPH */}
          <div>
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3.5 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 size={20} className="text-brand-teal" />
                  <h3 className="dashboard-card-title text-base sm:text-lg font-bold text-slate-900">
                    Mangrove Canopy Growth & Carbon Accumulation
                  </h3>
                </div>
                <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                  Monthly optical NDVI trajectory vs. blue carbon sequestration (tCO₂e/ha).
                </p>
              </div>

              {/* Chart Metric Toggle */}
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                {[
                  ["both", "NDVI & Carbon"],
                  ["vegetation", "Canopy NDVI"],
                  ["carbon", "Carbon Rate"],
                ].map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setChartMetric(mode)}
                    className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold transition ${
                      chartMetric === mode ? "bg-brand-teal text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* COMPACT SVG GRAPH */}
            <div className="mt-4">
              <InteractiveCompactMangroveChart
                data={history}
                metric={chartMetric}
                activeLabel={selectedObservation}
                onSelectObservation={(label) => setSelectedObservation(label)}
              />
            </div>

            {/* Observation Epochs Scrubber */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3.5">
              <span className="text-xs font-bold uppercase text-slate-400 mr-1">Epochs:</span>
              {history.map((item) => {
                const isActive = selectedObservation === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setSelectedObservation(item.label)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs sm:text-sm font-bold transition ${
                      isActive
                        ? "border-brand-teal bg-brand-teal text-white shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-emerald-300" : "bg-slate-300"}`} />
                    <span>{item.label}</span>
                    <span className={`text-xs ${isActive ? "text-sand" : "text-slate-400"}`}>{item.vegetation}%</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MANGROVE NGO FIELD VITALS & SPECIES BREAKDOWN */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="text-sm sm:text-base font-bold text-deep-navy flex items-center gap-2">
                  <Sprout size={18} className="text-seagrass" /> Mangrove Field Vitals (NGO Plot)
                </h4>
                <span className="rounded-full bg-seagrass/15 px-2.5 py-1 text-xs font-bold text-emerald-800">
                  Verified Plot
                </span>
              </div>

              {/* Mangrove Species Ratio */}
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                    <span>Rhizophora mucronata (Red Mangrove)</span>
                    <span className="font-bold text-brand-teal">54%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-brand-teal rounded-full" style={{ width: "54%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                    <span>Avicennia marina (Grey Mangrove)</span>
                    <span className="font-bold text-seagrass">32%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-seagrass rounded-full" style={{ width: "32%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                    <span>Ceriops decandra & Associated</span>
                    <span className="font-bold text-slate-800">14%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-slate-400 rounded-full" style={{ width: "14%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Field Status Tags */}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4">
              <div className="rounded-xl bg-white p-3 border border-slate-200/80">
                <p className="text-xs font-bold uppercase text-slate-500">Tidal Inundation</p>
                <p className="text-base font-bold text-slate-900">0.85 m (MHWN)</p>
              </div>
              <div className="rounded-xl bg-white p-3 border border-slate-200/80">
                <p className="text-xs font-bold uppercase text-slate-500">Sediment Carbon</p>
                <p className="text-base font-bold text-emerald-700">148 tCO₂e/ha/yr</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ================================================================
   COMPACT ANIMATED SVG MANGROVE MULTI-METRIC CHART
   ================================================================ */

function InteractiveCompactMangroveChart({ data, metric, activeLabel, onSelectObservation }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const width = 680;
  const height = 160;
  const paddingX = 35;
  const paddingY = 20;

  const pointsCount = data.length;
  const stepX = (width - paddingX * 2) / Math.max(pointsCount - 1, 1);

  // Vegetation points (40 to 100)
  const vegPoints = data.map((d, i) => {
    const x = paddingX + i * stepX;
    const y = height - paddingY - ((d.vegetation - 40) / 60) * (height - paddingY * 2);
    return { x, y, val: d.vegetation, label: d.label, carbon: d.carbon };
  });

  // Carbon points (20 to 80)
  const carbonPoints = data.map((d, i) => {
    const x = paddingX + i * stepX;
    const y = height - paddingY - ((d.carbon - 20) / 80) * (height - paddingY * 2);
    return { x, y, val: d.carbon, label: d.label };
  });

  const vegPathD = vegPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x},${p.y}`, "");
  const vegAreaD = `${vegPathD} L ${vegPoints[vegPoints.length - 1].x},${height - paddingY} L ${vegPoints[0].x},${height - paddingY} Z`;

  const carbonPathD = carbonPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x},${p.y}`, "");
  const carbonAreaD = `${carbonPathD} L ${carbonPoints[carbonPoints.length - 1].x},${height - paddingY} L ${carbonPoints[0].x},${height - paddingY} Z`;

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 sm:h-40 overflow-visible">
        <defs>
          <linearGradient id="vegCompactGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3F7D5C" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#3F7D5C" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="carbonCompactGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#12545A" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#12545A" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0.33, 0.66, 1].map((ratio) => {
          const y = height - paddingY - ratio * (height - paddingY * 2);
          return (
            <line
              key={ratio}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="#E2E8F0"
              strokeDasharray="3 3"
            />
          );
        })}

        {/* Vegetation Area & Stroke */}
        {(metric === "vegetation" || metric === "both") && (
          <>
            <path d={vegAreaD} fill="url(#vegCompactGrad)" className="transition-all duration-700" />
            <path
              d={vegPathD}
              fill="none"
              stroke="#3F7D5C"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-700"
            />
          </>
        )}

        {/* Carbon Area & Stroke */}
        {(metric === "carbon" || metric === "both") && (
          <>
            <path d={carbonAreaD} fill="url(#carbonCompactGrad)" className="transition-all duration-700" />
            <path
              d={carbonPathD}
              fill="none"
              stroke="#12545A"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-700"
            />
          </>
        )}

        {/* Interactive Dots */}
        {vegPoints.map((p, idx) => {
          const isSelected = activeLabel === p.label || (activeLabel === "latest" && idx === vegPoints.length - 1);
          const isHovered = hoveredIndex === idx;

          return (
            <g
              key={p.label}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onSelectObservation(p.label)}
            >
              {/* Highlight vertical guide */}
              {(isHovered || isSelected) && (
                <line
                  x1={p.x}
                  y1={paddingY}
                  x2={p.x}
                  y2={height - paddingY}
                  stroke="#12545A"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  className="opacity-70"
                />
              )}

              {/* Dot for Vegetation */}
              {(metric === "vegetation" || metric === "both") && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected || isHovered ? 5.5 : 3.5}
                  fill="#FFFFFF"
                  stroke="#3F7D5C"
                  strokeWidth={isSelected || isHovered ? 2.5 : 2}
                  className="transition-all duration-300"
                />
              )}

              {/* Dot for Carbon */}
              {(metric === "carbon" || metric === "both") && (
                <circle
                  cx={p.x}
                  cy={carbonPoints[idx].y}
                  r={isSelected || isHovered ? 5.5 : 3.5}
                  fill="#E7DEC7"
                  stroke="#12545A"
                  strokeWidth={isSelected || isHovered ? 2.5 : 2}
                  className="transition-all duration-300"
                />
              )}

              {/* Month label along X-axis */}
              <text
                x={p.x}
                y={height - 4}
                textAnchor="middle"
                className={`text-xs font-bold ${
                  isSelected ? "fill-brand-teal font-extrabold" : "fill-slate-500"
                }`}
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip if Hovered */}
      {hoveredIndex !== null && (
        <div
          className="pointer-events-none absolute top-1 z-20 rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur-md transition-all duration-200 text-xs sm:text-sm font-semibold"
          style={{
            left: `${(vegPoints[hoveredIndex].x / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          <span className="font-bold text-slate-800">{data[hoveredIndex].label}: </span>
          <span className="font-bold text-seagrass">NDVI {data[hoveredIndex].vegetation}%</span>
          <span className="text-slate-400"> • </span>
          <span className="font-bold text-brand-teal">Carbon {data[hoveredIndex].carbon} tCO₂e/ha</span>
        </div>
      )}
    </div>
  );
}
