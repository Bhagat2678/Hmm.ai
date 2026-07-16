from fastapi import APIRouter, status
from pydantic import BaseModel
from app.core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str = "demo"
    password: str = "demo"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    message: str = "JWT authentication active for hackathon demo"


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(request: LoginRequest):
    """
    Simple JWT login for hackathon demo.
    Generates access token for any provided username/password.
    """
    token = create_access_token(subject=request.username)
    return TokenResponse(access_token=token)

