import { supabase } from "./supabaseClient";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const EVIDENCE_BUCKET = import.meta.env.VITE_SUPABASE_EVIDENCE_BUCKET || "evidence";

/**
 * Upload a single file to Supabase Storage Bucket
 * @param {File} file
 * @param {string} projectId
 * @returns {Promise<{ name: string, url: string, size: number, type: string, error?: string }>}
 */
export async function uploadEvidenceFileToSupabase(file, projectId = "general") {
  try {
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${projectId}/${timestamp}_${cleanName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error(`[Supabase Upload Error for ${file.name}]:`, error.message);
      return {
        name: file.name,
        path: filePath,
        url: URL.createObjectURL(file),
        size: file.size,
        type: file.type,
        error: error.message,
      };
    }

    // Get Public URL from Supabase
    const { data: publicUrlData } = supabase.storage
      .from(EVIDENCE_BUCKET)
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl || URL.createObjectURL(file);
    console.log(`[Supabase Upload Success]: ${file.name} -> ${publicUrl}`);

    return {
      name: file.name,
      path: filePath,
      url: publicUrl,
      size: file.size,
      type: file.type,
    };
  } catch (err) {
    console.error("[Supabase Upload Exception]:", err);
    return {
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      type: file.type,
      error: err.message || "Upload failed",
    };
  }
}

/**
 * Submit entire Evidence Bundle (uploads files to Supabase and posts to FastAPI backend)
 */
export async function submitEvidenceBundle(evidenceData, files = []) {
  // 1. Upload files to Supabase in parallel
  const uploadedFiles = await Promise.all(
    files.map((file) => uploadEvidenceFileToSupabase(file, evidenceData.projectId))
  );

  const errors = uploadedFiles.filter((f) => f.error);
  if (errors.length > 0) {
    console.warn(`[Supabase Notice]: ${errors.length} file(s) had issues with Supabase bucket:`, errors);
  }

  const payload = {
    ...evidenceData,
    files: uploadedFiles,
    submittedAt: new Date().toISOString(),
  };

  // 2. Post evidence bundle to FastAPI Backend
  try {
    const session = JSON.parse(localStorage.getItem("blueguard_session") || "{}");
    const token = session.token || "";

    const response = await fetch(`${API_BASE_URL}/evidence/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const resData = await response.json();
      console.log("[Backend Evidence Saved]:", resData);
    }
  } catch (err) {
    console.warn("Backend offline or unreachable, saved locally:", err);
  }

  // 3. Always update local storage for instant offline UI reactivity
  const existing = JSON.parse(localStorage.getItem("blueguard_evidence") || "[]");
  localStorage.setItem("blueguard_evidence", JSON.stringify([...existing, payload]));

  return {
    payload,
    hasSupabaseErrors: errors.length > 0,
    errors,
  };
}

/**
 * Fetch all evidence from backend + Supabase for the Admin Console
 */
export async function fetchAllEvidenceForAdmin() {
  const localList = JSON.parse(localStorage.getItem("blueguard_evidence") || "[]");

  try {
    const response = await fetch(`${API_BASE_URL}/evidence/all`);
    if (response.ok) {
      const data = await response.json();
      const backendItems = (data.evidence || []).map((doc) => ({
        id: doc.evidence_id || doc.id,
        projectId: doc.project_id || doc.projectId,
        projectName: doc.project_name || doc.projectName,
        evidenceType: doc.evidence_type || doc.evidenceType,
        description: doc.description,
        capturedAt: doc.captured_at || doc.capturedAt,
        gpsCoordinates: doc.gps_coordinates || doc.gpsCoordinates,
        files: doc.files || [],
        uploadedBy: doc.uploaded_by || doc.uploadedBy,
        status: doc.status,
        evidenceHash: doc.evidence_hash,
      }));

      // Merge backend items with local items without duplicates
      const map = new Map();
      [...localList, ...backendItems].forEach((item) => {
        if (item.id) map.set(item.id, item);
      });
      return [...map.values()];
    }
  } catch (err) {
    console.warn("Backend /evidence/all offline, using local data:", err);
  }

  return localList;
}


