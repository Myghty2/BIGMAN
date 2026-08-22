from pydantic import BaseModel
from typing import Optional


class VerificationCreate(BaseModel):
    project_name: str
    description: str
    document_hash: str
    latitude: float
    longitude: float


class VerificationResponse(BaseModel):
    verification_id: str
    project_name: str
    description: str
    document_hash: str
    organization_id: str
    status: str
    blockchain_hash: Optional[str] = None