import argparse
import os
from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps
from sqlalchemy import select

from app.database import SessionLocal
from app.models import ModerationStatus, Photo
from app.services.photo_variants import carousel_photo_path

OUTPUT_SIZE = (1280, 720)


class LegacyFrame(StrEnum):
    red = "red"
    bandara = "bandara"
    ribbon = "ribbon"


@dataclass
class MigrationResult:
    migrated: int = 0
    skipped_existing: int = 0
    skipped_non_legacy: int = 0
    skipped_missing: int = 0


def _is_brand_red(pixel: tuple[int, ...]) -> bool:
    red, green, blue = pixel[:3]
    return red > 220 and green < 50 and blue < 60


def detect_legacy_frame(image: Image.Image) -> LegacyFrame | None:
    if image.size != OUTPUT_SIZE:
        return None
    rgb = image.convert("RGB")
    if _is_brand_red(rgb.getpixel((5, 300))) and _is_brand_red(rgb.getpixel((640, 710))):
        return LegacyFrame.red
    if _is_brand_red(rgb.getpixel((640, 610))):
        return LegacyFrame.bandara
    if _is_brand_red(rgb.getpixel((5, 5))) and _is_brand_red(rgb.getpixel((1274, 714))):
        return LegacyFrame.ribbon
    return None


def extract_camera_layer(image: Image.Image, frame: LegacyFrame) -> Image.Image:
    crop = (0, 0, 1074, 604) if frame is LegacyFrame.bandara else (0, 0, 1080, 608)
    if frame is LegacyFrame.ribbon:
        cleaned = image.convert("RGB").copy()
        patch = image.crop((330, 0, 660, 240)).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        mask = Image.new("L", (330, 240), 0)
        ImageDraw.Draw(mask).polygon(((0, 0), (330, 0), (0, 240)), fill=255)
        cleaned.paste(patch, (0, 0), mask)
        image = cleaned
    return image.crop(crop).resize(OUTPUT_SIZE, Image.Resampling.LANCZOS)


def render_carousel_variant(
    source_path: Path,
    twibbon: Image.Image,
    destination: Path,
) -> bool:
    with Image.open(source_path) as source:
        frame = detect_legacy_frame(source)
        if frame is None:
            return False
        camera = extract_camera_layer(source.convert("RGB"), frame).convert("RGBA")

    overlay = ImageOps.fit(twibbon.convert("RGBA"), OUTPUT_SIZE, Image.Resampling.LANCZOS)
    result = Image.alpha_composite(camera, overlay).convert("RGB")
    temporary = destination.with_name(f".{destination.name}.tmp")
    result.save(temporary, format="JPEG", quality=88, optimize=True, progressive=True)
    os.replace(temporary, destination)
    return True


def migrate_legacy_carousel(twibbon_path: Path) -> MigrationResult:
    result = MigrationResult()
    with Image.open(twibbon_path) as loaded_twibbon:
        twibbon = loaded_twibbon.convert("RGBA")
        with SessionLocal() as db:
            statement = (
                select(Photo)
                .where(
                    Photo.status == ModerationStatus.approved,
                    Photo.public_consent.is_(True),
                    Photo.expires_at > datetime.now(UTC),
                )
                .order_by(Photo.created_at.asc())
            )
            for photo in db.scalars(statement):
                source = Path(photo.storage_path)
                destination = carousel_photo_path(source)
                if destination.is_file():
                    result.skipped_existing += 1
                elif not source.is_file():
                    result.skipped_missing += 1
                elif render_carousel_variant(source, twibbon, destination):
                    result.migrated += 1
                else:
                    result.skipped_non_legacy += 1
    return result


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create non-destructive carousel variants for legacy photobooth images."
    )
    parser.add_argument("--twibbon", required=True, type=Path)
    args = parser.parse_args()
    result = migrate_legacy_carousel(args.twibbon)
    print(
        f"migrated={result.migrated} skipped_existing={result.skipped_existing} "
        f"skipped_non_legacy={result.skipped_non_legacy} "
        f"skipped_missing={result.skipped_missing}"
    )


if __name__ == "__main__":
    main()
