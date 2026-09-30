from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import UserDB
from app.models.shop import ShopDB
from app.services.token import decode_access_token


bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        user_id = decode_access_token(credentials.credentials)
    except Exception:
        raise credentials_exception

    user = db.query(UserDB).filter(
        UserDB.user_id == user_id
    ).first()

    if not user:
        raise credentials_exception

    return user


def get_current_shop(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shop = db.query(ShopDB).filter(
        ShopDB.owner_id == current_user.user_id
    ).first()

    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found",
        )

    return shop