from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import UserDB
from app.models.shop import ShopDB
from app.schemas.auth import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
    UserResponse,
)
from app.services.password import hash_password, verify_password
from app.services.token import create_access_token
from app.api.dependencies import get_current_user
from app.api.dependencies import get_current_user, get_current_shop

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    # 1. Check whether the email is already registered
    existing_user = (
        db.query(UserDB)
        .filter(UserDB.email == request.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    # 2. Create the user with a securely hashed password
    new_user = UserDB(
        name=request.name.strip(),
        email=request.email,
        password_hash=hash_password(request.password),
    )

    db.add(new_user)

    try:
        db.flush()

        # 3. Create the shop owned by this user
        new_shop = ShopDB(
            name=request.shop_name.strip(),
            owner_id=new_user.user_id,
        )

        db.add(new_shop)

        # 4. Commit user + shop together
        db.commit()

        db.refresh(new_user)
        db.refresh(new_shop)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed",
        )

    return RegisterResponse(
        user={
            "user_id": new_user.user_id,
            "name": new_user.name,
            "email": new_user.email,
        },
        shop_id=new_shop.shop_id,
        shop_name=new_shop.name,
    )
@router.post("/login", response_model=LoginResponse)
def login_user(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.email == request.email).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    shop = db.query(ShopDB).filter(ShopDB.owner_id == user.user_id).first()

    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found",
        )

    access_token = create_access_token(user.user_id)

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
        },
        shop_id=shop.shop_id,
    )
@router.get("/me", response_model=UserResponse)
def get_me(current_user: UserDB = Depends(get_current_user)):
    return current_user

@router.get("/shop")
def get_my_shop(current_shop: ShopDB = Depends(get_current_shop)):
    return {
        "shop_id": current_shop.shop_id,
        "shop_name": current_shop.name,
        "owner_id": current_shop.owner_id,
    }