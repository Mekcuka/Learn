"""Training account seed loader."""

import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.user import User
from app.services.auth import hash_password

def _create_user_from_account(db: Session, account: dict, settings) -> None:
    user = User(
        email=account["learn_email"],
        password_hash=hash_password(account["learn_password"]),
        display_name=account.get("display_name", account["learn_email"]),
        role=account.get("role", "student"),
    )
    db.add(user)
    db.flush()


def _ensure_author_account(db: Session, settings, accounts: list[dict]) -> None:
    author_spec = next((a for a in accounts if a.get("role") == "author"), None)
    if not author_spec:
        return
    author = db.query(User).filter(User.email == author_spec["learn_email"]).first()
    if author:
        if author.role != "author":
            author.role = "author"
            db.commit()
        return
    _create_user_from_account(db, author_spec, settings)
    db.commit()

def seed_training_accounts(db: Session) -> None:
    settings = get_settings()
    seed_path = Path(__file__).resolve().parent.parent.parent / settings.seed_accounts_path
    if not seed_path.exists():
        accounts = [
            {
                "learn_email": "student@training.local",
                "learn_password": "learn123",
                "display_name": "Ученик 1",
                "role": "student",
            },
            {
                "learn_email": "author@training.local",
                "learn_password": "author123",
                "display_name": "Методист",
                "role": "author",
            },
        ]
    else:
        accounts = json.loads(seed_path.read_text(encoding="utf-8"))

    if db.query(User).count() == 0:
        for account in accounts:
            _create_user_from_account(db, account, settings)
        db.commit()
        return

    _ensure_author_account(db, settings, accounts)
