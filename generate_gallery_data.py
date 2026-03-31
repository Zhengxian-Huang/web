import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DATA_ROOT = ROOT / "web"
OUTPUT = ROOT / "gallery-data.js"


def relpath(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def read_text_if_exists(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8").strip()


def simulation_items():
    items = []
    simulation_root = DATA_ROOT / "simulation"
    for folder in sorted(p for p in simulation_root.iterdir() if p.is_dir()):
        videos = sorted(folder.glob("*.mp4"))
        patches = sorted(folder.glob("*.png"))
        instruction = read_text_if_exists(folder / "instruction.txt")
        items.append(
            {
                "slug": folder.name,
                "title": folder.name.replace("_", " ").title(),
                "instruction": instruction,
                "patches": [relpath(path) for path in patches],
                "videos": [
                    {
                        "label": path.stem,
                        "src": relpath(path),
                    }
                    for path in videos
                ],
            }
        )
    return items


def classify_real_patch(path: Path) -> str:
    name = path.stem.lower()
    if "scissors" in name:
        return "scissors"
    return "knife"


def real_items():
    real_root = DATA_ROOT / "real"
    patch_root = real_root / "patch"
    video_root = real_root / "video"

    patches_by_group = {}
    for patch_path in sorted(patch_root.glob("*.png")):
        group = classify_real_patch(patch_path)
        patches_by_group.setdefault(group, []).append(relpath(patch_path))

    items = []
    for folder in sorted(p for p in video_root.iterdir() if p.is_dir()):
        instruction = read_text_if_exists(folder / "instruction.txt")
        videos = []
        for subfolder in sorted(p for p in folder.iterdir() if p.is_dir()):
            mp4s = sorted(subfolder.glob("*.mp4"))
            if not mp4s:
                continue
            videos.append(
                {
                    "label": subfolder.name.replace("_", " "),
                    "clips": [
                        {
                            "label": clip.stem.replace("_", " "),
                            "src": relpath(clip),
                        }
                        for clip in mp4s
                    ],
                }
            )

        items.append(
            {
                "slug": folder.name,
                "title": folder.name.replace("_", " ").title(),
                "instruction": instruction,
                "patches": patches_by_group.get(folder.name, []),
                "videos": videos,
            }
        )
    return items


def main():
    data = {
        "simulation": simulation_items(),
        "real": real_items(),
    }
    OUTPUT.write_text(
        "window.GALLERY_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
