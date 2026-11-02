from pathlib import Path

from PIL import Image, ImageChops


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source_frames"
OUTPUT = ROOT / "public" / "frames"
KEYFRAMES = [
    (1, 0.56),
    (30, 0.56),
    (60, 0.60),
    (100, 0.64),
    (150, 0.64),
    (172, 0.55),
    (174, 0.46),
    (240, 0.52),
]


def focal_position(frame_number):
    for (start, start_x), (end, end_x) in zip(KEYFRAMES, KEYFRAMES[1:]):
        if start <= frame_number <= end:
            if end - start <= 2:
                return end_x if frame_number >= end else start_x
            progress = (frame_number - start) / (end - start)
            progress = progress * progress * (3 - 2 * progress)
            return start_x + (end_x - start_x) * progress
    return KEYFRAMES[-1][1]


def find_unique_frames():
    files = sorted(SOURCE.glob("frame_*.jpg"))
    if not files:
        raise FileNotFoundError(f"No source JPEG frames found in {SOURCE}")

    unique = []
    previous = None
    for frame_number, path in enumerate(files, 1):
        with Image.open(path) as image:
            thumbnail = image.resize((96, 54)).convert("L")
            duplicate = previous is not None and ImageChops.difference(
                thumbnail, previous
            ).getbbox() is None
            previous = thumbnail
        if not duplicate:
            unique.append((frame_number, path))

    if len(unique) != 192:
        raise RuntimeError(f"Expected 192 unique frames, found {len(unique)}")
    return unique


def bake():
    frames = find_unique_frames()
    destinations = {
        "m": OUTPUT / "m",
        "t": OUTPUT / "t",
        "d": OUTPUT / "d",
    }

    for directory in destinations.values():
        directory.mkdir(parents=True, exist_ok=True)
        for old_frame in directory.glob("frame_*.webp"):
            old_frame.unlink()

    for output_number, (source_number, path) in enumerate(frames, 1):
        name = f"frame_{output_number:04d}.webp"
        with Image.open(path) as original:
            image = original.convert("RGB")
            width, height = image.size
            crop_width = int(height * 9 / 16)
            left = int(
                max(
                    0,
                    min(
                        width - crop_width,
                        width * focal_position(source_number) - crop_width / 2,
                    ),
                )
            )

            (
                image.crop((left, 0, left + crop_width, height))
                .resize((720, 1280), Image.Resampling.LANCZOS)
                .save(destinations["m"] / name, "WEBP", quality=50, method=4)
            )
            (
                image.resize((1280, 720), Image.Resampling.LANCZOS)
                .save(destinations["t"] / name, "WEBP", quality=60, method=4)
            )
            image.save(destinations["d"] / name, "WEBP", quality=60, method=4)

    print(len(frames))


if __name__ == "__main__":
    bake()
