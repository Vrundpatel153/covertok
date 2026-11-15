from PIL import Image
import os

files = [
    'assets/products/9871354528042/10_49997038813482.webp',
    'assets/products/9871354528042/2_49997038715178.webp',
    'assets/products/9871354528042/6_49905294999850.webp',
    'assets/products/9871354528042/1_49905292443946.webp'
]

for f in files:
    if os.path.exists(f):
        im = Image.open(f)
        print(f, im.size)
