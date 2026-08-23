from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routes.verification import router as verification_router
from app.routes.auth import router as auth_router
from app.routes.evidence import router as evidence_router
from app.auth import get_current_user


app = FastAPI(title="BlueGuard API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(verification_router)
app.include_router(evidence_router)



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