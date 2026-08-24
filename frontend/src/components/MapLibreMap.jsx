import { useEffect, useRef } from "react";

import {
  Map,
  Marker,
  NavigationControl,
  Popup,
} from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

export default function MapLibreMap({
  latitude = 19.076,
  longitude = 72.8777,
  zoom = 10,
  projectName = "BlueGuard Project",
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (mapRef.current) return;

    const mapInstance = new Map({
      container: mapContainer.current,

      style:
        "https://tiles.openfreemap.org/styles/liberty",

      center: [
        longitude,
        latitude,
      ],

      zoom,

      attributionControl: true,
    });

    mapRef.current = mapInstance;


    // ============================================================
    // MAP CONTROLS
    // ============================================================

    mapInstance.addControl(
      new NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      }),
      "top-right"
    );


    // ============================================================
    // PROJECT POPUP
    // ============================================================

    const popup = new Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: true,
    }).setHTML(`
      <div
        style="
          min-width: 190px;
          font-family: Arial, sans-serif;
          padding: 4px;
        "
      >
        <div
          style="
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 5px;
          "
        >
          ${projectName}
        </div>

        <div
          style="
            font-size: 12px;
            color: #64748b;
          "
        >
          BlueGuard restoration project
        </div>

        <div
          style="
            margin-top: 8px;
            font-size: 11px;
            color: #64748b;
          "
        >
          📍 ${latitude.toFixed(4)},
          ${longitude.toFixed(4)}
        </div>
      </div>
    `);


    // ============================================================
    // PROJECT MARKER
    // ============================================================

    new Marker({
      color: "#0f9f8f",
    })
      .setLngLat([
        longitude,
        latitude,
      ])
      .setPopup(popup)
      .addTo(mapInstance);


    // ============================================================
    // CLEANUP
    // ============================================================

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };

  }, [
    latitude,
    longitude,
    zoom,
    projectName,
  ]);


  // ============================================================
  // MAP UI
  // ============================================================

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "450px",
        minHeight: "350px",
        borderRadius: "16px",
        overflow: "hidden",
        background: "#e2e8f0",
      }}
    />
  );
}