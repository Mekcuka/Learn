"""Regenerate orientation lesson placeholder SVGs (valid UTF-8, no control chars)."""
from __future__ import annotations

import xml.sax.saxutils as x
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "public" / "content"


def make_svg(title: str, subtitle: str = "Замените на реальный скриншот через редактор автора") -> str:
    t = x.escape(title)
    s = x.escape(subtitle)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">\n'
        '  <rect width="960" height="540" fill="#1e293b"/>\n'
        '  <rect x="24" y="24" width="912" height="48" rx="6" fill="#334155"/>\n'
        '  <text x="48" y="56" fill="#94a3b8" font-family="Manrope, Segoe UI, sans-serif" font-size="18">'
        "Atlas Grid — учебный placeholder</text>\n"
        f'  <text x="480" y="280" text-anchor="middle" fill="#e2e8f0" '
        f'font-family="Manrope, Segoe UI, sans-serif" font-size="22">{t}</text>\n'
        f'  <text x="480" y="320" text-anchor="middle" fill="#64748b" '
        f'font-family="Manrope, Segoe UI, sans-serif" font-size="14">{s}</text>\n'
        "</svg>\n"
    )


SLIDES: dict[str, str] = {
    "orientation-v1/lesson-01-login/slide-01.svg": "Экран входа",
    "orientation-v1/lesson-01-login/slide-02.svg": "Успешный вход",
    "orientation-v1/lesson-02-create-project/slide-01.svg": "Список проектов",
    "orientation-v1/lesson-02-create-project/slide-02.svg": "Форма проекта",
    "orientation-v1/lesson-02-create-project/slide-03.svg": "Проект создан",
    "orientation-v1/lesson-03-navigation/slide-01.svg": "Боковое меню",
    "orientation-v1/lesson-03-navigation/slide-02.svg": "Карта",
    "orientation-v1/lesson-04-job-journal/slide-01.svg": "Панель журнала",
    "orientation-v1/lesson-04-job-journal/slide-02.svg": "Запись в журнале",
}

LIGHT_PLACEHOLDER = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#f1f5f9"/>
  <rect x="48" y="48" width="864" height="444" rx="12" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
  <text x="480" y="260" text-anchor="middle" fill="#475569" font-family="Manrope, Segoe UI, sans-serif" font-size="24" font-weight="600">Скрин в разработке</text>
  <text x="480" y="300" text-anchor="middle" fill="#94a3b8" font-family="Manrope, Segoe UI, sans-serif" font-size="16">Замените placeholder реальным скриншотом</text>
</svg>
"""


def main() -> None:
    for rel, title in SLIDES.items():
        path = ROOT / rel
        path.write_text(make_svg(title), encoding="utf-8", newline="\n")
        print(f"wrote {rel}")

    (ROOT / "placeholder-slide.svg").write_text(LIGHT_PLACEHOLDER, encoding="utf-8", newline="\n")
    print("wrote placeholder-slide.svg")


if __name__ == "__main__":
    main()
