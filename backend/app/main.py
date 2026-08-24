from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routes.verification import router as verification_router
from app.routes.auth import router as auth_router
from app.routes.evidence import router as evidence_router
from app.routes.satellite import router as satellite_router
from app.auth import get_current_user


app = FastAPI(title="BlueGuard API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Acquisition-Date", "X-Cloud-Cover", "X-Satellite-Source"],
)



app.include_router(auth_router)
app.include_router(verification_router)
app.include_router(evidence_router)
app.include_router(satellite_router)



@app.get("/")
def root():
    return {
        "message": "BlueGuard API is running",
        "status": "online"
    }


@app.get("/health")
def health(current_user: dict = Depends(get_current_user)):
    return {
        "status": "healthy",
        "user": current_user
    }
