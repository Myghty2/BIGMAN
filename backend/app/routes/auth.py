from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import organizations_collection
from passlib.context import CryptContext
from app.auth import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class OrganizationRegister(BaseModel):
    organization_name: str
    email: str
    password: str


class OrganizationLogin(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(data: OrganizationRegister):

    existing = organizations_collection.find_one({
        "email": data.email
    })

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Organization already registered"
        )

    hashed_password = pwd_context.hash(data.password)

    organization = {
        "organization_name": data.organization_name,
        "email": data.email,
        "password": hashed_password,
        "role": "organization"
    }

    result = organizations_collection.insert_one(organization)

    return {
        "message": "Organization registered successfully",
        "organization_id": str(result.inserted_id)
    }


@router.post("/login")
def login(data: OrganizationLogin):

    organization = organizations_collection.find_one({
        "email": data.email
    })

    if not organization:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not pwd_context.verify(
        data.password,
        organization["password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token({
        "organization_id": str(organization["_id"]),
        "email": organization["email"],
        "role": organization["role"]
    })

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "organization_id": str(organization["_id"]),
        "organization_name": organization["organization_name"],
        "email": organization["email"],
        "role": organization["role"]
    }