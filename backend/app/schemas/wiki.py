from datetime import datetime

from pydantic import BaseModel, Field


class WikiArticleListItem(BaseModel):
    id: str
    order: int
    title: str
    summary: str
    tags: list[str] = []


class WikiArticleDetail(WikiArticleListItem):
    body_html: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class CreateWikiArticleRequest(BaseModel):
    id: str | None = None
    title: str = Field(min_length=1, max_length=255)
    summary: str = ""
    body_html: str = ""
    tags: list[str] = []
    sort_order: int | None = None


class UpdateWikiArticleRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    summary: str | None = None
    body_html: str | None = None
    tags: list[str] | None = None
    sort_order: int | None = None
