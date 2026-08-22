from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


# ============================================================
# JWT CONFIGURATION
# ============================================================

SECRET_KEY = "blueguard-dev-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

security = HTTPBearer()


# ============================================================
# CREATE ACCESS TOKEN
# ============================================================

def create_access_token(data: dict):
    """
    Creates a JWT access token.

    The payload can belong to either:
    - an organization
    - an admin/verifier
    """

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire
    })

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# ============================================================
# GET CURRENT USER
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Validates the JWT and returns the authenticated user.

    Supported roles:
    - organization
    - admin
    """

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("email")
        role = payload.get("role")

        # ----------------------------------------------------
        # Basic token validation
        # ----------------------------------------------------

        if not email or not role:

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )

        # ----------------------------------------------------
        # ORGANIZATION
        # ----------------------------------------------------

        if role == "organization":

            organization_id = payload.get("organization_id")

            if not organization_id:

                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid organization token"
                )

            return {
                "organization_id": organization_id,
                "email": email,
                "role": "organization"
            }

        # ----------------------------------------------------
        # ADMIN / VERIFIER
        # ----------------------------------------------------

        if role == "admin":

            admin_id = payload.get("admin_id")

            if not admin_id:

                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid admin token"
                )

            return {
                "admin_id": admin_id,
                "email": email,
                "role": "admin"
            }

        # ----------------------------------------------------
        # UNKNOWN ROLE
        # ----------------------------------------------------

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unknown user role"
        )

    except JWTError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )