from app.models.lesson import LessonSlide
from app.schemas.lessons import HotspotItem, LessonSlideResponse


def hotspots_from_json(data: dict) -> list[HotspotItem]:
    items = data.get("hotspots", []) if data else []
    return [HotspotItem(**item) for item in items]


def slide_to_response(slide: LessonSlide) -> LessonSlideResponse:
    return LessonSlideResponse(
        id=slide.id,
        order=slide.sort_order,
        title=slide.title,
        caption_html=slide.caption_html,
        expected_result_html=slide.expected_result_html,
        image_path=slide.image_path,
        hotspots=hotspots_from_json(slide.hotspots or {}),
    )


def slide_snapshot_to_response(slide_data: dict) -> LessonSlideResponse:
    hotspots_raw = slide_data.get("hotspots", [])
    if isinstance(hotspots_raw, dict):
        hotspots_raw = hotspots_raw.get("hotspots", [])
    return LessonSlideResponse(
        id=slide_data["id"],
        order=slide_data["sort_order"],
        title=slide_data["title"],
        caption_html=slide_data.get("caption_html", ""),
        expected_result_html=slide_data.get("expected_result_html", ""),
        image_path=slide_data.get("image_path", "/content/placeholder-slide.svg"),
        hotspots=hotspots_from_json({"hotspots": hotspots_raw}),
    )
