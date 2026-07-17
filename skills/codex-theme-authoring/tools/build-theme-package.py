#!/usr/bin/env python3
"""
Build a .codex-theme package from a theme directory.

Expected input:
    theme-dir/
      manifest.json
      theme.json
      assets/

Output:
    <theme-name>.codex-theme
"""

from __future__ import annotations

import argparse
import json
import zipfile
from pathlib import Path


REQUIRED_FILES = ["manifest.json", "theme.json"]


def validate_theme(root: Path) -> None:
    for item in REQUIRED_FILES:
        if not (root / item).exists():
            raise FileNotFoundError(f"missing required file: {item}")

    for item in REQUIRED_FILES:
        with (root / item).open("r", encoding="utf-8") as f:
            json.load(f)



def build_package(root: Path, output: Path) -> None:
    validate_theme(root)

    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        for file in root.rglob("*"):
            if file.is_file():
                archive.write(file, file.relative_to(root))



def main() -> None:
    parser = argparse.ArgumentParser(description="Build Codex Dream Skin theme package")
    parser.add_argument("theme_dir", type=Path)
    parser.add_argument("-o", "--output", type=Path)
    args = parser.parse_args()

    output = args.output or args.theme_dir.with_suffix(".codex-theme")
    build_package(args.theme_dir, output)
    print(f"created: {output}")


if __name__ == "__main__":
    main()
