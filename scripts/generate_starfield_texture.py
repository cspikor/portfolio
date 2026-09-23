#!/usr/bin/env python3
"""Generate tileable 2K and 4K alpha masks for the portfolio starfield."""

from __future__ import annotations

import binascii
import math
from pathlib import Path
import random
import struct
import zlib


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIRECTORY = ROOT / "assets" / "images" / "background"

# These counts and radii reproduce the density and size range of the previous
# nine repeating CSS radial-gradient layers over a 2048px square.
STAR_GROUPS = (
    (51, 1.15, 1.90),
    (23, 0.65, 1.30),
    (15, 1.00, 1.70),
    (10, 0.75, 1.35),
    (7, 1.25, 2.00),
    (32, 0.60, 1.20),
    (12, 0.90, 1.50),
    (17, 0.70, 1.30),
    (6, 1.05, 1.75),
)


def build_star_layout() -> list[tuple[float, float, float, float]]:
    randomizer = random.Random(20260922)
    stars: list[tuple[float, float, float, float]] = []

    for count, inner_radius, outer_radius in STAR_GROUPS:
        for _ in range(count):
            stars.append(
                (
                    randomizer.random(),
                    randomizer.random(),
                    inner_radius,
                    outer_radius,
                )
            )

    return stars


def draw_star(
    alpha: bytearray,
    size: int,
    center_x: float,
    center_y: float,
    inner_radius: float,
    outer_radius: float,
) -> None:
    minimum_x = max(0, math.floor(center_x - outer_radius))
    maximum_x = min(size - 1, math.ceil(center_x + outer_radius))
    minimum_y = max(0, math.floor(center_y - outer_radius))
    maximum_y = min(size - 1, math.ceil(center_y + outer_radius))

    for y in range(minimum_y, maximum_y + 1):
        for x in range(minimum_x, maximum_x + 1):
            distance = math.hypot((x + 0.5) - center_x, (y + 0.5) - center_y)
            if distance > outer_radius:
                continue

            if distance <= inner_radius:
                opacity = 255
            else:
                fade = 1 - ((distance - inner_radius) / (outer_radius - inner_radius))
                opacity = round(255 * fade)

            pixel = y * size + x
            alpha[pixel] = max(alpha[pixel], opacity)


def png_chunk(chunk_type: bytes, payload: bytes) -> bytes:
    checksum = binascii.crc32(chunk_type)
    checksum = binascii.crc32(payload, checksum)
    return (
        struct.pack(">I", len(payload))
        + chunk_type
        + payload
        + struct.pack(">I", checksum & 0xFFFFFFFF)
    )


def write_grayscale_alpha_png(path: Path, size: int, alpha: bytearray) -> None:
    compressor = zlib.compressobj(level=9)
    compressed_rows: list[bytes] = []
    white_row = bytes([255]) * size

    for y in range(size):
        alpha_row = alpha[y * size : (y + 1) * size]
        row = bytearray(1 + size * 2)
        row[0] = 0
        row[1::2] = white_row
        row[2::2] = alpha_row
        compressed_rows.append(compressor.compress(row))

    compressed_rows.append(compressor.flush())
    image_data = b"".join(compressed_rows)
    header = struct.pack(">IIBBBBB", size, size, 8, 4, 0, 0, 0)

    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", header)
        + png_chunk(b"IDAT", image_data)
        + png_chunk(b"IEND", b"")
    )


def generate_texture(size: int, stars: list[tuple[float, float, float, float]]) -> None:
    scale = size / 2048
    alpha = bytearray(size * size)

    for normalized_x, normalized_y, inner_radius, outer_radius in stars:
        center_x = normalized_x * size
        center_y = normalized_y * size

        # Draw wrapped copies when a star overlaps an edge so the texture tiles
        # without clipped dots or visible seams.
        for offset_x in (-size, 0, size):
            for offset_y in (-size, 0, size):
                wrapped_x = center_x + offset_x
                wrapped_y = center_y + offset_y
                scaled_outer_radius = outer_radius * scale
                if (
                    wrapped_x + scaled_outer_radius < 0
                    or wrapped_x - scaled_outer_radius >= size
                    or wrapped_y + scaled_outer_radius < 0
                    or wrapped_y - scaled_outer_radius >= size
                ):
                    continue

                draw_star(
                    alpha,
                    size,
                    wrapped_x,
                    wrapped_y,
                    inner_radius * scale,
                    scaled_outer_radius,
                )

    output_path = OUTPUT_DIRECTORY / f"starfield-{size // 1024}k.png"
    write_grayscale_alpha_png(output_path, size, alpha)
    print(f"Wrote {output_path.relative_to(ROOT)} ({output_path.stat().st_size:,} bytes)")


def main() -> None:
    OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)
    stars = build_star_layout()
    generate_texture(2048, stars)
    generate_texture(4096, stars)


if __name__ == "__main__":
    main()
