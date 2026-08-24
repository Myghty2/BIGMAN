import os
import threading
import time
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Query, Response

load_dotenv()

router = APIRouter(prefix="/api/satellite", tags=["satellite"])

TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
CATALOG_URL = "https://sh.dataspace.copernicus.eu/catalog/v1/search"
PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process"
CRS84 = "http://www.opengis.net/def/crs/OGC/1.3/CRS84"

TRUE_COLOR_EVALSCRIPT = """//VERSION=3
function setup() {
  return {
    input: ["B02", "B03", "B04"],
    output: { bands: 3 }
  };
}

function evaluatePixel(sample) {
  return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02];
}
"""

_token = {"value": None, "expires_at": 0}
_token_lock = threading.Lock()
_image_cache = {}
_cache_lock = threading.Lock()


def _credentials():
    client_id = os.getenv("COPERNICUS_CLIENT_ID")
    client_secret = os.getenv("COPERNICUS_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(
            status_code=503,
            detail="Copernicus credentials are missing from backend/.env",
        )
    return client_id, client_secret


def _access_token():
    now = time.time()
    if _token["value"] and now < _token["expires_at"]:
        return _token["value"]

    with _token_lock:
        now = time.time()
        if _token["value"] and now < _token["expires_at"]:
            return _token["value"]

        client_id, client_secret = _credentials()
        try:
            response = requests.post(
                TOKEN_URL,
                data={
                    "grant_type": "client_credentials",
                    "client_id": client_id,
                    "client_secret": client_secret,
                },
                timeout=20,
            )
            response.raise_for_status()
            payload = response.json()
        except requests.RequestException as exc:
            raise HTTPException(status_code=502, detail="Could not authenticate with Copernicus") from exc

        _token["value"] = payload["access_token"]
        _token["expires_at"] = now + max(60, int(payload.get("expires_in", 3600)) - 60)
        return _token["value"]


def _iso(value):
    return value.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _latest_acquisition(token, bbox, max_cloud):
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=180)
    payload = {
        "bbox": bbox,
        "datetime": f"{_iso(start)}/{_iso(end)}",
        "collections": ["sentinel-2-l2a"],
        "limit": 100,
    }

    try:
        response = requests.post(
            CATALOG_URL,
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        features = response.json().get("features", [])
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail="Could not search the Sentinel-2 catalogue") from exc

    features = [
        feature
        for feature in features
        if float(feature.get("properties", {}).get("eo:cloud_cover", 100)) <= max_cloud
    ]

    if not features:
        raise HTTPException(
            status_code=404,
            detail=f"No Sentinel-2 image below {max_cloud}% cloud cover was found in the last 180 days",
        )

    return max(features, key=lambda item: item.get("properties", {}).get("datetime", ""))


def _render_image(token, bbox, acquisition, max_cloud, width, height):
    captured_at = acquisition.get("properties", {}).get("datetime")
    if not captured_at:
        raise HTTPException(status_code=502, detail="Copernicus returned an acquisition without a capture date")

    captured = datetime.fromisoformat(captured_at.replace("Z", "+00:00"))
    time_from = _iso(captured - timedelta(minutes=30))
    time_to = _iso(captured + timedelta(minutes=30))

    payload = {
        "input": {
            "bounds": {"bbox": bbox, "properties": {"crs": CRS84}},
            "data": [
                {
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {"from": time_from, "to": time_to},
                        "maxCloudCoverage": max_cloud,
                        "mosaickingOrder": "mostRecent",
                    },
                    "processing": {"upsampling": "BICUBIC", "downsampling": "BILINEAR"},
                }
            ],
        },
        "output": {
            "width": width,
            "height": height,
            "responses": [{"identifier": "default", "format": {"type": "image/jpeg"}}],
        },
        "evalscript": TRUE_COLOR_EVALSCRIPT,
    }

    try:
        response = requests.post(
            PROCESS_URL,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json=payload,
            timeout=60,
        )
        response.raise_for_status()
        return response.content
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail="Could not render the Sentinel-2 image") from exc


@router.get("/latest")
def latest_satellite_image(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    span: float = Query(0.08, ge=0.005, le=0.5),
    max_cloud: int = Query(35, ge=0, le=100),
    width: int = Query(1200, ge=320, le=2500),
    height: int = Query(700, ge=240, le=1600),
    refresh: bool = False,
):
    half = span / 2
    bbox = [longitude - half, latitude - half, longitude + half, latitude + half]
    cache_key = (round(latitude, 5), round(longitude, 5), round(span, 4), max_cloud, width, height)

    if not refresh:
        with _cache_lock:
            cached = _image_cache.get(cache_key)
            if cached and time.time() - cached["stored_at"] < 1800:
                return Response(content=cached["image"], media_type="image/jpeg", headers=cached["headers"])

    token = _access_token()
    acquisition = _latest_acquisition(token, bbox, max_cloud)
    image = _render_image(token, bbox, acquisition, max_cloud, width, height)
    properties = acquisition.get("properties", {})
    headers = {
        "X-Acquisition-Date": properties.get("datetime", "unknown"),
        "X-Cloud-Cover": str(round(float(properties.get("eo:cloud_cover", 0)), 1)),
        "X-Satellite-Source": "Copernicus Sentinel-2 L2A",
        "Cache-Control": "private, max-age=1800",
    }

    with _cache_lock:
        _image_cache[cache_key] = {"image": image, "headers": headers, "stored_at": time.time()}

    return Response(content=image, media_type="image/jpeg", headers=headers)