from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.wiki_article import WikiArticle
from app.schemas.wiki import WikiArticleDetail, WikiArticleListItem

router = APIRouter(prefix="/wiki", tags=["wiki"])


def _article_to_list_item(article: WikiArticle) -> WikiArticleListItem:
    return WikiArticleListItem(
        id=article.id,
        order=article.sort_order,
        title=article.title,
        summary=article.summary,
        tags=list(article.tags or []),
    )


def _article_to_detail(article: WikiArticle) -> WikiArticleDetail:
    return WikiArticleDetail(
        id=article.id,
        order=article.sort_order,
        title=article.title,
        summary=article.summary,
        tags=list(article.tags or []),
        body_html=article.body_html,
        created_at=article.created_at,
        updated_at=article.updated_at,
    )


def _get_article_or_404(db: Session, article_id: str) -> WikiArticle:
    article = db.get(WikiArticle, article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "wiki_article_not_found", "message": "Статья не найдена"},
        )
    return article


@router.get("/articles", response_model=list[WikiArticleListItem])
def list_wiki_articles(db: Annotated[Session, Depends(get_db)]):
    articles = db.query(WikiArticle).order_by(WikiArticle.sort_order, WikiArticle.id).all()
    return [_article_to_list_item(article) for article in articles]


@router.get("/articles/{article_id}", response_model=WikiArticleDetail)
def get_wiki_article(article_id: str, db: Annotated[Session, Depends(get_db)]):
    return _article_to_detail(_get_article_or_404(db, article_id))
