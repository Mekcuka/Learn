"""Seed entry point — orchestrates feature seed loaders."""

from sqlalchemy.orm import Session

from app.seed.accounts import seed_training_accounts
from app.seed.modules import seed_all_modules, seed_orientation_module
from app.seed.self_study import seed_self_study
from app.seed.wiki import seed_wiki_articles


def run_seed(db: Session) -> None:
    seed_all_modules(db)
    seed_training_accounts(db)
    seed_self_study(db)
    seed_wiki_articles(db)


__all__ = ["run_seed", "seed_all_modules", "seed_orientation_module", "seed_training_accounts", "seed_self_study", "seed_wiki_articles"]
