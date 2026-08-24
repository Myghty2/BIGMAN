import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const AUDIT_KEY = "blueguard_audit_log";
const VERIFICATION_KEY = "blueguard_verifications";

// Baseline Seeded Blockchain Proofs (Ensures Ledger is never blank)
const SEED_AUDIT_LOGS = [
  {
    id: "AUD-1787548001",
    projectId: "BG-001",
    projectName: "Sundarbans Mangrove Revival",
    decision: "Approve",
    remarks: "Verified via Sentinel-2 L2A NDVI multispectral biomass alignment, tidal flush validation, and geotagged field drone orthomosaics.",
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    verificationHash: "0x7f9a8b3c4129e92d718a",
    admin: "BlueGuard Lead MRV Auditor",
    blockNumber: 18432910,
    carbonAmount: "18,450 tCO₂e",
  },
  {
    id: "AUD-1787548002",
    projectId: "BG-003",
    projectName: "Palk Bay Seagrass Recovery",
    decision: "Approve",
    remarks: "Full benthic seagrass canopy coverage cross-matched with multispectral bathymetry data.",
    timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
    verificationHash: "0x3b8f192847a6c029d41e",
    admin: "BlueGuard Lead MRV Auditor",
    blockNumber: 18432952,
    carbonAmount: "12,100 tCO₂e",
  },
  {
    id: "AUD-1787548003",
    projectId: "BG-002",
    projectName: "Konkan Blue Belt",
    decision: "Evidence",
    remarks: "High tide boundary overlap detected in Sentinel-2 scan. Requested high-resolution low-tide drone imagery.",
    timestamp: new Date(Date.now() - 86400000 * 6).toISOString(),
    verificationHash: null,
    admin: "BlueGuard MRV Verifier",
    blockNumber: null,
    carbonAmount: "9,820 tCO₂e",
  },
];

const SEED_CERTIFICATES = [
  {
    id: "REC-BG001-2026",
    projectId: "BG-001",
    projectName: "Sundarbans Mangrove Revival",
    location: "West Bengal, India",
    coordinates: [21.9497, 89.1833],
    carbonEstimate: "18,450 tCO₂e",
    hectares: "125 ha",
    verificationHash: "0x7f9a8b3c4129e92d718a",
    blockNumber: 18432910,
    ipfsCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    approvedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    verifier: "BlueGuard Admin (Lead MRV Auditor)",
    evidenceCount: 4,
    smartContract: "0x4e8b39c01827364819d8374a56b7c8d9e0f1a2b3",
  },
  {
    id: "REC-BG003-2026",
    projectId: "BG-003",
    projectName: "Palk Bay Seagrass Recovery",
    location: "Tamil Nadu, India",
    coordinates: [9.2800, 79.2500],
    carbonEstimate: "12,100 tCO₂e",
    hectares: "94 ha",
    verificationHash: "0x3b8f192847a6c029d41e",
    blockNumber: 18432952,
    ipfsCid: "QmZtmD2qt8fJv3t9N5d6u7x8y9z0a1b2c3d4e5f6g7h8i",
    approvedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    verifier: "BlueGuard Admin (Lead MRV Auditor)",
    evidenceCount: 3,
    smartContract: "0x4e8b39c01827364819d8374a56b7c8d9e0f1a2b3",
  },
];

// ------------------------------------------------------------
// AUDIT LOGS: SAVE & FETCH WITH FIREBASE SYNC
// ------------------------------------------------------------

export async function saveAuditLogToFirebase(auditEntry) {
  // 1. Local Storage immediate persistence
  try {
    const existing = JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]");
    const updated = [auditEntry, ...existing.filter((a) => a.id !== auditEntry.id)];
    localStorage.setItem(AUDIT_KEY, JSON.stringify(updated));
  } catch (e) {}

  // 2. Firebase Firestore Cloud Save
  try {
    const docRef = doc(db, "audit_logs", auditEntry.id);
    await setDoc(docRef, {
      ...auditEntry,
      createdInCloudAt: serverTimestamp(),
    });
    console.log("Audit log saved to Firebase Firestore:", auditEntry.id);
  } catch (fbErr) {
    console.warn("Firebase Firestore audit save notice (persisted locally):", fbErr.message);
  }
}

export async function fetchAuditLogsFromFirebase() {
  let list = [];

  // Try Firestore fetch
  try {
    const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      snapshot.forEach((d) => list.push(d.data()));
    }
  } catch (fbErr) {
    console.warn("Firestore audit fetch notice (using local/seed cache):", fbErr.message);
  }

  // Combine with Local Storage and Seed Logs
  const local = JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]");
  const combinedMap = new Map();

  [...list, ...local, ...SEED_AUDIT_LOGS].forEach((item) => {
    if (item && item.id) {
      combinedMap.set(item.id, item);
    }
  });

  const finalLogs = [...combinedMap.values()].sort(
    (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
  );

  localStorage.setItem(AUDIT_KEY, JSON.stringify(finalLogs));
  return finalLogs;
}

// ------------------------------------------------------------
// BLOCKCHAIN CERTIFICATES: SAVE & FETCH WITH FIREBASE SYNC
// ------------------------------------------------------------

export async function saveBlockchainCertificateToFirebase(cert) {
  // 1. Local Storage immediate persistence
  try {
    const existing = JSON.parse(localStorage.getItem(VERIFICATION_KEY) || "[]");
    const updated = [cert, ...existing.filter((c) => c.id !== cert.id)];
    localStorage.setItem(VERIFICATION_KEY, JSON.stringify(updated));
  } catch (e) {}

  // 2. Firebase Firestore Cloud Save
  try {
    const docRef = doc(db, "blockchain_verifications", cert.id);
    await setDoc(docRef, {
      ...cert,
      createdInCloudAt: serverTimestamp(),
    });
    console.log("Blockchain certificate saved to Firebase Firestore:", cert.id);
  } catch (fbErr) {
    console.warn("Firebase Firestore cert save notice (persisted locally):", fbErr.message);
  }
}

export async function fetchBlockchainCertificatesFromFirebase() {
  let list = [];

  // Try Firestore fetch
  try {
    const snapshot = await getDocs(collection(db, "blockchain_verifications"));
    if (!snapshot.empty) {
      snapshot.forEach((d) => list.push(d.data()));
    }
  } catch (fbErr) {
    console.warn("Firestore certificates fetch notice (using local/seed cache):", fbErr.message);
  }

  // Combine with Local Storage and Seed Certificates
  const local = JSON.parse(localStorage.getItem(VERIFICATION_KEY) || "[]");
  const combinedMap = new Map();

  [...list, ...local, ...SEED_CERTIFICATES].forEach((item) => {
    if (item && item.id) {
      combinedMap.set(item.id, item);
    }
  });

  const finalCerts = [...combinedMap.values()].sort(
    (a, b) => new Date(b.approvedAt || 0) - new Date(a.approvedAt || 0)
  );

  localStorage.setItem(VERIFICATION_KEY, JSON.stringify(finalCerts));
  return finalCerts;
}
