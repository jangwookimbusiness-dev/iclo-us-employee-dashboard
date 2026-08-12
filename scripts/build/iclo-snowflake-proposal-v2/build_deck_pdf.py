from pathlib import Path
from PIL import Image


root = Path("/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard")
render_dir = root / "tmp/iclo-snowflake-proposal-v2/rendered-lo"
output = root / "output/pdf/ICLO-Snowflake-HLS-Proposal-External-Briefing-v2.pdf"

paths = [render_dir / f"slide-{index}.png" for index in range(1, 14)]
pages = [Image.open(path).convert("RGB") for path in paths]
output.parent.mkdir(parents=True, exist_ok=True)
pages[0].save(output, "PDF", save_all=True, append_images=pages[1:], resolution=150.0)
for page in pages:
    page.close()

print(output)
