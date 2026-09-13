"""Export reviewed office plates and refresh their public manifest entries."""

import json
import pathlib
import sys

from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
PUBLIC = ROOT / "apps/web/public/plates"
MANIFEST = PUBLIC / "plates.json"

PUBLIC.mkdir(parents=True, exist_ok=True)
entries = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else []
by_key = {entry["key"]: entry for entry in entries}

for key in sys.argv[1:]:
    image = Image.open(HERE / f"{key}.png").convert("RGB")
    geometry_path = HERE / f"{key}.geometry.json"
    geometry = json.loads(geometry_path.read_text()) if geometry_path.exists() else {}
    exports = []
    for width, suffix in [(1536, ""), (768, "-small")]:
        resized = image.resize((width, round(width * image.height / image.width)), Image.Resampling.LANCZOS)
        target = PUBLIC / f"{key}{suffix}.webp"
        for quality in range(90, 29, -3):
            resized.save(target, "WEBP", quality=quality, method=6)
            if target.stat().st_size <= 400_000:
                break
        if target.stat().st_size > 400_000:
            raise ValueError(f"{key}: WebP exceeds 400,000 bytes")
        exports.append({"path": str(target.relative_to(ROOT)), "width": resized.width, "height": resized.height, "bytes": target.stat().st_size, "quality": quality})
    entry = {"key": key, "src": f"/plates/{key}.webp", "srcSmall": f"/plates/{key}-small.webp", "w": image.width, "h": image.height, "paper": geometry.get("paper")}
    if geometry.get("board"):
        entry["board"] = geometry["board"]
    by_key[key] = entry
    metadata_path = HERE / f"{key}.meta.json"
    metadata = json.loads(metadata_path.read_text()) if metadata_path.exists() else {}
    metadata["exports"] = exports
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n")
    print(json.dumps({"key": key, "exports": exports}))

order = ["K0", "K1", "K2", "K3", "K4-5", "K4-3", "K4-1", "K5", "K6"]
MANIFEST.write_text(json.dumps(sorted(by_key.values(), key=lambda e: order.index(e["key"])), indent=2) + "\n")
