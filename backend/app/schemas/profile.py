from pydantic import BaseModel


class ResetProgressResponse(BaseModel):
    message: str
    modules_reset: int
