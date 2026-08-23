from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime
import hashlib

from app.database import evidence_collection, verifications_collection

router = APIRouter(prefix="/evidence", tags=["Evidence"])


class FileEvidence(BaseModel):
    name: str
    url: Optional[str] = None
    path: Optional[str] = None
    size: Optional[int] = None
    type: Optional[str] = None


class EvidenceBundleCreate(BaseModel):
    id: str
    projectId: str
    projectName: Optional[str] = "Restoration Site"
    evidenceType: str
    description: Optional[str] = ""
    capturedAt: Optional[str] = None
    gpsCoordinates: Optional[List[float]] = [21.9497, 89.1833]
    files: List[FileEvidence] = []
    uploadedBy: Optional[str] = "Mangrove Organization"
    status: Optional[str] = "Pending Verification"


@router.post("/submit")
def submit_evidence_bundle(bundle: EvidenceBundleCreate):
    # Calculate SHA-256 hash of the evidence bundle for blockchain anchoring
    content_to_hash = f"{bundle.id}-{bundle.projectId}-{bundle.evidenceType}-{len(bundle.files)}"
    evidence_hash = hashlib.sha256(content_to_hash.encode()).hexdigest()

    doc = {
        "evidence_id": bundle.id,
        "project_id": bundle.projectId,
        "project_name": bundle.projectName,
        "evidence_type": bundle.evidenceType,
        "description": bundle.description,
        "captured_at": bundle.capturedAt or datetime.utcnow().isoformat(),
        "gps_coordinates": bundle.gpsCoordinates,
        "files": [f.model_dump() for f in bundle.files],
        "uploaded_by": bundle.uploadedBy,
        "status": bundle.status,
        "evidence_hash": evidence_hash,
        "blockchain_anchored": False,
        "created_at": datetime.utcnow()
    }

    result = evidence_collection.insert_one(doc)

    return {
        "message": "Evidence bundle registered and stored successfully",
        "inserted_id": str(result.inserted_id),
        "evidence_id": bundle.id,
        "evidence_hash": evidence_hash,
        "file_count": len(bundle.files)
    }


@router.get("/list/{project_id}")
def get_project_evidence(project_id: str):
    docs = list(evidence_collection.find({"project_id": project_id}, {"_id": 0}))
    return {
        "project_id": project_id,
        "count": len(docs),
        "evidence": docs
    }
