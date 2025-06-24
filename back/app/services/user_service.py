from sqlalchemy.orm import Session
from app.models.user import User

def get_or_create_user(db: Session, user_info: dict):
    user = db.query(User).filter(User.user_id == user_info["user_id"]).first()
    if not user:
        user = User(
            user_id=user_info["user_id"],
            email=user_info.get("email"),
            first_name=user_info.get("first_name"),
            last_name=user_info.get("last_name"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user