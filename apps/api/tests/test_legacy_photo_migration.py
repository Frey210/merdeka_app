from pathlib import Path

from PIL import Image

from app.scripts.migrate_legacy_carousel import (
    LegacyFrame,
    detect_legacy_frame,
    render_carousel_variant,
)

BRAND_RED = (237, 28, 36)


def test_detects_each_legacy_frame_without_matching_new_photo() -> None:
    red = Image.new("RGB", (1280, 720), "white")
    for x in range(26):
        for y in range(720):
            red.putpixel((x, y), BRAND_RED)
    for x in range(1280):
        for y in range(608, 720):
            red.putpixel((x, y), BRAND_RED)

    bandara = Image.new("RGB", (1280, 720), "white")
    for x in range(1280):
        for y in range(604, 616):
            bandara.putpixel((x, y), BRAND_RED)

    ribbon = Image.new("RGB", (1280, 720), "white")
    ribbon.putpixel((5, 5), BRAND_RED)
    ribbon.putpixel((1274, 714), BRAND_RED)

    assert detect_legacy_frame(red) is LegacyFrame.red
    assert detect_legacy_frame(bandara) is LegacyFrame.bandara
    assert detect_legacy_frame(ribbon) is LegacyFrame.ribbon
    assert detect_legacy_frame(Image.new("RGB", (1280, 720), "white")) is None


def test_renders_variant_without_overwriting_original(tmp_path: Path) -> None:
    source = tmp_path / "photo.jpg"
    destination = tmp_path / "photo.carousel.jpg"
    original = Image.new("RGB", (1280, 720), "white")
    for x in range(26):
        for y in range(720):
            original.putpixel((x, y), BRAND_RED)
    for x in range(1280):
        for y in range(608, 720):
            original.putpixel((x, y), BRAND_RED)
    original.save(source, format="JPEG", quality=100)
    original_bytes = source.read_bytes()
    twibbon = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))

    assert render_carousel_variant(source, twibbon, destination)
    assert destination.is_file()
    assert source.read_bytes() == original_bytes
    with Image.open(destination) as rendered:
        assert rendered.size == (1280, 720)
