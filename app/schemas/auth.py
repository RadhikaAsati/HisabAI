from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=8)
    shop_name: str = Field(min_length=1)


class UserResponse(BaseModel):
    user_id: int
    name: str
    email: EmailStr


class RegisterResponse(BaseModel):
    user: UserResponse
    shop_id: int
    shop_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
    shop_id: int