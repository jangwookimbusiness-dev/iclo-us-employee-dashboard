from pathlib import Path

from PIL import Image


ROOT = Path("/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard")


def rgb_image(path: Path) -> Image.Image:
    image = Image.open(path)
    if image.mode == "RGB":
        return image
    if image.mode == "RGBA":
        base = Image.new("RGB", image.size, "white")
        base.paste(image, mask=image.getchannel("A"))
        return base
    return image.convert("RGB")


def save_deck(slide_dir: Path, count: int, output: Path) -> None:
    pages = [rgb_image(slide_dir / f"slide-{index:02d}.png") for index in range(1, count + 1)]
    pages[0].save(
        output,
        "PDF",
        resolution=192.0,
        save_all=True,
        append_images=pages[1:],
        quality=96,
        optimize=True,
    )


def save_wall(source: Path, output: Path) -> None:
    rgb_image(source).save(output, "PDF", resolution=192.0, quality=96, optimize=True)


save_deck(
    ROOT / "tmp/iclo-world-tour-v1/rendered",
    7,
    ROOT / "output/pdf/ICLO-Snowflake-World-Tour-Option-A-Collaboration-Bilingual-v3.pdf",
)
save_deck(
    ROOT / "tmp/iclo-bprime-v1/rendered",
    6,
    ROOT / "output/pdf/ICLO-Snowflake-World-Tour-BPrime-US-Access-Bilingual-v3.pdf",
)
save_wall(
    ROOT / "output/booth/option-a/ICLO-Snowflake-World-Tour-Option-A-Backwall-850x300mm-Bilingual-v3.png",
    ROOT / "output/booth/option-a/ICLO-Snowflake-World-Tour-Option-A-Backwall-850x300mm-Bilingual-v3.pdf",
)
save_wall(
    ROOT / "output/booth/bprime/ICLO-Snowflake-World-Tour-BPrime-Backwall-850x300mm-Bilingual-v3.png",
    ROOT / "output/booth/bprime/ICLO-Snowflake-World-Tour-BPrime-Backwall-850x300mm-Bilingual-v3.pdf",
)
