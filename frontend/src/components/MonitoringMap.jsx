import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  Marker,
  Popup,
  NavigationControl,
  ScaleControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* ============================================================================
 * SECTION 01 — PUBLIC BASEMAP SOURCES
 * ========================================================================== */

const ESRI_SATELLITE =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const ESRI_STREET =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";

const ESRI_TERRAIN =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";

const ESRI_LABELS =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

/* ============================================================================
 * SECTION 02 — GLOBAL MANGROVE WATCH DATA SERVICES
 * ========================================================================== */

const GMW_FEATURE_SERVER =
  "https://data-gis.unep-wcmc.org/server/rest/services/Hosted/Global_Mangrove_Watch/FeatureServer";

const GMW_MAP_SERVER =
  "https://data-gis.unep-wcmc.org/server/rest/services/Hosted/Global_Mangrove_Watch/MapServer";

const GMW_LAYER_BY_YEAR = Object.freeze({
  2020: 0,
  2019: 1,
  2018: 2,
  2017: 3,
  2016: 4,
  2015: 5,
  2010: 6,
  2009: 7,
  2008: 8,
  2007: 9,
  1996: 10,
});

const GMW_YEARS = Object.freeze(
  Object.keys(GMW_LAYER_BY_YEAR)
    .map(Number)
    .sort((a, b) => a - b)
);

/*
 * UNEP-WCMC / TNC mangrove typology is a real supporting dataset.
 * It is not used by default because it represents typology classes rather
 * than annual habitat extent.
 */
const MANGROVE_TYPOLOGY_SERVICE =
  "https://data-gis.unep-wcmc.org/server/rest/services/TNC_006_TypologyMangroves/FeatureServer/0";

/*
 * WDPA is a real protected-area dataset maintained by UNEP-WCMC/IUCN.
 * It is optional and only requested when the Monitoring page enables it.
 */
const WDPA_POLYGON_SERVICE =
  "https://data-gis.unep-wcmc.org/server/rest/services/ProtectedSites/WDPA_Marine_and_Coastal/FeatureServer/1";

/* ============================================================================
 * SECTION 03 — DEFAULT MAP SETTINGS
 * ========================================================================== */

const DEFAULT_CENTER = {
  latitude: 19.076,
  longitude: 72.8777,
};

const DEFAULT_ZOOM = 12;

const MIN_ZOOM = 2;

const MAX_ZOOM = 19;

const GMW_MIN_QUERY_ZOOM = 6;

const GMW_MAX_FEATURES = 2000;

const PUBLIC_QUERY_DEBOUNCE_MS = 350;

const MAP_FLY_DURATION_MS = 850;

const DEFAULT_GMW_OPACITY = 0.58;

const DEFAULT_BOUNDARY_OPACITY = 0.16;

const DEFAULT_CHANGE_ZONE_OPACITY = 0.2;

const DEFAULT_PROTECTED_AREA_OPACITY = 0.16;

/* ============================================================================
 * SECTION 04 — STYLE TOKENS
 * ========================================================================== */

const COLORS = Object.freeze({
  navy: "#0B2B33",
  deepTeal: "#12545A",
  teal: "#19736C",
  mint: "#52D6B4",
  green: "#3F7D5C",
  lightGreen: "#A9D49A",
  mangrove: "#2F7A55",
  cream: "#E7DEC7",
  white: "#FFFFFF",
  slate: "#475569",
  muted: "#64748B",
  border: "#DDE5E7",
  coral: "#C46A3F",
  orange: "#F08A5D",
  blue: "#3C8DBC",
  protected: "#6B5CA5",
});

/* ============================================================================
 * SECTION 05 — MAP STYLE FACTORIES
 * ========================================================================== */

function createRasterStyle(tileUrl, options = {}) {
  const {
    labels = false,
    baseOpacity = 1,
    baseAttribution = "Tiles © Esri",
  } = options;

  const sources = {
    blueguardBase: {
      type: "raster",
      tiles: [tileUrl],
      tileSize: 256,
      attribution: baseAttribution,
    },
  };

  const layers = [
    {
      id: "blueguard-base",
      type: "raster",
      source: "blueguardBase",
      minzoom: 0,
      maxzoom: MAX_ZOOM,
      paint: {
        "raster-opacity": baseOpacity,
      },
    },
  ];

  if (labels) {
    sources.blueguardLabels = {
      type: "raster",
      tiles: [ESRI_LABELS],
      tileSize: 256,
      attribution: "Labels © Esri",
    };

    layers.push({
      id: "blueguard-labels",
      type: "raster",
      source: "blueguardLabels",
      minzoom: 0,
      maxzoom: MAX_ZOOM,
      paint: {
        "raster-opacity": 0.9,
      },
    });
  }

  return {
    version: 8,
    sources,
    layers,
  };
}

function getBaseStyle(mode = "satellite") {
  switch (mode) {
    case "map":
      return createRasterStyle(ESRI_STREET, {
        labels: false,
      });

    case "terrain":
      return createRasterStyle(ESRI_TERRAIN, {
        labels: true,
      });

    case "satellite":
    default:
      return createRasterStyle(ESRI_SATELLITE, {
        labels: true,
      });
  }
}

/* ============================================================================
 * SECTION 06 — GENERIC DATA HELPERS
 * ========================================================================== */

function emptyFeatureCollection() {
  return {
    type: "FeatureCollection",
    features: [],
  };
}

