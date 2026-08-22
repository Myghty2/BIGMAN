from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user

from app.database import verifications_collection

from app.models.verification import VerificationCreate

from datetime import datetime

from app.planet import search_satellite_data

from bson import ObjectId

router = APIRouter(
    prefix="/verification",
    tags=["Verification"]
)


@router.post("/submit")
def submit_verification(
    data: VerificationCreate,
    current_user: dict = Depends(get_current_user)
):
    verification = {
        "project_name": data.project_name,
        "description": data.description,
        "document_hash": data.document_hash,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "organization_id": current_user["organization_id"],
        "status": "pending",
        "blockchain_hash": None,
        "created_at": datetime.utcnow()
    }

    result = verifications_collection.insert_one(verification)

    return {
        "message": "Verification submitted successfully",
        "verification_id": str(result.inserted_id),
        "status": "pending"
    }
@router.get("/satellite/{verification_id}")
def get_satellite_data(
    verification_id: str,
    current_user: dict = Depends(get_current_user)
):
    verification = verifications_collection.find_one({
        "_id": ObjectId(verification_id),
        "organization_id": current_user["organization_id"]
    })

    if not verification:
        raise HTTPException(
            status_code=404,
            detail="Verification not found"
        )

    latitude = verification["latitude"]
    longitude = verification["longitude"]

    response = search_satellite_data(
        latitude,
        longitude
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail="Planet satellite search failed"
        )

    return {
        "verification_id": verification_id,
        "latitude": latitude,
        "longitude": longitude,
        "satellite_data": response.json()
    }