import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_author
from app.api.v1.learn.wiki import _article_to_detail, _article_to_list_item, _get_article_or_404
from app.db import get_db
from app.models.user import User
from app.models.wiki_article import WikiArticle
from app.schemas.wiki import CreateWikiArticleRequest, UpdateWikiArticleRequest, WikiArticleDetail, WikiArticleListItem
from app.services.authoring import validate_tags, validate_upload, wiki_slugify, write_wiki_content_file

router = APIRouter(prefix="/author/wiki", tags=["author-wiki"])


def _next_article_order(db: Session) -> int:
    last = db.query(WikiArticle).order_by(WikiArticle.sort_order.desc()).first()
    return (last.sort_order + 1) if last else 1


@router.get("/articles", response_model=list[WikiArticleListItem])
def list_author_wiki_articles(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    articles = db.query(WikiArticle).order_by(WikiArticle.sort_order, WikiArticle.id).all()
    return [_article_to_list_item(article) for article in articles]


@router.get("/articles/{article_id}", response_model=WikiArticleDetail)
def get_author_wiki_article(
    article_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    return _article_to_detail(_get_article_or_404(db, article_id))


@router.post("/articles", response_model=WikiArticleDetail, status_code=201)
def create_wiki_article(
    body: CreateWikiArticleRequest,
    db: Annotated[Session, Depends(get_db)],
    author: Annotated[User, Depends(get_current_author)],
):
    article_id = body.id or wiki_slugify(body.title)
    if db.get(WikiArticle, article_id):
        article_id = wiki_slugify(f"{body.title}-{article_id[-4:]}")

    article = WikiArticle(
        id=article_id,
        sort_order=body.sort_order if body.sort_order is not None else _next_article_order(db),
        title=body.title,
        summary=body.summary,
        body_html=body.body_html,
        tags=validate_tags(body.tags),
        author_id=author.id,
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return _article_to_detail(article)


@router.put("/articles/{article_id}", response_model=WikiArticleDetail)
def update_wiki_article(
    article_id: str,
    body: UpdateWikiArticleRequest,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    article = _get_article_or_404(db, article_id)
    if body.title is not None:
        article.title = body.title
    if body.summary is not None:
        article.summary = body.summary
    if body.body_html is not None:
        article.body_html = body.body_html
    if body.tags is not None:
        article.tags = validate_tags(body.tags)
    if body.sort_order is not None:
        article.sort_order = body.sort_order
    db.commit()
    db.refresh(article)
    return _article_to_detail(article)


@router.post("/upload")
async def upload_wiki_image(
    _: Annotated[User, Depends(get_current_author)],
    file: UploadFile = File(...),
):
    data = await file.read()
    validate_upload(file.content_type, len(data))

    ext_map = {"image/png": "png", "image/webp": "webp", "image/svg+xml": "svg"}
    ext = ext_map.get(file.content_type or "", "bin")
    filename = f"{uuid.uuid4().hex[:12]}.{ext}"
    image_path = write_wiki_content_file(filename, data)
    return {"image_path": image_path}


@router.delete("/articles/{article_id}", status_code=204)
def delete_wiki_article(
    article_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    article = _get_article_or_404(db, article_id)
    db.delete(article)
    db.commit()
    return None