function featureCollection(features = []) {
  return {
    type: "FeatureCollection",
    features: Array.isArray(features) ? features : [],
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safeString(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isValidCoordinatePair(pair) {
  if (!Array.isArray(pair) || pair.length < 2) {
    return false;
  }

  const latitude = Number(pair[0]);
  const longitude = Number(pair[1]);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function normalizeBoundary(boundary) {
  if (!Array.isArray(boundary)) {
    return [];
  }

  return boundary.filter(isValidCoordinatePair);
}

function boundaryToFeature(boundary) {
  const normalized = normalizeBoundary(boundary);

  if (normalized.length < 3) {
    return null;
  }

  const ring = normalized.map(([latitude, longitude]) => [
    Number(longitude),
    Number(latitude),
  ]);

  const first = ring[0];
  const last = ring[ring.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([...first]);
  }

  return {
    type: "Feature",
    properties: {
      source: "BlueGuard project boundary",
    },
    geometry: {
      type: "Polygon",
      coordinates: [ring],
    },
  };
}

function setGeoJsonData(map, sourceId, data) {
  const source = map.getSource(sourceId);

  if (!source || typeof source.setData !== "function") {
    return false;
  }

  source.setData(data);
  return true;
}

function ensureGeoJsonSource(map, sourceId, data = emptyFeatureCollection()) {
  const existing = map.getSource(sourceId);

  if (existing) {
    existing.setData(data);
    return existing;
  }

  map.addSource(sourceId, {
    type: "geojson",
    data,
  });

  return map.getSource(sourceId);
}

function getMapBoundsObject(map) {
  const bounds = map.getBounds();

  return {
    west: bounds.getWest(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    north: bounds.getNorth(),
  };
}

function bboxToArcGISGeometry(map) {
  const bounds = getMapBoundsObject(map);

  return {
    xmin: bounds.west,
    ymin: bounds.south,
    xmax: bounds.east,
    ymax: bounds.north,
    spatialReference: {
      wkid: 4326,
    },
  };
}

/* ============================================================================
 * SECTION 07 — MAP MARKER DOM FACTORIES
 * ========================================================================== */

function createProjectMarkerElement() {
  const wrapper = document.createElement("div");

  wrapper.className = "blueguard-project-marker";

  const pulse = document.createElement("div");
  pulse.className = "blueguard-project-marker__pulse";

  const pin = document.createElement("div");
  pin.className = "blueguard-project-marker__pin";

  const dot = document.createElement("div");
  dot.className = "blueguard-project-marker__dot";

  pin.appendChild(dot);
  wrapper.appendChild(pulse);
  wrapper.appendChild(pin);

  return wrapper;
}

function createStationMarkerElement(health = 80) {
  const element = document.createElement("div");

  const numericHealth = safeNumber(health, 80);

  element.className = "blueguard-station-marker";

  if (numericHealth >= 90) {
    element.dataset.health = "excellent";
  } else if (numericHealth >= 75) {
    element.dataset.health = "good";
  } else {
    element.dataset.health = "watch";
  }

  return element;
}

function createChangeMarkerElement() {
  const element = document.createElement("div");

  element.className = "blueguard-change-marker";

  return element;
}

/* ============================================================================
 * SECTION 08 — POPUP BUILDERS
 * ========================================================================== */

function projectPopupHtml({
  project,
  latitude,
  longitude,
}) {
  return `
    <div class="blueguard-popup">
      <div class="blueguard-popup__eyebrow">
        BLUEGUARD PROJECT
      </div>

      <div class="blueguard-popup__title">
        ${escapeHtml(project?.name || "Mangrove Restoration Site")}
      </div>

      <div class="blueguard-popup__description">
        ${escapeHtml(project?.location || "Active monitoring site")}
      </div>

      <div class="blueguard-popup__coordinates">
        ${safeNumber(latitude).toFixed(5)}° N
        &nbsp;·&nbsp;
        ${safeNumber(longitude).toFixed(5)}° E
      </div>
    </div>
  `;
}

function stationPopupHtml(point) {
  const health = safeNumber(point?.health, 0);

  return `
    <div class="blueguard-popup">
      <div class="blueguard-popup__eyebrow">
        FIELD MONITORING STATION
      </div>

      <div class="blueguard-popup__title">
        ${escapeHtml(point?.id || "Station")}
      </div>

      <div class="blueguard-popup__description">
        ${escapeHtml(point?.type || "Mangrove monitoring")}
      </div>

      <div class="blueguard-popup__metric">
        <span>Vegetation health</span>
        <strong>${health}%</strong>
      </div>

      <div class="blueguard-popup__description">
        ${escapeHtml(point?.signal || "Telemetry available")}
      </div>
    </div>
  `;
}

function gmwPopupHtml({
  year,
  feature,
}) {
  const properties = feature?.properties || {};

  return `
    <div class="blueguard-popup">
      <div class="blueguard-popup__eyebrow">
        GLOBAL MANGROVE WATCH
      </div>

      <div class="blueguard-popup__title">
        Mangrove habitat extent
      </div>

      <div class="blueguard-popup__description">
        Annual GMW v3 habitat-extent observation for
        <strong>${escapeHtml(year)}</strong>.
      </div>

      ${
        properties.pxlval !== undefined
          ? `
            <div class="blueguard-popup__metric">
              <span>Pixel value</span>
              <strong>${escapeHtml(properties.pxlval)}</strong>
            </div>
          `
          : ""
      }

      <div class="blueguard-popup__source">
        Source: UNEP-WCMC / Global Mangrove Watch
      </div>
    </div>
  `;
}

/* ============================================================================
 * SECTION 09 — CIRCLE / ZONE GEOMETRY
 * ========================================================================== */

function circlePolygon(
  centerLongitude,
  centerLatitude,
  radiusDegrees,
  points = 64
) {
  const coordinates = [];

  for (let index = 0; index <= points; index += 1) {
    const angle = (index / points) * Math.PI * 2;

    coordinates.push([
      centerLongitude + Math.cos(angle) * radiusDegrees,
      centerLatitude + Math.sin(angle) * radiusDegrees,
    ]);
  }

  return coordinates;
}

function createChangeZoneFeature(latitude, longitude, radius = 0.0145) {
  return {
    type: "Feature",
    properties: {
      source: "BlueGuard monitoring model",
      type: "change-zone",
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        circlePolygon(
          Number(longitude) + 0.014,
          Number(latitude) - 0.012,
          radius
        ),
      ],
    },
  };
}

/* ============================================================================
 * SECTION 10 — ARCGIS QUERY HELPERS
 * ========================================================================== */

function buildArcGISQueryUrl(
  serviceUrl,
  map,
  options = {}
) {
  const {
    where = "1=1",
    outFields = "*",
    maxRecordCount = 2000,
    returnGeometry = true,
    geometryType = "esriGeometryEnvelope",
    resultType = "standard",
    maxAllowableOffset,
  } = options;

  const geometry = bboxToArcGISGeometry(map);

  const params = new URLSearchParams();

  params.set("where", where);
  params.set("geometry", JSON.stringify(geometry));
  params.set("geometryType", geometryType);
  params.set("inSR", "4326");
  params.set("spatialRel", "esriSpatialRelIntersects");
  params.set("outFields", outFields);
  params.set("returnGeometry", String(returnGeometry));
  params.set("outSR", "4326");
  params.set("f", "geojson");
  params.set("resultRecordCount", String(maxRecordCount));
  params.set("resultType", resultType);

  if (maxAllowableOffset !== undefined) {
    params.set(
      "maxAllowableOffset",
      String(maxAllowableOffset)
    );
  }

  return `${serviceUrl}/query?${params.toString()}`;
}

function buildGmwQueryUrl(map, year) {
  const layerId =
    GMW_LAYER_BY_YEAR[Number(year)] ??
    GMW_LAYER_BY_YEAR[2020];

  const zoom = map.getZoom();

  /*
   * GMW polygons can become very heavy when a wide viewport is requested.
   * A small simplification offset is therefore applied when zoomed out.
   */
  let maxAllowableOffset;

  if (zoom < 9) {
    maxAllowableOffset = 0.01;
  } else if (zoom < 11) {
    maxAllowableOffset = 0.0025;
  } else if (zoom < 13) {
    maxAllowableOffset = 0.0007;
  }

  return buildArcGISQueryUrl(
    `${GMW_FEATURE_SERVER}/${layerId}`,
    map,
    {
      where: "1=1",
      outFields: "objectid,pxlval",
      maxRecordCount: GMW_MAX_FEATURES,
      maxAllowableOffset,
    }
  );
}

function buildTypologyQueryUrl(map) {
  const zoom = map.getZoom();

  return buildArcGISQueryUrl(
    MANGROVE_TYPOLOGY_SERVICE,
    map,
    {
      where: "1=1",
      outFields: "objectid,class,id",
      maxRecordCount: 1000,
      maxAllowableOffset: zoom < 10 ? 0.004 : 0.001,
    }
  );
}

function buildProtectedAreaQueryUrl(map) {
  const zoom = map.getZoom();

  return buildArcGISQueryUrl(
    WDPA_POLYGON_SERVICE,
    map,
    {
      where: "1=1",
      outFields: "OBJECTID,NAME,DESIG,STATUS",
      maxRecordCount: 1000,
      maxAllowableOffset: zoom < 9 ? 0.02 : zoom < 11 ? 0.005 : 0.001,
    }
  );
}

/* ============================================================================
 * SECTION 11 — RESPONSE VALIDATION
 * ========================================================================== */

function normalizeGeoJsonResponse(data) {
  if (!data) {
    return emptyFeatureCollection();
  }

  if (
    data.type === "FeatureCollection" &&
    Array.isArray(data.features)
  ) {
    return data;
  }

  return emptyFeatureCollection();
}

async function fetchJson(url, signal) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/geo+json, application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `Public map service returned HTTP ${response.status}`
    );
  }

  return response.json();
}

/* ============================================================================
 * SECTION 12 — GMW DATA REQUEST
 * ========================================================================== */

async function fetchGmwViewport(
  map,
  year,
  signal
) {
  const url = buildGmwQueryUrl(map, year);

  const data = await fetchJson(url, signal);

  return {
    url,
    data: normalizeGeoJsonResponse(data),
  };
}

/* ============================================================================
 * SECTION 13 — SUPPORTING PUBLIC DATA REQUESTS
 * ========================================================================== */

async function fetchMangroveTypology(
  map,
  signal
) {
  const url = buildTypologyQueryUrl(map);

  const data = await fetchJson(url, signal);

  return {
    url,
    data: normalizeGeoJsonResponse(data),
  };
}

async function fetchProtectedAreas(
  map,
  signal
) {
  const url = buildProtectedAreaQueryUrl(map);

  const data = await fetchJson(url, signal);

  return {
    url,
    data: normalizeGeoJsonResponse(data),
  };
}

/* ============================================================================
 * SECTION 14 — PUBLIC MAP LAYER IDS
 * ========================================================================== */

const MAP_LAYER_IDS = Object.freeze({
  gmwFill: "blueguard-gmw-habitat-fill",
  gmwOutline: "blueguard-gmw-habitat-outline",

  typologyFill: "blueguard-mangrove-typology-fill",
  typologyOutline: "blueguard-mangrove-typology-outline",

  protectedFill: "blueguard-protected-area-fill",
  protectedOutline: "blueguard-protected-area-outline",

  boundaryFill: "blueguard-project-boundary-fill",
  boundaryLine: "blueguard-project-boundary-line",

  changeFill: "blueguard-change-zone-fill",
  changeLine: "blueguard-change-zone-line",
});

/* ============================================================================
 * SECTION 15 — PUBLIC GEOJSON SOURCES
 * ========================================================================== */

const MAP_SOURCE_IDS = Object.freeze({
  gmw: "blueguard-gmw-habitat",
  typology: "blueguard-mangrove-typology",
  protected: "blueguard-protected-areas",
  boundary: "blueguard-project-boundary",
  change: "blueguard-change-zone",
});

/* ============================================================================
 * SECTION 16 — ENSURE GMW LAYERS
 * ========================================================================== */

function ensureGmwLayers(map) {
  ensureGeoJsonSource(
    map,
    MAP_SOURCE_IDS.gmw,
    emptyFeatureCollection()
  );

  if (!map.getLayer(MAP_LAYER_IDS.gmwFill)) {
    map.addLayer({
      id: MAP_LAYER_IDS.gmwFill,
      type: "fill",
      source: MAP_SOURCE_IDS.gmw,
      minzoom: GMW_MIN_QUERY_ZOOM,
      paint: {
        "fill-color": COLORS.mangrove,
        "fill-opacity": DEFAULT_GMW_OPACITY,
      },
    });
  }

  if (!map.getLayer(MAP_LAYER_IDS.gmwOutline)) {
    map.addLayer({
      id: MAP_LAYER_IDS.gmwOutline,
      type: "line",
      source: MAP_SOURCE_IDS.gmw,
      minzoom: GMW_MIN_QUERY_ZOOM,
      paint: {
        "line-color": COLORS.lightGreen,
        "line-width": 0.8,
        "line-opacity": 0.65,
      },
    });
  }
}

/* ============================================================================
 * SECTION 17 — ENSURE MANGROVE TYPOLOGY LAYERS
 * ========================================================================== */

function ensureTypologyLayers(map) {
  ensureGeoJsonSource(
    map,
    MAP_SOURCE_IDS.typology,
    emptyFeatureCollection()
  );

  if (!map.getLayer(MAP_LAYER_IDS.typologyFill)) {
    map.addLayer({
      id: MAP_LAYER_IDS.typologyFill,
      type: "fill",
      source: MAP_SOURCE_IDS.typology,
      minzoom: 6,
      paint: {
        "fill-color": [
          "match",
          ["get", "class"],
          "fringe",
          "#2F7A55",
          "riverine",
          "#3C8DBC",
          "basin",
          "#6B8E23",
          "dwarf",
          "#9A7B4F",
          "#5E8B65",
        ],
        "fill-opacity": 0.26,
      },
      layout: {
        visibility: "none",
      },
    });
  }

  if (!map.getLayer(MAP_LAYER_IDS.typologyOutline)) {
    map.addLayer({
      id: MAP_LAYER_IDS.typologyOutline,
      type: "line",
      source: MAP_SOURCE_IDS.typology,
      minzoom: 6,
      paint: {
        "line-color": "#D6E7C5",
        "line-width": 0.7,
        "line-opacity": 0.6,
      },
      layout: {
        visibility: "none",
      },
    });
  }
}

/* ============================================================================
 * SECTION 18 — ENSURE PROTECTED AREA LAYERS
 * ========================================================================== */

function ensureProtectedAreaLayers(map) {
  ensureGeoJsonSource(
    map,
    MAP_SOURCE_IDS.protected,
    emptyFeatureCollection()
  );

  if (!map.getLayer(MAP_LAYER_IDS.protectedFill)) {
    map.addLayer({
      id: MAP_LAYER_IDS.protectedFill,
      type: "fill",
      source: MAP_SOURCE_IDS.protected,
      minzoom: 5,
      paint: {
        "fill-color": COLORS.protected,
        "fill-opacity": DEFAULT_PROTECTED_AREA_OPACITY,
      },
      layout: {
        visibility: "none",
      },
    });
  }

  if (!map.getLayer(MAP_LAYER_IDS.protectedOutline)) {
    map.addLayer({
      id: MAP_LAYER_IDS.protectedOutline,
      type: "line",
      source: MAP_SOURCE_IDS.protected,
      minzoom: 5,
      paint: {
        "line-color": "#B9A9E8",
        "line-width": 1.1,
        "line-opacity": 0.65,
        "line-dasharray": [2, 2],
      },
      layout: {
        visibility: "none",
      },
    });
  }
}

/* ============================================================================
 * SECTION 19 — ENSURE PROJECT BOUNDARY LAYERS
 * ========================================================================== */

function ensureBoundaryLayers(map) {
  ensureGeoJsonSource(
    map,
    MAP_SOURCE_IDS.boundary,
    emptyFeatureCollection()
  );

  if (!map.getLayer(MAP_LAYER_IDS.boundaryFill)) {
    map.addLayer({
      id: MAP_LAYER_IDS.boundaryFill,
      type: "fill",
      source: MAP_SOURCE_IDS.boundary,
      paint: {
        "fill-color": COLORS.green,
        "fill-opacity": DEFAULT_BOUNDARY_OPACITY,
      },
    });
  }

  if (!map.getLayer(MAP_LAYER_IDS.boundaryLine)) {
    map.addLayer({
      id: MAP_LAYER_IDS.boundaryLine,
      type: "line",
      source: MAP_SOURCE_IDS.boundary,
      paint: {
        "line-color": COLORS.cream,
        "line-width": 3,
        "line-opacity": 0.95,
        "line-dasharray": [2.2, 1.4],
      },
    });
  }
}

/* ============================================================================
 * SECTION 20 — ENSURE BLUEGUARD CHANGE ZONE
 * ========================================================================== */

function ensureChangeZoneLayers(map) {
  ensureGeoJsonSource(
    map,
    MAP_SOURCE_IDS.change,
    emptyFeatureCollection()
  );

  if (!map.getLayer(MAP_LAYER_IDS.changeFill)) {
    map.addLayer({
      id: MAP_LAYER_IDS.changeFill,
      type: "fill",
      source: MAP_SOURCE_IDS.change,
      paint: {
        "fill-color": COLORS.coral,
        "fill-opacity": DEFAULT_CHANGE_ZONE_OPACITY,
      },
      layout: {
        visibility: "none",
      },
    });
  }

  if (!map.getLayer(MAP_LAYER_IDS.changeLine)) {
    map.addLayer({
      id: MAP_LAYER_IDS.changeLine,
      type: "line",
      source: MAP_SOURCE_IDS.change,
      paint: {
        "line-color": COLORS.orange,
        "line-width": 2,
        "line-opacity": 0.85,
        "line-dasharray": [2, 2],
      },
      layout: {
        visibility: "none",
      },
    });
  }
}

/* ============================================================================
 * SECTION 21 — ENSURE ALL DATA LAYERS
 * ========================================================================== */

function ensureAllDataLayers(map) {
  if (!map.isStyleLoaded()) {
    return;
  }

  ensureGmwLayers(map);
  ensureTypologyLayers(map);
  ensureProtectedAreaLayers(map);
  ensureBoundaryLayers(map);
  ensureChangeZoneLayers(map);
}

/* ============================================================================
 * SECTION 22 — VISIBILITY HELPERS
 * ========================================================================== */

function setLayerVisibility(map, layerId, visible) {
  if (!map.getLayer(layerId)) {
    return;
  }

  map.setLayoutProperty(
    layerId,
    "visibility",
    visible ? "visible" : "none"
  );
}

function setLayerPairVisibility(
  map,
  firstLayer,
  secondLayer,
  visible
) {
  setLayerVisibility(map, firstLayer, visible);
  setLayerVisibility(map, secondLayer, visible);
}

/* ============================================================================
 * SECTION 23 — CREATE MAP DATA LAYER STATE
 * ========================================================================== */

function applyLayerVisibility(
  map,
  {
    showGmwExtent,
    showMangroveTypology,
    showProtectedAreas,
    showChangeZone,
  }
) {
  setLayerPairVisibility(
    map,
    MAP_LAYER_IDS.gmwFill,
    MAP_LAYER_IDS.gmwOutline,
    Boolean(showGmwExtent)
  );

  setLayerPairVisibility(
    map,
    MAP_LAYER_IDS.typologyFill,
    MAP_LAYER_IDS.typologyOutline,
    Boolean(showMangroveTypology)
  );

  setLayerPairVisibility(
    map,
    MAP_LAYER_IDS.protectedFill,
    MAP_LAYER_IDS.protectedOutline,
    Boolean(showProtectedAreas)
  );

  setLayerPairVisibility(
    map,
    MAP_LAYER_IDS.changeFill,
    MAP_LAYER_IDS.changeLine,
    Boolean(showChangeZone)
  );
}

/* ============================================================================
 * SECTION 24 — MARKER CLEANUP
 * ========================================================================== */

function removeMarker(markerRef) {
  if (markerRef?.current) {
    markerRef.current.remove();
    markerRef.current = null;
  }
}

function removeMarkerCollection(markerRef) {
  if (!markerRef?.current) {
    return;
  }

  markerRef.current.forEach((marker) => {
    marker?.remove();
  });

  markerRef.current = [];
}

/* ============================================================================
 * SECTION 25 — GMW STATUS LABELS
 * ========================================================================== */

const GMW_STATUS_LABELS = Object.freeze({
  idle: "Ready",
  loading: "Loading habitat data",
  live: "Live habitat layer",
  hidden: "Layer hidden",
  zoom: "Zoom in for habitat",
  offline: "Public data unavailable",
});

/* ============================================================================
 * SECTION 26 — MAIN COMPONENT
 * ========================================================================== */

export default function MonitoringMap({
  latitude = DEFAULT_CENTER.latitude,
  longitude = DEFAULT_CENTER.longitude,
  zoom = DEFAULT_ZOOM,

  project = null,

  boundary = null,

  monitoringPoints = [],

  showProject = true,

  showCenterBeacon = true,

  showMonitoringStations = true,

  showChangeZone = false,

  showGmwExtent = true,

  showMangroveTypology = false,

  showProtectedAreas = false,

  gmwYear = 2020,

  opacity = 95,

  gmwOpacity = DEFAULT_GMW_OPACITY,

  mapMode = "satellite",

  onCursorMove,

  onGmwStatusChange,

  onGmwFeatureCountChange,

  onPublicDataError,

  zoomInRef,

  zoomOutRef,

  locateRef,

  fullscreenRef,

  fitProjectRef,

  refreshDataRef,

  className = "",

  style = {},
}) {
  /* --------------------------------------------------------------------------
   * Refs
   * ------------------------------------------------------------------------ */

  const containerRef = useRef(null);

  const mapRef = useRef(null);

  const projectMarkerRef = useRef(null);

  const stationMarkersRef = useRef([]);

  const changeMarkerRef = useRef(null);

  const gmwAbortRef = useRef(null);

  const typologyAbortRef = useRef(null);

  const protectedAbortRef = useRef(null);

  const gmwTimerRef = useRef(null);

  const typologyTimerRef = useRef(null);

  const protectedTimerRef = useRef(null);

  const cursorCallbackRef = useRef(onCursorMove);

  const statusCallbackRef = useRef(onGmwStatusChange);

  const countCallbackRef = useRef(onGmwFeatureCountChange);

  const errorCallbackRef = useRef(onPublicDataError);

  const initializedRef = useRef(false);

  /* --------------------------------------------------------------------------
   * State
   * ------------------------------------------------------------------------ */

  const [gmwStatus, setGmwStatus] = useState("idle");

  const [gmwFeatureCount, setGmwFeatureCount] = useState(0);

  const [lastGmwRequest, setLastGmwRequest] = useState(null);

  const [mapReady, setMapReady] = useState(false);

  /* --------------------------------------------------------------------------
   * Keep callback refs current.
   * ------------------------------------------------------------------------ */

  cursorCallbackRef.current = onCursorMove;

  statusCallbackRef.current = onGmwStatusChange;

  countCallbackRef.current = onGmwFeatureCountChange;

  errorCallbackRef.current = onPublicDataError;

  /* --------------------------------------------------------------------------
   * Stable data helpers.
   * ------------------------------------------------------------------------ */

  const normalizedBoundary = useMemo(
    () => normalizeBoundary(boundary),
    [boundary]
  );

  const currentLatitude = safeNumber(
    latitude,
    DEFAULT_CENTER.latitude
  );

  const currentLongitude = safeNumber(
    longitude,
    DEFAULT_CENTER.longitude
  );

  const currentZoom = clamp(
    safeNumber(zoom, DEFAULT_ZOOM),
    MIN_ZOOM,
    MAX_ZOOM
  );

  const currentOpacity = clamp(
    safeNumber(opacity, 95),
    0,
    100
  );

  const currentGmwOpacity = clamp(
    safeNumber(gmwOpacity, DEFAULT_GMW_OPACITY),
    0,
    1
  );

  /* ==========================================================================
   * SECTION 27 — STATUS DISPATCH
   * ======================================================================== */

  const publishGmwStatus = useCallback((status) => {
    setGmwStatus(status);

    statusCallbackRef.current?.({
      status,
      label: GMW_STATUS_LABELS[status] || status,
    });
  }, []);

  const publishFeatureCount = useCallback((count) => {
    const normalized = Math.max(
      0,
      safeNumber(count, 0)
    );

    setGmwFeatureCount(normalized);

    countCallbackRef.current?.(normalized);
  }, []);

  const publishPublicError = useCallback(
    (error, source) => {
      console.warn(
        `[BlueGuard] ${source} public data request failed:`,
        error
      );

      errorCallbackRef.current?.({
        source,
        error,
      });
    },
    []
  );

  /* ==========================================================================
   * SECTION 28 — UPDATE BOUNDARY DATA
   * ======================================================================== */

  const updateBoundaryData = useCallback(
    (map) => {
      ensureBoundaryLayers(map);

      const feature =
        boundaryToFeature(normalizedBoundary);

      setGeoJsonData(
        map,
        MAP_SOURCE_IDS.boundary,
        featureCollection(
          feature ? [feature] : []
        )
      );
    },
    [normalizedBoundary]
  );

  /* ==========================================================================
   * SECTION 29 — UPDATE CHANGE ZONE DATA
   * ======================================================================== */

  const updateChangeZoneData = useCallback(
    (map) => {
      ensureChangeZoneLayers(map);

      if (!showChangeZone) {
        setGeoJsonData(
          map,
          MAP_SOURCE_IDS.change,
          emptyFeatureCollection()
        );

        return;
      }

      const feature = createChangeZoneFeature(
        currentLatitude,
        currentLongitude
      );

      setGeoJsonData(
        map,
        MAP_SOURCE_IDS.change,
        featureCollection([feature])
      );
    },
    [
      currentLatitude,
      currentLongitude,
      showChangeZone,
    ]
  );

  /* ==========================================================================
   * SECTION 30 — CREATE / UPDATE PROJECT MARKER
   * ======================================================================== */

  const updateProjectMarker = useCallback(
    (map) => {
      removeMarker(projectMarkerRef);

      if (!showProject) {
        return;
      }

      const marker = new Marker({
        element: createProjectMarkerElement(),
        anchor: "bottom",
      })
        .setLngLat([
          currentLongitude,
          currentLatitude,
        ])
        .setPopup(
          new Popup({
            offset: 25,
            closeButton: true,
            maxWidth: "320px",
          }).setHTML(
            projectPopupHtml({
              project,
              latitude: currentLatitude,
              longitude: currentLongitude,
            })
          )
        )
        .addTo(map);

      projectMarkerRef.current = marker;
    },
    [
      currentLatitude,
      currentLongitude,
      project,
      showProject,
    ]
  );

  /* ==========================================================================
   * SECTION 31 — CREATE / UPDATE STATION MARKERS
   * ======================================================================== */

  const updateStationMarkers = useCallback(
    (map) => {
      removeMarkerCollection(stationMarkersRef);

      if (!showMonitoringStations) {
        return;
      }

      if (!Array.isArray(monitoringPoints)) {
        return;
      }

      monitoringPoints.forEach((point, index) => {
        if (
          !Array.isArray(point?.coordinates) ||
          point.coordinates.length < 2
        ) {
          return;
        }

        const pointLatitude =
          safeNumber(point.coordinates[0], NaN);

        const pointLongitude =
          safeNumber(point.coordinates[1], NaN);

        if (
          !Number.isFinite(pointLatitude) ||
          !Number.isFinite(pointLongitude)
        ) {
          return;
        }

        const marker = new Marker({
          element: createStationMarkerElement(
            point.health
          ),
          anchor: "center",
        })
          .setLngLat([
            pointLongitude,
            pointLatitude,
          ])
          .setPopup(
            new Popup({
              offset: 15,
              closeButton: true,
              maxWidth: "300px",
            }).setHTML(
              stationPopupHtml({
                ...point,
                id:
                  point.id ||
                  `Station ${index + 1}`,
              })
            )
          )
          .addTo(map);

        stationMarkersRef.current.push(marker);
      });
    },
    [
      monitoringPoints,
      showMonitoringStations,
    ]
  );

  /* ==========================================================================
   * SECTION 32 — CHANGE ZONE MARKER
   * ======================================================================== */

  const updateChangeMarker = useCallback(
    (map) => {
      removeMarker(changeMarkerRef);

      if (!showChangeZone) {
        return;
      }

      const marker = new Marker({
        element: createChangeMarkerElement(),
        anchor: "center",
      })
        .setLngLat([
          currentLongitude + 0.014,
          currentLatitude - 0.012,
        ])
        .setPopup(
          new Popup({
            offset: 14,
            closeButton: true,
            maxWidth: "300px",
          }).setHTML(`
            <div class="blueguard-popup">
              <div class="blueguard-popup__eyebrow">
                BLUEGUARD ANALYSIS
              </div>

              <div class="blueguard-popup__title">
                Change / Regrowth Review Zone
              </div>

              <div class="blueguard-popup__description">
                Application-level monitoring area selected for field review.
              </div>

              <div class="blueguard-popup__source">
                This overlay is not labelled as GMW-derived data.
              </div>
            </div>
          `)
        )
        .addTo(map);

      changeMarkerRef.current = marker;
    },
    [
      currentLatitude,
      currentLongitude,
      showChangeZone,
    ]
  );

  /* ==========================================================================
   * SECTION 33 — UPDATE ALL BLUEGUARD OVERLAYS
   * ======================================================================== */

  const updateBlueGuardOverlays = useCallback(
    (map) => {
      if (!map || !map.isStyleLoaded()) {
        return;
      }

      ensureAllDataLayers(map);

      updateBoundaryData(map);

      updateChangeZoneData(map);

      updateProjectMarker(map);

      updateStationMarkers(map);

      updateChangeMarker(map);

      applyLayerVisibility(map, {
        showGmwExtent,
        showMangroveTypology,
        showProtectedAreas,
        showChangeZone,
      });
    },
    [
      showGmwExtent,
      showMangroveTypology,
      showProtectedAreas,
      showChangeZone,
      updateBoundaryData,
      updateChangeZoneData,
      updateProjectMarker,
      updateStationMarkers,
      updateChangeMarker,
    ]
  );

  /* ==========================================================================
   * SECTION 34 — APPLY PUBLIC LAYER OPACITY
   * ======================================================================== */

  const applyPublicLayerOpacity = useCallback(
    (map) => {
      if (!map.isStyleLoaded()) {
        return;
      }

      const baseOpacity =
        currentOpacity / 100;

      if (map.getLayer("blueguard-base")) {
        map.setPaintProperty(
          "blueguard-base",
          "raster-opacity",
          baseOpacity
        );
      }

      if (map.getLayer(MAP_LAYER_IDS.gmwFill)) {
        map.setPaintProperty(
          MAP_LAYER_IDS.gmwFill,
          "fill-opacity",
          currentGmwOpacity
        );
      }

      if (map.getLayer(MAP_LAYER_IDS.gmwOutline)) {
        map.setPaintProperty(
          MAP_LAYER_IDS.gmwOutline,
          "line-opacity",
          clamp(currentGmwOpacity + 0.08, 0, 1)
        );
      }

      if (map.getLayer(MAP_LAYER_IDS.protectedFill)) {
        map.setPaintProperty(
          MAP_LAYER_IDS.protectedFill,
          "fill-opacity",
          DEFAULT_PROTECTED_AREA_OPACITY
        );
      }
    },
    [
      currentGmwOpacity,
      currentOpacity,
    ]
  );

  /* ==========================================================================
   * SECTION 35 — GMW REQUEST
   * ======================================================================== */

  const loadGmwData = useCallback(
    async (map, requestedYear = gmwYear) => {
      if (!map || !map.isStyleLoaded()) {
        return;
      }

      ensureGmwLayers(map);

      const source = map.getSource(
        MAP_SOURCE_IDS.gmw
      );

      if (!showGmwExtent) {
        source?.setData(
          emptyFeatureCollection()
        );

        publishGmwStatus("hidden");

        publishFeatureCount(0);

        return;
      }

      if (map.getZoom() < GMW_MIN_QUERY_ZOOM) {
        source?.setData(
          emptyFeatureCollection()
        );

        publishGmwStatus("zoom");

        publishFeatureCount(0);

        return;
      }

      if (gmwAbortRef.current) {
        gmwAbortRef.current.abort();
      }

      const controller =
        new AbortController();

      gmwAbortRef.current = controller;

      publishGmwStatus("loading");

      try {
        const result =
          await fetchGmwViewport(
            map,
            requestedYear,
            controller.signal
          );

        if (controller.signal.aborted) {
          return;
        }

        const data = normalizeGeoJsonResponse(
          result.data
        );

        source?.setData(data);

        publishFeatureCount(
          data.features.length
        );

        setLastGmwRequest({
          year: requestedYear,
          url: result.url,
          timestamp: Date.now(),
        });

        publishGmwStatus("live");
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        source?.setData(
          emptyFeatureCollection()
        );

        publishFeatureCount(0);

        publishGmwStatus("offline");

        publishPublicError(
          error,
          "Global Mangrove Watch"
        );
      }
    },
    [
      gmwYear,
      showGmwExtent,
      publishGmwStatus,
      publishFeatureCount,
      publishPublicError,
    ]
  );

  /* ==========================================================================
   * SECTION 36 — TYPOLOGY REQUEST
   * ======================================================================== */

  const loadTypologyData = useCallback(
    async (map) => {
      if (!map || !map.isStyleLoaded()) {
        return;
      }

      ensureTypologyLayers(map);

      const source = map.getSource(
        MAP_SOURCE_IDS.typology
      );

      if (!showMangroveTypology) {
        source?.setData(
          emptyFeatureCollection()
        );

        return;
      }

      if (map.getZoom() < 7) {
        source?.setData(
          emptyFeatureCollection()
        );

        return;
      }

      if (typologyAbortRef.current) {
        typologyAbortRef.current.abort();
      }

      const controller =
        new AbortController();

      typologyAbortRef.current =
        controller;

      try {
        const result =
          await fetchMangroveTypology(
            map,
            controller.signal
          );

        if (controller.signal.aborted) {
          return;
        }

        source?.setData(
          normalizeGeoJsonResponse(
            result.data
          )
        );
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        source?.setData(
          emptyFeatureCollection()
        );

        publishPublicError(
          error,
          "Mangrove Typology"
        );
      }
    },
    [
      showMangroveTypology,
      publishPublicError,
    ]
  );

  /* ==========================================================================
   * SECTION 37 — PROTECTED AREA REQUEST
   * ======================================================================== */

  const loadProtectedAreas = useCallback(
    async (map) => {
      if (!map || !map.isStyleLoaded()) {
        return;
      }

      ensureProtectedAreaLayers(map);

      const source = map.getSource(
        MAP_SOURCE_IDS.protected
      );

      if (!showProtectedAreas) {
        source?.setData(
          emptyFeatureCollection()
        );

        return;
      }

      if (map.getZoom() < 6) {
        source?.setData(
          emptyFeatureCollection()
        );

        return;
      }

      if (protectedAbortRef.current) {
        protectedAbortRef.current.abort();
      }

      const controller =
        new AbortController();

      protectedAbortRef.current =
        controller;

      try {
        const result =
          await fetchProtectedAreas(
            map,
            controller.signal
          );

        if (controller.signal.aborted) {
          return;
        }

        source?.setData(
          normalizeGeoJsonResponse(
            result.data
          )
        );
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        source?.setData(
          emptyFeatureCollection()
        );

        publishPublicError(
          error,
          "Protected Areas"
        );
      }
    },
    [
      showProtectedAreas,
      publishPublicError,
    ]
  );

  /* ==========================================================================
   * SECTION 38 — DEBOUNCED PUBLIC DATA REFRESH
   * ======================================================================== */

  const schedulePublicDataRefresh =
    useCallback(
      (map) => {
        if (!map) {
          return;
        }

        if (gmwTimerRef.current) {
          clearTimeout(
            gmwTimerRef.current
          );
        }

        if (typologyTimerRef.current) {
          clearTimeout(
            typologyTimerRef.current
          );
        }

        if (protectedTimerRef.current) {
          clearTimeout(
            protectedTimerRef.current
          );
        }

        gmwTimerRef.current =
          setTimeout(() => {
            loadGmwData(map, gmwYear);
          }, PUBLIC_QUERY_DEBOUNCE_MS);

        typologyTimerRef.current =
          setTimeout(() => {
            loadTypologyData(map);
          }, PUBLIC_QUERY_DEBOUNCE_MS + 60);

        protectedTimerRef.current =
          setTimeout(() => {
            loadProtectedAreas(map);
          }, PUBLIC_QUERY_DEBOUNCE_MS + 120);
      },
      [
        gmwYear,
        loadGmwData,
        loadTypologyData,
        loadProtectedAreas,
      ]
    );

  /* ==========================================================================
   * SECTION 39 — MAP INITIALIZATION
   * ======================================================================== */

  useEffect(() => {
    if (
      !containerRef.current ||
      mapRef.current ||
      initializedRef.current
    ) {
      return undefined;
    }

    initializedRef.current = true;

    const map = new MapLibreMap({
      container: containerRef.current,

      style: getBaseStyle(mapMode),

      center: [
        currentLongitude,
        currentLatitude,
      ],

      zoom: currentZoom,

      minZoom: MIN_ZOOM,

      maxZoom: MAX_ZOOM,

      attributionControl: true,

      cooperativeGestures: false,

      preserveDrawingBuffer: false,
    });

    mapRef.current = map;

    map.addControl(
      new NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      }),
      "top-right"
    );

    map.addControl(
      new ScaleControl({
        maxWidth: 180,
        unit: "metric",
      }),
      "bottom-left"
    );

    map.on(
      "mousemove",
      (event) => {
        cursorCallbackRef.current?.([
          event.lngLat.lat,
          event.lngLat.lng,
        ]);
      }
    );

    map.on(
      "mouseout",
      () => {
        cursorCallbackRef.current?.(
          null
        );
      }
    );

    map.on(
      "load",
      () => {
        setMapReady(true);

        updateBlueGuardOverlays(
          map
        );

        applyPublicLayerOpacity(
          map
        );

        schedulePublicDataRefresh(
          map
        );
      }
    );

    map.on(
      "moveend",
      () => {
        schedulePublicDataRefresh(
          map
        );
      }
    );

    map.on(
      "error",
      (event) => {
        if (event?.error) {
          console.warn(
            "[BlueGuard] MapLibre error:",
            event.error
          );
        }
      }
    );

    return () => {
      if (gmwTimerRef.current) {
        clearTimeout(
          gmwTimerRef.current
        );
      }

      if (typologyTimerRef.current) {
        clearTimeout(
          typologyTimerRef.current
        );
      }

      if (protectedTimerRef.current) {
        clearTimeout(
          protectedTimerRef.current
        );
      }

      gmwAbortRef.current?.abort();

      typologyAbortRef.current?.abort();

      protectedAbortRef.current?.abort();

      removeMarker(
        projectMarkerRef
      );

      removeMarker(
        changeMarkerRef
      );

      removeMarkerCollection(
        stationMarkersRef
      );

      map.remove();

      mapRef.current = null;

      initializedRef.current =
        false;

      setMapReady(false);
    };

    // The map is deliberately initialized once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ==========================================================================
   * SECTION 40 — BASEMAP STYLE SWITCH
   * ======================================================================== */

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    map.setStyle(
      getBaseStyle(mapMode)
    );

    const handleStyleLoad =
      () => {
        ensureAllDataLayers(map);

        updateBlueGuardOverlays(
          map
        );

        applyPublicLayerOpacity(
          map
        );

        schedulePublicDataRefresh(
          map
        );
      };

    map.once(
      "style.load",
      handleStyleLoad
    );

    return () => {
      map.off(
        "style.load",
        handleStyleLoad
      );
    };
  }, [
    mapMode,
    updateBlueGuardOverlays,
    applyPublicLayerOpacity,
    schedulePublicDataRefresh,
  ]);

  /* ==========================================================================
   * SECTION 41 — PROJECT / STATION / BOUNDARY UPDATES
   * ======================================================================== */

  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !map.isStyleLoaded()
    ) {
      return;
    }

    updateBlueGuardOverlays(
      map
    );
  }, [
    updateBlueGuardOverlays,
  ]);

  /* ==========================================================================
   * SECTION 42 — GMW YEAR UPDATE
   * ======================================================================== */

  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !map.isStyleLoaded()
    ) {
      return;
    }

    schedulePublicDataRefresh(
      map
    );
  }, [
    gmwYear,
    schedulePublicDataRefresh,
  ]);

  /* ==========================================================================
   * SECTION 43 — GMW VISIBILITY UPDATE
   * ======================================================================== */

  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !map.isStyleLoaded()
    ) {
      return;
    }

    ensureGmwLayers(map);

    applyLayerVisibility(
      map,
      {
        showGmwExtent,
        showMangroveTypology,
        showProtectedAreas,
        showChangeZone,
      }
    );

    if (!showGmwExtent) {
      setGeoJsonData(
        map,
        MAP_SOURCE_IDS.gmw,
        emptyFeatureCollection()
      );

      publishGmwStatus(
        "hidden"
      );
    } else {
      schedulePublicDataRefresh(
        map
      );
    }
  }, [
    showGmwExtent,
    showMangroveTypology,
    showProtectedAreas,
    showChangeZone,
    schedulePublicDataRefresh,
    publishGmwStatus,
  ]);

  /* ==========================================================================
   * SECTION 44 — OPACITY UPDATE
   * ======================================================================== */

  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !map.isStyleLoaded()
    ) {
      return;
    }

    applyPublicLayerOpacity(
      map
    );
  }, [
    currentOpacity,
    currentGmwOpacity,
    applyPublicLayerOpacity,
  ]);

  /* ==========================================================================
   * SECTION 45 — CAMERA UPDATE
   * ======================================================================== */

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const currentCenter =
      map.getCenter();

    const distance =
      Math.abs(
        currentCenter.lng -
          currentLongitude
      ) +
      Math.abs(
        currentCenter.lat -
          currentLatitude
      );

    if (distance < 0.00001) {
      return;
    }

    map.flyTo({
      center: [
        currentLongitude,
        currentLatitude,
      ],

      zoom: currentZoom,

      duration:
        MAP_FLY_DURATION_MS,

      essential: true,
    });
  }, [
    currentLatitude,
    currentLongitude,
    currentZoom,
  ]);

  /* ==========================================================================
   * SECTION 46 — IMPERATIVE MAP CONTROLS
   * ======================================================================== */

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (zoomInRef) {
      zoomInRef.current =
        () => {
          map.zoomIn({
            duration: 350,
          });
        };
    }

    if (zoomOutRef) {
      zoomOutRef.current =
        () => {
          map.zoomOut({
            duration: 350,
          });
        };
    }

    if (locateRef) {
      locateRef.current =
        () => {
          map.flyTo({
            center: [
              currentLongitude,
              currentLatitude,
            ],

            zoom: Math.max(
              13,
              currentZoom
            ),

            duration:
              MAP_FLY_DURATION_MS,

            essential: true,
          });
        };
    }

    if (fullscreenRef) {
      fullscreenRef.current =
        () => {
          const container =
            map.getContainer();

          if (
            !document.fullscreenElement
          ) {
            container.requestFullscreen?.();
          } else {
            document.exitFullscreen?.();
          }

          window.setTimeout(
            () => map.resize(),
            300
          );
        };
    }

    if (fitProjectRef) {
      fitProjectRef.current =
        () => {
          const feature =
            boundaryToFeature(
              normalizedBoundary
            );

          if (
            !feature ||
            !feature.geometry ||
            !feature.geometry.coordinates?.[0]
          ) {
            map.flyTo({
              center: [
                currentLongitude,
                currentLatitude,
              ],
              zoom: currentZoom,
              duration:
                MAP_FLY_DURATION_MS,
              essential: true,
            });

            return;
          }

          const ring =
            feature.geometry.coordinates[0];

          const longitudes =
            ring.map(
              (coordinate) =>
                coordinate[0]
            );

          const latitudes =
            ring.map(
              (coordinate) =>
                coordinate[1]
            );

          if (
            !longitudes.length ||
            !latitudes.length
          ) {
            return;
          }

          const west =
            Math.min(
              ...longitudes
            );

          const east =
            Math.max(
              ...longitudes
            );

          const south =
            Math.min(
              ...latitudes
            );

          const north =
            Math.max(
              ...latitudes
            );

          map.fitBounds(
            [
              [west, south],
              [east, north],
            ],
            {
              padding: 90,
              duration:
                MAP_FLY_DURATION_MS,
              maxZoom: 16,
              essential: true,
            }
          );
        };
    }

    if (refreshDataRef) {
      refreshDataRef.current =
        () => {
          schedulePublicDataRefresh(
            map
          );
        };
    }

    return () => {
      if (zoomInRef) {
        zoomInRef.current =
          null;
      }

      if (zoomOutRef) {
        zoomOutRef.current =
          null;
      }

      if (locateRef) {
        locateRef.current =
          null;
      }

      if (fullscreenRef) {
        fullscreenRef.current =
          null;
      }

      if (fitProjectRef) {
        fitProjectRef.current =
          null;
      }

      if (refreshDataRef) {
        refreshDataRef.current =
          null;
      }
    };
  }, [
    currentLatitude,
    currentLongitude,
    currentZoom,
    normalizedBoundary,
    schedulePublicDataRefresh,
    zoomInRef,
    zoomOutRef,
    locateRef,
    fullscreenRef,
    fitProjectRef,
    refreshDataRef,
  ]);

  /* ==========================================================================
   * SECTION 47 — MAP CLICK IDENTIFICATION
   * ======================================================================== */

  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !mapReady
    ) {
      return;
    }

    const clickableLayers = [
      MAP_LAYER_IDS.gmwFill,
      MAP_LAYER_IDS.typologyFill,
      MAP_LAYER_IDS.protectedFill,
      MAP_LAYER_IDS.boundaryFill,
      MAP_LAYER_IDS.changeFill,
    ];

    const handleMapClick =
      (event) => {
        const availableLayers =
          clickableLayers.filter(
            (layerId) =>
              Boolean(
                map.getLayer(
                  layerId
                )
              )
          );

        if (
          !availableLayers.length
        ) {
          return;
        }

        const features =
          map.queryRenderedFeatures(
            event.point,
            {
              layers:
                availableLayers,
            }
          );

        if (
          !features.length
        ) {
          return;
        }

        const feature =
          features[0];

        const layerId =
          feature.layer?.id;

        if (
          layerId ===
            MAP_LAYER_IDS.gmwFill
        ) {
          const popup =
            new Popup({
              closeButton: true,
              closeOnClick: true,
              maxWidth: "320px",
            })
              .setLngLat(
                event.lngLat
              )
              .setHTML(
                gmwPopupHtml({
                  year: gmwYear,
                  feature,
                })
              )
              .addTo(map);

          return;
        }

        if (
          layerId ===
          MAP_LAYER_IDS.protectedFill
        ) {
          const properties =
            feature.properties ||
            {};

          new Popup({
            closeButton: true,
            closeOnClick: true,
            maxWidth: "320px",
          })
            .setLngLat(
              event.lngLat
            )
            .setHTML(`
              <div class="blueguard-popup">
                <div class="blueguard-popup__eyebrow">
                  PROTECTED AREA
                </div>

                <div class="blueguard-popup__title">
                  ${escapeHtml(
                    properties.NAME ||
                      properties.name ||
                      "Protected area"
                  )}
                </div>

                <div class="blueguard-popup__description">
                  ${escapeHtml(
                    properties.DESIG ||
                      properties.desig ||
                      "Protected / conservation area"
                  )}
                </div>

                <div class="blueguard-popup__source">
                  Source: UNEP-WCMC / IUCN WDPA
                </div>
              </div>
            `)
            .addTo(map);

          return;
        }

        if (
          layerId ===
          MAP_LAYER_IDS.typologyFill
        ) {
          const properties =
            feature.properties ||
            {};

          new Popup({
            closeButton: true,
            closeOnClick: true,
            maxWidth: "320px",
          })
            .setLngLat(
              event.lngLat
            )
            .setHTML(`
              <div class="blueguard-popup">
                <div class="blueguard-popup__eyebrow">
                  MANGROVE TYPOLOGY
                </div>

                <div class="blueguard-popup__title">
                  ${escapeHtml(
                    properties.class ||
                      "Mangrove class"
                  )}
                </div>

                <div class="blueguard-popup__description">
                  Supporting mangrove typology dataset.
                </div>

                <div class="blueguard-popup__source">
                  Source: UNEP-WCMC / TNC
                </div>
              </div>
            `)
            .addTo(map);
        }
      };

    map.on(
      "click",
      handleMapClick
    );

    return () => {
      map.off(
        "click",
        handleMapClick
      );
    };
  }, [
    mapReady,
    gmwYear,
  ]);

  /* ==========================================================================
   * SECTION 48 — CURSOR COORDINATES
   * ======================================================================== */

  const coordinateLabel =
    `${currentLatitude.toFixed(
      5
    )}° N · ${currentLongitude.toFixed(
      5
    )}° E`;

  /* ==========================================================================
   * SECTION 49 — RENDER
   * ======================================================================== */

  return (
    <>
      <style>{`
        @keyframes blueguard-map-pulse {
          0% {
            transform: scale(.72);
            opacity: .85;
          }

          70% {
            transform: scale(1.45);
            opacity: 0;
          }

          100% {
            transform: scale(1.45);
            opacity: 0;
          }
        }

        @keyframes blueguard-change-pulse {
          0% {
            box-shadow:
              0 0 0 0
              rgba(196, 106, 63, .55);
          }

          70% {
            box-shadow:
              0 0 0 10px
              rgba(196, 106, 63, 0);
          }

          100% {
            box-shadow:
              0 0 0 0
              rgba(196, 106, 63, 0);
          }
        }

        .blueguard-monitoring-map {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 560px;
          overflow: hidden;
          background: #dbe7ea;
        }

        .blueguard-project-marker {
          position: relative;
          width: 48px;
          height: 48px;
          cursor: pointer;
        }

        .blueguard-project-marker__pulse {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background:
            rgba(18, 84, 90, .25);
          animation:
            blueguard-map-pulse
            2.1s
            infinite;
        }

        .blueguard-project-marker__pin {
          position: absolute;
          left: 7px;
          top: 4px;
          width: 34px;
          height: 34px;
          border-radius:
            50%
            50%
            50%
            0;
          transform:
            rotate(-45deg);
          background:
            ${COLORS.deepTeal};
          border:
            3px solid
            ${COLORS.cream};
          box-shadow:
            0 8px 18px
            rgba(11, 43, 51, .42);
        }

        .blueguard-project-marker__dot {
          position: absolute;
          left: 9px;
          top: 9px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background:
            ${COLORS.cream};
        }

        .blueguard-station-marker {
          width: 23px;
          height: 23px;
          border:
            3px solid
            white;
          border-radius: 50%;
          cursor: pointer;
          background:
            ${COLORS.deepTeal};
          box-shadow:
            0 3px 12px
            rgba(11, 43, 51, .48);
        }

        .blueguard-station-marker[data-health="excellent"] {
          background:
            ${COLORS.green};
        }

        .blueguard-station-marker[data-health="good"] {
          background:
            ${COLORS.deepTeal};
        }

        .blueguard-station-marker[data-health="watch"] {
          background:
            ${COLORS.coral};
        }

        .blueguard-change-marker {
          width: 20px;
          height: 20px;
          border:
            3px solid
            white;
          border-radius: 50%;
          cursor: pointer;
          background:
            ${COLORS.coral};
          animation:
            blueguard-change-pulse
            1.8s
            infinite;
          box-shadow:
            0 3px 12px
            rgba(11, 43, 51, .35);
        }

        .blueguard-popup {
          min-width: 205px;
          padding: 3px;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .blueguard-popup__eyebrow {
          font-size: 10px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: .11em;
          text-transform: uppercase;
          color:
            ${COLORS.deepTeal};
        }

        .blueguard-popup__title {
          margin-top: 6px;
          color:
            #0f172a;
          font-size: 15px;
          line-height: 1.3;
          font-weight: 850;
        }

        .blueguard-popup__description {
          margin-top: 5px;
          color:
            #475569;
          font-size: 12px;
          line-height: 1.5;
        }

        .blueguard-popup__coordinates {
          margin-top: 9px;
          padding-top: 8px;
          border-top:
            1px solid
            #e2e8f0;
          color:
            #64748b;
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            monospace;
          font-size: 10px;
        }

        .blueguard-popup__metric {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 9px;
          padding:
            8px
            10px;
          border-radius: 9px;
          background:
            #f1f5f9;
          color:
            #475569;
          font-size: 11px;
        }

        .blueguard-popup__metric strong {
          color:
            ${COLORS.deepTeal};
          font-size: 12px;
        }

        .blueguard-popup__source {
          margin-top: 8px;
          padding-top: 7px;
          border-top:
            1px solid
            #e2e8f0;
          color:
            #94a3b8;
          font-size: 9px;
          line-height: 1.45;
        }

        .blueguard-map-status {
          pointer-events: none;
          position: absolute;
          left: 16px;
          bottom: 16px;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 8px;
          padding:
            8px
            11px;
          border:
            1px solid
            rgba(255,255,255,.24);
          border-radius: 12px;
          background:
            rgba(11,43,51,.88);
          color: white;
          box-shadow:
            0 8px 24px
            rgba(15,23,42,.18);
          backdrop-filter:
            blur(10px);
        }

        .blueguard-map-status__dot {
          width: 7px;
          height: 7px;
          flex:
            0 0
            7px;
          border-radius: 50%;
          background:
            #94a3b8;
        }

        .blueguard-map-status__dot[data-state="live"] {
          background:
            #52d6b4;
          box-shadow:
            0 0 0 4px
            rgba(82,214,180,.13);
        }

        .blueguard-map-status__dot[data-state="loading"] {
          background:
            #fbbf24;
          animation:
            blueguard-map-pulse
            1.2s
            infinite;
        }

        .blueguard-map-status__dot[data-state="offline"] {
          background:
            #f08a5d;
        }

        .blueguard-map-status__label {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .blueguard-map-status__meta {
          font-size: 10px;
          color:
            rgba(255,255,255,.68);
        }

        .blueguard-map-coordinates {
          pointer-events: none;
          position: absolute;
          right: 16px;
          bottom: 16px;
          z-index: 20;
          padding:
            8px
            11px;
          border:
            1px solid
            rgba(255,255,255,.22);
          border-radius: 11px;
          background:
            rgba(11,43,51,.82);
          color:
            rgba(255,255,255,.88);
          box-shadow:
            0 8px 24px
            rgba(15,23,42,.18);
          backdrop-filter:
            blur(10px);
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            monospace;
          font-size: 10px;
        }

        .blueguard-monitoring-map
          .maplibregl-ctrl-group {
          overflow: hidden;
          border:
            1px solid
            rgba(226,232,240,.95);
          border-radius: 14px;
          box-shadow:
            0 8px 22px
            rgba(15,23,42,.16);
        }

        .blueguard-monitoring-map
          .maplibregl-ctrl button {
          width: 42px;
          height: 42px;
        }

        .blueguard-monitoring-map
          .maplibregl-popup-content {
          padding: 12px;
          border-radius: 14px;
          box-shadow:
            0 14px 34px
            rgba(15,23,42,.2);
        }

        .blueguard-monitoring-map
          .maplibregl-popup-close-button {
          padding:
            3px
            7px;
          color:
            #64748b;
          font-size: 18px;
        }

        .blueguard-monitoring-map
          .maplibregl-ctrl-attrib {
          font-size: 9px;
          opacity: .82;
        }

        .blueguard-map-corner-badge {
          pointer-events: none;
          position: absolute;
          top: 16px;
          left: 16px;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 7px;
          padding:
            7px
            10px;
          border:
            1px solid
            rgba(255,255,255,.24);
          border-radius: 10px;
          background:
            rgba(11,43,51,.82);
          color:
            white;
          box-shadow:
            0 8px 22px
            rgba(15,23,42,.15);
          backdrop-filter:
            blur(9px);
        }

        .blueguard-map-corner-badge__year {
          color:
            #52d6b4;
          font-size: 11px;
          font-weight: 900;
        }

        .blueguard-map-corner-badge__text {
          color:
            rgba(255,255,255,.72);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .05em;
          text-transform: uppercase;
        }
      `}</style>

      <div
        className={`blueguard-monitoring-map ${className}`}
        style={style}
      >
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "100%",
            minHeight: "560px",
          }}
        />

        <div
          className="blueguard-map-corner-badge"
          aria-hidden="true"
        >
          <span className="blueguard-map-corner-badge__year">
            {gmwYear}
          </span>

          <span className="blueguard-map-corner-badge__text">
            GMW habitat extent
          </span>
        </div>

        <div
          className="blueguard-map-status"
          aria-live="polite"
        >
          <span
            className="blueguard-map-status__dot"
            data-state={gmwStatus}
          />

          <span className="blueguard-map-status__label">
            GMW
          </span>

          <span className="blueguard-map-status__meta">
            {GMW_STATUS_LABELS[gmwStatus] ||
              gmwStatus}
            {gmwStatus === "live" &&
              ` · ${gmwFeatureCount.toLocaleString()} features`}
          </span>
        </div>

        <div
          className="blueguard-map-coordinates"
          aria-hidden="true"
        >
          {coordinateLabel}
        </div>
      </div>
    </>
  );
}

/* ============================================================================
 * SECTION 50 — PUBLIC EXPORTS
 * ========================================================================== */

export {
  GMW_YEARS,
  GMW_LAYER_BY_YEAR,
  GMW_FEATURE_SERVER,
  GMW_MAP_SERVER,
  MANGROVE_TYPOLOGY_SERVICE,
  WDPA_POLYGON_SERVICE,
  MAP_LAYER_IDS,
  MAP_SOURCE_IDS,
};
