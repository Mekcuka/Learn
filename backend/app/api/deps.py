from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models.user import User
from app.services.auth import decode_access_token

security = HTTPBearer(auto_error=False)

DEFAULT_DEMO_EMAIL = "student@training.local"
DEFAULT_AUTHOR_EMAIL = "author@training.local"


def get_default_user(db: Session) -> User:
    user = db.query(User).filter(User.email == DEFAULT_DEMO_EMAIL).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "detail": "demo_user_missing",
                "message": "Учебный аккаунт не найден. Запустите seed.",
            },
        )
    return user


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    settings = get_settings()
    if not settings.auth_enabled:
        return get_default_user(db)

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "unauthorized", "message": "Требуется авторизация"},
        )
    user_id = decode_access_token(credentials.credentials)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "unauthorized", "message": "Сессия истекла. Войдите снова."},
        )
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "unauthorized", "message": "Требуется авторизация"},
        )
    return user


def get_default_author(db: Session) -> User:
    user = db.query(User).filter(User.email == DEFAULT_AUTHOR_EMAIL).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "detail": "author_user_missing",
                "message": "Учётная запись методиста не найдена. Запустите seed.",
            },
        )
    if user.role != "author":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "forbidden", "message": "Нужна роль методиста"},
        )
    return user


def get_current_author(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    settings = get_settings()
    if not settings.auth_enabled:
        if settings.authoring_enabled:
            return get_default_author(db)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "detail": "authoring_disabled",
                "message": "Редактирование отключено. Установите AUTHORING_ENABLED=true.",
            },
        )

    user = get_current_user(credentials, db)
    if user.role != "author":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "forbidden", "message": "Нужна роль методиста"},
        )
    return user
