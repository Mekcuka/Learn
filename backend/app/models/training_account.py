import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class TrainingAccount(Base):
    __tablename__ = "training_accounts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), unique=True, nullable=False)
    demo_email: Mapped[str] = mapped_column(String(255), nullable=False)
    demo_password_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    demo_user_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    demo_token_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    demo_token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="training_account")
