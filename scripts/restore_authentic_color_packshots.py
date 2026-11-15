import os
import json
import hashlib
from PIL import Image

def restore_color_packshots():
    with open('assets/products_data.json', encoding='utf-8') as f:
        products = json.load(f)

    restored_count = 0

    for p in products:
        handle = p['handle']
        prod_dir = os.path.join('assets', 'products', handle)
        if not os.path.exists(prod_dir):
            continue

        for color in p.get('colors', []):
            c_name = color.get('name')
            c_img = color.get('image', '')
            if not c_img:
                continue

            # Determine color folder
            c_dir = os.path.dirname(c_img)
            png_path = os.path.join(c_dir, '01_packshot.png')
            webp_path = os.path.join(c_dir, '01_packshot.webp')

            if os.path.exists(png_path):
                # Check if png is different from webp
                png_h = hashlib.md5(open(png_path, 'rb').read()).hexdigest()
                webp_h = hashlib.md5(open(webp_path, 'rb').read()).hexdigest() if os.path.exists(webp_path) else ''

                # Also check if other colors in same product share this webp
                other_webp_hashes = []
                for other_c in p.get('colors', []):
                    if other_c.get('name') != c_name and other_c.get('image') and os.path.exists(other_c.get('image')):
                        other_webp_hashes.append(hashlib.md5(open(other_c.get('image'), 'rb').read()).hexdigest())

                # If current webp is shared with another color or missing, restore from png
                if webp_h in other_webp_hashes or not os.path.exists(webp_path):
                    im = Image.open(png_path).convert('RGB')
                    if im.size != (1024, 1024):
                        im = im.resize((1024, 1024), Image.Resampling.LANCZOS)
                    im.save(webp_path, 'WEBP', quality=95)
                    restored_count += 1
                    print(f"Restored {handle} -> {c_name} from {png_path}")

    print(f"\nTotal restored color packshots from authentic PNGs: {restored_count}")

if __name__ == '__main__':
    restore_color_packshots()

