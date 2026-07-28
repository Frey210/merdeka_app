from pathlib import Path


def carousel_photo_path(storage_path: str | Path) -> Path:
    source = Path(storage_path)
    return source.with_name(f"{source.stem}.carousel.jpg")


def carousel_or_original_path(storage_path: str | Path) -> Path:
    variant = carousel_photo_path(storage_path)
    return variant if variant.is_file() else Path(storage_path)


def photo_file_paths(storage_path: str | Path) -> tuple[Path, Path]:
    source = Path(storage_path)
    return source, carousel_photo_path(source)
