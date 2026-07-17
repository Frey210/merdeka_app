"""Build normalized, transparent Dino Merdeka game sprites and atlases.

Run from the repository root with:
    py -3 scripts/prepare_dino_merdeka_assets.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "aset game dino" / "_processed-masters"
OUTPUT = ROOT / "apps" / "web" / "public" / "game-assets" / "dino-merdeka"


@dataclass(frozen=True)
class Strip:
    source: str
    count: int
    destination: str
    prefix: str
    frame_size: tuple[int, int]
    max_subject_size: tuple[int, int]
    atlas: str


STRIPS = (
    Strip(
        source="dino-run-transparent.png",
        count=8,
        destination="dino/run",
        prefix="run",
        frame_size=(320, 256),
        max_subject_size=(292, 226),
        atlas="dino-run.png",
    ),
    Strip(
        source="dino-jump-transparent.png",
        count=6,
        destination="dino/jump",
        prefix="jump",
        frame_size=(320, 256),
        max_subject_size=(292, 226),
        atlas="dino-jump.png",
    ),
    Strip(
        source="dino-states-transparent.png",
        count=4,
        destination="dino/states",
        prefix="state",
        frame_size=(320, 256),
        max_subject_size=(292, 226),
        atlas="dino-states.png",
    ),
    Strip(
        source="plane-fly-transparent.png",
        count=4,
        destination="plane/fly",
        prefix="fly",
        frame_size=(448, 224),
        max_subject_size=(414, 190),
        atlas="plane-fly.png",
    ),
)


def blank_column_gaps(image: Image.Image, minimum: int = 8) -> list[tuple[int, int]]:
    alpha = image.getchannel("A")
    occupied = [alpha.crop((x, 0, x + 1, image.height)).getbbox() is not None for x in range(image.width)]
    gaps: list[tuple[int, int]] = []
    start: int | None = None

    for x, has_pixel in enumerate((*occupied, True)):
        if not has_pixel and start is None:
            start = x
        elif has_pixel and start is not None:
            if x - start >= minimum:
                gaps.append((start, x))
            start = None

    return gaps


def split_bounds(image: Image.Image, count: int) -> list[tuple[int, int]]:
    gaps = blank_column_gaps(image)
    if len(gaps) != count + 1:
        raise ValueError(
            f"Expected {count + 1} separator gaps for {count} frames, found {len(gaps)}: {gaps}"
        )

    bounds: list[tuple[int, int]] = []
    for index in range(count):
        left = gaps[index][1]
        right = gaps[index + 1][0]
        bounds.append((left, right))
    return bounds


def normalize_frame(
    source: Image.Image,
    frame_size: tuple[int, int],
    max_subject_size: tuple[int, int],
) -> Image.Image:
    alpha_bbox = source.getchannel("A").getbbox()
    if alpha_bbox is None:
        raise ValueError("Frame does not contain visible pixels")

    subject = source.crop(alpha_bbox)
    max_width, max_height = max_subject_size
    scale = min(max_width / subject.width, max_height / subject.height)
    target_size = (
        max(1, round(subject.width * scale)),
        max(1, round(subject.height * scale)),
    )
    subject = subject.resize(target_size, Image.Resampling.NEAREST)

    frame = Image.new("RGBA", frame_size, (0, 0, 0, 0))
    x = (frame_size[0] - subject.width) // 2
    y = frame_size[1] - subject.height - 12
    frame.alpha_composite(subject, (x, y))
    return frame


def build_strip(config: Strip) -> list[Path]:
    image = Image.open(SOURCE / config.source).convert("RGBA")
    frames: list[Image.Image] = []
    paths: list[Path] = []
    destination = OUTPUT / config.destination
    destination.mkdir(parents=True, exist_ok=True)

    for index, (left, right) in enumerate(split_bounds(image, config.count), start=1):
        raw_frame = image.crop((left, 0, right, image.height))
        frame = normalize_frame(raw_frame, config.frame_size, config.max_subject_size)
        path = destination / f"{config.prefix}-{index:02d}.png"
        frame.save(path, optimize=True)
        frames.append(frame)
        paths.append(path)

    atlas_width = config.frame_size[0] * len(frames)
    atlas = Image.new("RGBA", (atlas_width, config.frame_size[1]), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        atlas.alpha_composite(frame, (index * config.frame_size[0], 0))

    atlas_dir = OUTPUT / "atlases"
    atlas_dir.mkdir(parents=True, exist_ok=True)
    atlas.save(atlas_dir / config.atlas, optimize=True)
    return paths


def write_manifest() -> None:
    manifest = {
        "version": 1,
        "pixelArt": True,
        "transparent": True,
        "animations": {
            "dinoRun": {
                "atlas": "atlases/dino-run.png",
                "frameWidth": 320,
                "frameHeight": 256,
                "frames": 8,
                "frameRate": 12,
                "repeat": -1,
            },
            "dinoJump": {
                "atlas": "atlases/dino-jump.png",
                "frameWidth": 320,
                "frameHeight": 256,
                "frames": 6,
                "frameRate": 10,
                "repeat": 0,
            },
            "dinoStates": {
                "atlas": "atlases/dino-states.png",
                "frameWidth": 320,
                "frameHeight": 256,
                "frames": 4,
                "names": ["idle", "ready", "apex", "gameOver"],
            },
            "planeFly": {
                "atlas": "atlases/plane-fly.png",
                "frameWidth": 448,
                "frameHeight": 224,
                "frames": 4,
                "frameRate": 8,
                "repeat": -1,
                "nativeDirection": "right",
                "flipXWhenMovingLeft": True,
            },
        },
        "recommendedDisplay": {
            "dino": {"width": 128, "height": 102, "origin": [0.5, 1.0]},
            "plane": {"width": 190, "height": 95, "origin": [0.5, 0.5]},
        },
        "gameplayCollision": {
            "dino": {"width": 70, "height": 76, "offsetX": 29, "offsetY": 26},
            "plane": {"width": 154, "height": 54, "offsetX": 18, "offsetY": 20},
        },
    }
    (OUTPUT / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )


def main() -> None:
    for strip in STRIPS:
        built = build_strip(strip)
        print(f"Built {len(built)} frames from {strip.source}")
    write_manifest()
    print(f"Assets ready at: {OUTPUT}")


if __name__ == "__main__":
    main()
