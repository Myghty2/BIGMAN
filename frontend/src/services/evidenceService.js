import { supabase } from "./supabaseClient";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const EVIDENCE_BUCKET = import.meta.env.VITE_SUPABASE_EVIDENCE_BUCKET || "evidence";

/**
 * Upload a single file to Supabase Storage Bucket
 * @param {File} file
 * @param {string} projectId
 * @returns {Promise<{ name: string, url: string, size: number, type: string }>}
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
      console.warn("Supabase upload notice:", error.message);
      // If bucket doesn't exist or offline, fallback to object preview url
      return {
        name: file.name,
        path: filePath,
        url: URL.createObjectURL(file),
        size: file.size,
        type: file.type,
      };
    }

    // Get Public URL from Supabase
    const { data: publicUrlData } = supabase.storage
      .from(EVIDENCE_BUCKET)
      .getPublicUrl(filePath);

    return {
      name: file.name,
      path: filePath,
      url: publicUrlData?.publicUrl || URL.createObjectURL(file),
      size: file.size,
      type: file.type,
    };
  } catch (err) {
    console.error("Failed to upload to Supabase:", err);
    return {
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      type: file.type,
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

    if (!response.ok) {
      console.warn("Backend /evidence/submit returned non-200:", response.status);
    }
  } catch (err) {
    console.warn("Backend offline or unreachable, saved locally:", err);
  }

  // 3. Always update local storage for instant offline UI reactivity
  const existing = JSON.parse(localStorage.getItem("blueguard_evidence") || "[]");
  localStorage.setItem("blueguard_evidence", JSON.stringify([...existing, payload]));

  return payload;
}
