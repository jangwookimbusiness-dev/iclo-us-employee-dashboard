from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


source = Path("tmp/iclo-world-tour-v1/ir-render")
images = sorted(source.glob("page-*.jpg"))
thumb_w = 384
thumb_h = 216
label_h = 28
columns = 4
rows = (len(images) + columns - 1) // columns
canvas = Image.new("RGB", (columns * thumb_w, rows * (thumb_h + label_h)), "white")
draw = ImageDraw.Draw(canvas)
font = ImageFont.load_default()

for index, path in enumerate(images):
    image = Image.open(path).convert("RGB")
    image.thumbnail((thumb_w, thumb_h))
    x = (index % columns) * thumb_w + (thumb_w - image.width) // 2
    y = (index // columns) * (thumb_h + label_h)
    canvas.paste(image, (x, y))
    label = path.stem
    draw.text((x + 8, y + thumb_h + 7), label, fill="#1B2A4A", font=font)

canvas.save("tmp/iclo-world-tour-v1/ir-montage.png")
