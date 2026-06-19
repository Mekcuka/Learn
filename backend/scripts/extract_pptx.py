"""One-off script to extract text from PPTX slides."""
import sys
import zipfile
import xml.etree.ElementTree as ET

NS = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}


def main(path: str) -> None:
    with zipfile.ZipFile(path) as z:
        slides = sorted(
            n for n in z.namelist() if n.startswith("ppt/slides/slide") and n.endswith(".xml")
        )
        for i, s in enumerate(slides, 1):
            root = ET.fromstring(z.read(s))
            texts = [
                t.text
                for t in root.iter("{http://schemas.openxmlformats.org/drawingml/2006/main}t")
                if t.text and t.text.strip()
            ]
            print(f"=== Slide {i} ({s}) ===")
            print("\n".join(texts))
            print()


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\user\Downloads\Тестовое задание итог.pptx")
