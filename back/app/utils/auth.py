from fastapi import HTTPException, Request, Depends
from clerk_backend_api import Clerk, AuthenticateRequestOptions
import os
from dotenv import load_dotenv

load_dotenv()

clerk_sdk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))

def get_current_user(request: Request):
    print("[DEBUG] Entered get_current_user")
    try:
        request_state = clerk_sdk.authenticate_request(
            request,
            AuthenticateRequestOptions(
                authorized_parties=["http://localhost:5173", "http://localhost:4173"],
                jwt_key=os.getenv("JWT_KEY")
            )
        )
        print("[DEBUG] Clerk request_state:", request_state)
        if not request_state.is_signed_in:
            raise HTTPException(status_code=401, detail="Invalid token")

        payload = request_state.payload
        print("[DEBUG] Clerk payload:", payload)

        user_info = {
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "first_name": payload.get("first_name"),
            "last_name": payload.get("last_name"),
        }
        return user_info
    except Exception as e:
        print("[ERROR] Exception in get_current_user:", e)
        raise HTTPException(status_code=500, detail=str(e))