import { getCurrentUser } from "./authService";

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

  const orgId = String(currentUser.id || currentUser.uid || "").trim();
  const orgEmail = String(currentUser.officialEmail || currentUser.email || "").toLowerCase().trim();
  const orgName = String(currentUser.organizationName || currentUser.name || "").toLowerCase().trim();

  return (allProjects || []).filter((p) => {
    const pOrgId = String(p.organizationId || p.owner || "").trim();
    const pEmail = String(p.organizationEmail || "").toLowerCase().trim();
    const pName = String(p.organizationName || "").toLowerCase().trim();

    // 1. Exact ID match
    if (pOrgId && (pOrgId === orgId || pOrgId === currentUser.uid)) return true;
    // 2. Exact email match
    if (pEmail && orgEmail && pEmail === orgEmail) return true;
    // 3. Exact organization name match
    if (pName && orgName && pName === orgName) return true;

    // 4. Default demo NGO (ORG-001 / demo@mangrove.org) only
    if ((orgId === "ORG-001" || orgEmail === "demo@mangrove.org") && (p.id === "BG-001" || p.id === "BG-002" || p.id === "BG-003" || !pOrgId)) {
      return true;
    }

    return false;
  });
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
