from fastapi import HTTPException, Request, Depends
from clerk_backend_api import Clerk, AuthenticateRequestOptions
import os
from dotenv import load_dotenv

load_dotenv()

clerk_sdk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))

def get_current_user(request: Request):
    try:
        # First, authenticate the request
        request_state = clerk_sdk.authenticate_request(
            request,
            AuthenticateRequestOptions(
                authorized_parties=[
                    "http://localhost:5173", 
                    "http://localhost:4173",
                    "http://164.90.175.148:4173",
                    "https://164.90.175.148:4173",
                    "http://oylan.me",
                    "http://www.oylan.me",
                    "https://oylan.me",
                    "https://www.oylan.me"
                ],

            )
        )
        if not request_state.is_signed_in:
            raise HTTPException(status_code=401, detail="Invalid token")

        payload = request_state.payload
        user_id = payload.get("sub")

        # Fetch complete user data from Clerk API
        try:
            clerk_user = clerk_sdk.users.get(user_id=user_id)
            
            user_info = {
                "user_id": user_id,
                "email": clerk_user.email_addresses[0].email_address if clerk_user.email_addresses else None,
                "first_name": clerk_user.first_name,
                "last_name": clerk_user.last_name,
            }
            
        except Exception as user_fetch_error:
            print(f"[ERROR] Failed to fetch user data from Clerk: {user_fetch_error}")
            # Fallback to JWT payload only (which will likely have null values for email/names)
            user_info = {
                "user_id": user_id,
                "email": payload.get("email"),
                "first_name": payload.get("first_name"),
                "last_name": payload.get("last_name"),
            }
            
        return user_info
    except HTTPException:
        # Re-raise HTTP exceptions (like 401) without modification
        raise
    except Exception as e:
        print(f"[ERROR] Exception in get_current_user: {e}")
        # For unexpected errors, return a more specific error
        raise HTTPException(status_code=401, detail="Authentication failed")