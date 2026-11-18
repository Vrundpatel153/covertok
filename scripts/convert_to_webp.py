import sys
from PIL import Image

if len(sys.argv) >= 3:
    src = sys.argv[1]
    dst = sys.argv[2]
    img = Image.open(src)
    img.save(dst, "WEBP", quality=90)
    print(f"Successfully converted {src} to {dst}")
