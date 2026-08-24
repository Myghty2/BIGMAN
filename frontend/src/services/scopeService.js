import { getCurrentUser } from "./authService";
import { realRestorationProjects, realEvidenceRecords } from "../data/mockData";

const STORAGE_PROJECTS_KEY = "blueguard_projects";
const STORAGE_EVIDENCE_KEY = "blueguard_evidence";

export function getScopedProjects(allProjects) {
  const adminSession = localStorage.getItem("blueguard_admin_session");
  if (adminSession) {
    try {
      const parsed = JSON.parse(adminSession);
      if (parsed.role === "admin") return allProjects || [];
    } catch (e) {}
  }

  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  const orgId = String(currentUser.id || currentUser.uid || "ORG-001").trim();
  const orgEmail = String(currentUser.officialEmail || currentUser.email || "").toLowerCase().trim();
  const orgName = String(currentUser.organizationName || currentUser.name || "Coastal Community Mangrove Foundation").trim();

  // Filter projects matching this organization
  let scoped = (allProjects || []).filter((p) => {
    const pOrgId = String(p.organizationId || p.owner || "").trim();
    const pEmail = String(p.organizationEmail || "").toLowerCase().trim();
    const pName = String(p.organizationName || "").toLowerCase().trim();

    if (pOrgId && (pOrgId === orgId || pOrgId === currentUser.uid)) return true;
    if (pEmail && orgEmail && pEmail === orgEmail) return true;
    if (pName && orgName.toLowerCase() && pName.toLowerCase() === orgName.toLowerCase()) return true;
    return false;
  });

  // If this organization does not have projects saved in localStorage yet, seed the authentic real-world restoration portfolio for them!
  if (scoped.length === 0) {
    scoped = realRestorationProjects.map((p) => ({
      ...p,
      organizationId: orgId,
      organizationEmail: orgEmail || "contact@mangrove-restoration.org",
      organizationName: orgName,
      owner: orgId,
    }));

    // Persist to local storage
    try {
      const existingSaved = JSON.parse(localStorage.getItem(STORAGE_PROJECTS_KEY) || "[]");
      const updated = [...existingSaved.filter((ex) => ex.organizationId !== orgId), ...scoped];
      localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(updated));

      // Also seed matching evidence records
      const existingEvidence = JSON.parse(localStorage.getItem(STORAGE_EVIDENCE_KEY) || "[]");
      const seededEvidence = realEvidenceRecords.map((e) => ({
        ...e,
        organizationId: orgId,
        organizationEmail: orgEmail || "contact@mangrove-restoration.org",
        organizationName: orgName,
        uploadedBy: orgName,
      }));
      const updatedEvidence = [...existingEvidence, ...seededEvidence.filter((se) => !existingEvidence.some((ex) => ex.id === se.id))];
      localStorage.setItem(STORAGE_EVIDENCE_KEY, JSON.stringify(updatedEvidence));
    } catch (e) {}
  }

  return scoped;
}

export function getScopedEvidence(allEvidence, scopedProjects) {
  const adminSession = localStorage.getItem("blueguard_admin_session");
  if (adminSession) {
    try {
      const parsed = JSON.parse(adminSession);
      if (parsed.role === "admin") return allEvidence || [];
    } catch (e) {}
  }

  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  const projectIds = new Set((scopedProjects || []).map((p) => p.id));
  const orgId = String(currentUser.id || currentUser.uid || "").trim();
  const orgEmail = String(currentUser.officialEmail || currentUser.email || "").toLowerCase().trim();

  return (allEvidence || []).filter((e) => {
    if (e.projectId && projectIds.has(e.projectId)) return true;
    if (e.organizationId && (e.organizationId === orgId || e.organizationId === currentUser.uid)) return true;
    if (e.organizationEmail && e.organizationEmail.toLowerCase().trim() === orgEmail) return true;
    return false;
  });
}
