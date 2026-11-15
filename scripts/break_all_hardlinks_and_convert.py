import os
from PIL import Image

total = 0
for root, dirs, files in os.walk('assets/products'):
    if '01_packshot.png' in files:
        png_p = os.path.join(root, '01_packshot.png')
        webp_p = os.path.join(root, '01_packshot.webp')
        try:
            if os.path.exists(webp_p):
                os.remove(webp_p) # Break hardlink!
            im = Image.open(png_p).convert('RGB')
            if im.size != (1024, 1024):
                im = im.resize((1024, 1024), Image.Resampling.LANCZOS)
            im.save(webp_p, 'WEBP', quality=95)
            total += 1
        except Exception as e:
            print(f"Error on {png_p}: {e}")

print(f"Successfully processed {total} independent webp packshots!")

