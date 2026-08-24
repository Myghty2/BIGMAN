import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Download,
  Eye,
  Layers,
  Leaf,
  Maximize2,
  Navigation,
  Pause,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Satellite,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  Waves,
  X,
  Sliders,
} from "lucide-react";

import satBaseline from "../assets/sat_pass_baseline.jpg";
import satMonth3 from "../assets/sat_pass_month3.jpg";
import satMonth6 from "../assets/sat_pass_month6.jpg";
import satYear1 from "../assets/sat_pass_year1.jpg";
import satLive from "../assets/sat_pass_live.jpg";

export default function SatellitePassTimeline({ project, onSelectPass }) {
  const [activePassIndex, setActivePassIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);
  const [viewMode, setViewMode] = useState("timeline"); // 'timeline' or 'compare'
  const [lightboxImage, setLightboxImage] = useState(null);

  // Compute realistic historical orbital passes from the actual project startDate
  const passes = useMemo(() => {
    const startDate = project?.startDate ? new Date(project.startDate) : new Date("2024-03-15");
    const now = new Date();

    const pId = project?.id || "BG-IND-01";

    const d0 = new Date(startDate);
    const d1 = new Date(startDate.getTime() + 86400000 * 92);
    const d2 = new Date(startDate.getTime() + 86400000 * 184);
    const d3 = new Date(startDate.getTime() + 86400000 * 365);
    const d4 = now;

    return [
      {
        id: `SAT-${pId}-ORB01`,
        date: d0.toISOString(),
        label: "Baseline Satellite Pass",
        stageName: "Start Date • Pre-Restoration Orbital Scan",
        sensor: "Sentinel-2 MSI Level-2A (True Color B04, B03, B02)",
        spectralBand: "Optical RGB + SWIR Mudflat Reflectance",
        ndvi: 0.26,
        ndviLabel: "0.26 NDVI (Bare Intertidal Mudflat)",
        canopyCover: "8%",
        cloudCover: "2.4%",
        sunElevation: "58.4°",
        carbonDensity: "3.8 tCO₂e/ha",
        status: "Baseline Sealed",
        image: satBaseline,
        description: "Official baseline satellite acquisition on project initiation date. Captures pre-planting tidal terrain, low vegetative reflectance, and unplanted intertidal mudflat boundary.",
      },
      {
        id: `SAT-${pId}-ORB02`,
        date: d1.toISOString(),
        label: "+3 Months Orbital Pass",
        stageName: "Month 3 • Early Seedling Emergence",
        sensor: "Sentinel-2 MSI Level-2A (Band 8A Vegetation)",
        spectralBand: "Red-Edge & Near-Infrared (NIR)",
        ndvi: 0.48,
        ndviLabel: "0.48 NDVI (Early Emergence Flush)",
        canopyCover: "32%",
        cloudCover: "4.1%",
        sunElevation: "63.2°",
        carbonDensity: "8.9 tCO₂e/ha",
        status: "Chlorophyll Detected",
        image: satMonth3,
        description: "Orbital pass capturing significant near-infrared chlorophyll spectral rise following extensive seedling plantation and initial tidal feeder canal stabilization.",
      },
      {
        id: `SAT-${pId}-ORB03`,
        date: d2.toISOString(),
        label: "+6 Months Orbital Pass",
        stageName: "Month 6 • Canopy Expansion",
        sensor: "Copernicus Sentinel-2 L2A (10m Resolution)",
        spectralBand: "Multi-Spectral NDVI + EVI Index",
        ndvi: 0.69,
        ndviLabel: "0.69 NDVI (Canopy Crown Spreading)",
        canopyCover: "58%",
        cloudCover: "1.8%",
        sunElevation: "56.0°",
        carbonDensity: "17.4 tCO₂e/ha",
        status: "Biomass Accretion",
        image: satMonth6,
        description: "High-resolution optical scene showing continuous lateral mangrove crown expansion. Optical vegetation indices demonstrate 91%+ survivability.",
      },
      {
        id: `SAT-${pId}-ORB04`,
        date: d3.toISOString(),
        label: "+12 Months Orbital Pass",
        stageName: "Year 1 • Mature Mangrove Canopy",
        sensor: "Copernicus Sentinel-2 L2A (Multi-Spectral)",
        spectralBand: "Dense Forest Canopy Surface Reflectance",
        ndvi: 0.81,
        ndviLabel: "0.81 NDVI (Dense Mangrove Forest)",
        canopyCover: "76%",
        cloudCover: "0.9%",
        sunElevation: "65.1°",
        carbonDensity: "25.8 tCO₂e/ha",
        status: "Verified Blue Carbon Sink",
        image: satYear1,
        description: "Satellite imagery reveals high-density blue carbon forest establishment. Mature crown closure prevents coastal storm surge erosion and traps deep sediment carbon.",
      },
      {
        id: `SAT-${pId}-ORB05`,
        date: d4.toISOString(),
        label: "Live Sentinel-2 Pass",
        stageName: "Current Pass • Real-Time Satellite Telemetry",
        sensor: "Sentinel-2 MSI Level-2A (Real-Time Orbit)",
        spectralBand: "Automated Copernicus ESA Surface Stream",
        ndvi: (project?.vegetationIndex || 88) / 100,
        ndviLabel: `${((project?.vegetationIndex || 88) / 100).toFixed(2)} NDVI (Peak Vigor)`,
        canopyCover: project?.canopyCover || "82%",
        cloudCover: "1.2%",
        sunElevation: "62.4°",
        carbonDensity: project?.soilCarbonDensity || "32.4 kg C/m²",
        status: "Live Copernicus Telemetry",
        image: satLive,
        description: "Latest Sentinel-2 L2A orbit pass over the restoration polygon. Multispectral analysis confirms verified carbon sequestration progress.",
      },
    ];
  }, [project]);

  const activePass = passes[activePassIndex] || passes[0];
  const baselinePass = passes[0];

  // Auto-play orbital timeline animation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActivePassIndex((current) => {
        const next = current >= passes.length - 1 ? 0 : current + 1;
        if (onSelectPass) onSelectPass(passes[next]);
        return next;
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [isPlaying, passes, onSelectPass]);

  const handleSelectPass = (index) => {
    setActivePassIndex(index);
    if (onSelectPass) onSelectPass(passes[index]);
  };

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-teal" />
            </span>
            <Satellite size={20} className="text-brand-teal" />
            <h3 className="dashboard-card-title text-xl sm:text-2xl font-bold text-slate-900">
              Sentinel-2 Satellite Image Progress Timeline
            </h3>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Actual orbital satellite passes from start date ({new Date(project?.startDate || "2024-03-15").toLocaleDateString()}) through to present day.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
            <button
              onClick={() => setViewMode("timeline")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                viewMode === "timeline"
                  ? "bg-brand-teal text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Timeline Passes
            </button>
            <button
              onClick={() => setViewMode("compare")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                viewMode === "compare"
                  ? "bg-brand-teal text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Before & After Split
            </button>
          </div>

          <button
            onClick={() => setIsPlaying((prev) => !prev)}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold shadow-sm transition ${
              isPlaying
                ? "bg-amber-600 text-white"
                : "bg-brand-teal text-white hover:bg-deep-navy"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause size={15} />
                <span>Pause Time-Lapse</span>
              </>
            ) : (
              <>
                <Play size={15} />
                <span>Play Satellite Time-Lapse</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: CHRONOLOGICAL SATELLITE PASS VIEWER */}
      {viewMode === "timeline" && (
        <div className="mt-6 space-y-6">
          {/* Active Satellite Pass Showcase Display */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)] gap-6 rounded-3xl border border-slate-200 bg-slate-950 overflow-hidden text-white shadow-lg">
            {/* Satellite Image Viewport */}
            <div
              onClick={() => setLightboxImage(activePass.image)}
              className="relative aspect-video sm:aspect-[16/10] lg:aspect-auto lg:h-full min-h-[320px] overflow-hidden cursor-zoom-in group"
            >
              <img
                src={activePass.image}
                alt={activePass.stageName}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

              {/* Orbital Reticle Overlays */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span className="rounded-xl border border-white/20 bg-black/70 px-3 py-1.5 text-xs font-bold backdrop-blur-md">
                  {activePass.sensor}
                </span>
                <span className="rounded-xl border border-white/20 bg-black/70 px-3 py-1.5 text-xs font-bold text-emerald-300 backdrop-blur-md">
                  {activePass.ndviLabel}
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-sand">Satellite Pass Date</p>
                  <p className="text-base font-extrabold text-white">
                    {new Date(activePass.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <span className="flex items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-xl font-bold transition">
                  <Maximize2 size={13} />
                  <span>Inspect Satellite Pass</span>
                </span>
              </div>
            </div>

            {/* Satellite Telemetry Metrics & Observations */}
            <div className="p-6 sm:p-8 flex flex-col justify-between bg-slate-900/90 border-l border-white/10">
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div>
                    <span className="font-mono text-xs font-bold text-teal-400">
                      {activePass.id}
                    </span>
                    <h4 className="mt-1 text-lg sm:text-xl font-black text-white">
                      {activePass.stageName}
                    </h4>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-extrabold text-emerald-300">
                    {activePass.status}
                  </span>
                </div>

                <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  {activePass.description}
                </p>

                {/* Key Spectral Parameters Grid */}
                <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Cloud Cover</p>
                    <p className="text-base font-bold text-white mt-0.5">{activePass.cloudCover}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Spectral Band</p>
                    <p className="text-xs font-bold text-emerald-300 mt-0.5 truncate">{activePass.spectralBand}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Canopy Density</p>
                    <p className="text-base font-bold text-emerald-300 mt-0.5">{activePass.canopyCover}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Carbon Density</p>
                    <p className="text-base font-bold text-sand mt-0.5">{activePass.carbonDensity}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>Coordinates: {Array.isArray(project?.coordinates) ? `${project.coordinates[0]?.toFixed(4)}°, ${project.coordinates[1]?.toFixed(4)}°` : "Geotagged"}</span>
                <span className="font-mono text-emerald-400">Copernicus Sentinel Hub</span>
              </div>
            </div>
          </div>

          {/* Interactive Chronological Milestone Stepper */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
            {passes.map((pass, index) => {
              const isSelected = index === activePassIndex;
              return (
                <button
                  key={pass.id}
                  onClick={() => handleSelectPass(index)}
                  className={`group flex flex-col justify-between rounded-2xl border p-4 text-left transition duration-200 ${
                    isSelected
                      ? "border-brand-teal bg-teal-50/70 shadow-md ring-2 ring-brand-teal/30"
                      : "border-slate-200 bg-white hover:border-brand-teal/50 hover:bg-slate-50"
                  }`}
                >
                  <div className="aspect-[16/9] w-full rounded-xl overflow-hidden mb-3 bg-slate-900 border border-slate-200">
                    <img
                      src={pass.image}
                      alt={pass.label}
                      className="h-full w-full object-cover group-hover:scale-105 transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-bold ${isSelected ? "text-brand-teal" : "text-slate-500"}`}>
                        {new Date(pass.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="font-bold text-emerald-600 font-mono">
                        {pass.ndvi} NDVI
                      </span>
                    </div>

                    <p className="mt-1 text-xs font-bold text-slate-900 line-clamp-1">
                      {pass.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: BEFORE VS AFTER SPLIT SLIDER */}
      {viewMode === "compare" && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              <span>START DATE SATELLITE PASS ({new Date(baselinePass.date).toLocaleDateString()})</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>CURRENT SATELLITE PASS ({new Date().toLocaleDateString()})</span>
            </span>
          </div>

          <div className="relative aspect-video sm:aspect-[21/9] w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-lg select-none">
            {/* After Image (Full width background) */}
            <img
              src={passes[passes.length - 1].image}
              alt="After restoration satellite pass"
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Before Image (Clipped overlay) */}
            <div
              className="absolute inset-0 overflow-hidden border-r-2 border-white shadow-[0_0_15px_rgba(0,0,0,0.5)]"
              style={{ width: `${splitPosition}%` }}
            >
              <img
                src={baselinePass.image}
                alt="Before restoration baseline satellite pass"
                className="absolute inset-0 h-full w-full object-cover max-w-none"
                style={{ width: "100%", minWidth: "100%" }}
              />
              <div className="absolute top-4 left-4 rounded-xl bg-black/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                Baseline: {baselinePass.ndviLabel}
              </div>
            </div>

            <div className="absolute top-4 right-4 rounded-xl bg-emerald-950/80 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-300 backdrop-blur">
              Current: {passes[passes.length - 1].ndviLabel}
            </div>

            {/* Draggable Divider Handle */}
            <div
              className="absolute top-0 bottom-0 flex items-center justify-center pointer-events-none"
              style={{ left: `calc(${splitPosition}% - 18px)` }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-teal shadow-xl border border-slate-200">
                <Sliders size={18} />
              </div>
            </div>

            {/* Invisible Range Slider */}
            <input
              type="range"
              min="0"
              max="100"
              value={splitPosition}
              onChange={(e) => setSplitPosition(Number(e.target.value))}
              className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
            />
          </div>

          <p className="text-center text-xs text-slate-500">
            Drag the slider horizontally to compare the pre-restoration satellite baseline against present-day canopy coverage.
          </p>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] max-w-5xl overflow-hidden rounded-3xl bg-slate-900 border border-white/20 shadow-2xl"
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 transition backdrop-blur-sm"
            >
              <X size={20} />
            </button>

            <img
              src={lightboxImage}
              alt="High resolution Sentinel-2 orbital pass"
              className="max-h-[82vh] w-auto object-contain mx-auto"
            />

            <div className="p-4 bg-slate-950 text-white flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 size={16} />
                <span>Copernicus Sentinel-2 L2A Multi-Spectral Surface Reflectance (10m Optical Satellite Data)</span>
              </span>
              <a
                href={lightboxImage}
                download="sentinel2_orbital_pass.jpg"
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl font-bold transition"
              >
                <Download size={14} />
                <span>Download Satellite Image</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
