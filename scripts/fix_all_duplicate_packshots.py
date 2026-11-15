from PIL import Image
import numpy as np
import os
import hashlib
import json

def process_packshot(src_path, output_paths, bg_threshold=230):
    im = Image.open(src_path).convert('RGB')
    arr = np.array(im)
    
    # Identify non-background bounding box
    non_bg = np.any(arr < bg_threshold, axis=2)
    rows = np.where(non_bg.any(axis=1))[0]
    cols = np.where(non_bg.any(axis=0))[0]
    
    if len(rows) and len(cols):
        # Crop to subject
        ymin, ymax = rows[0], rows[-1]
        xmin, xmax = cols[0], cols[-1]
        cropped = im.crop((xmin, ymin, xmax + 1, ymax + 1))
    else:
        cropped = im

    # Target 1024x1024 canvas
    canvas_size = 1024
    max_dim = 880 # Leave padding around subject
    
    cw, ch = cropped.size
    scale = min(max_dim / cw, max_dim / ch)
    new_w = int(cw * scale)
    new_h = int(ch * scale)
    
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Create pure solid white canvas
    canvas = Image.new('RGB', (canvas_size, canvas_size), (255, 255, 255))
    offset_x = (canvas_size - new_w) // 2
    offset_y = (canvas_size - new_h) // 2
    
    canvas.paste(resized, (offset_x, offset_y))
    
    for out in output_paths:
        os.makedirs(os.path.dirname(out), exist_ok=True)
        canvas.save(out, 'WEBP', quality=95)
        print(f"Saved: {out} (size={canvas.size})")

# 1. Pair 1 (Tactical Black Watch Case)
process_packshot(
    'pair1_tactical_black.png',
    [
        'assets/products/premium-silicone-watch-bands-available-in-18-colors-copy/tactical-black/01_packshot.webp',
        'assets/products/9873118101802/packshot_white_1.webp'
    ],
    bg_threshold=235
)

# 2. Pair 2 (Black Transparent Watch Case with Bold Orange Strap)
process_packshot(
    'pair2_black_trans_orange.png',
    [
        'assets/products/transparent-rugged-apple-watch-case-with-orange-sports-strap-copy/bold-orange/01_packshot.webp',
        'assets/products/9873124557098/packshot_white_1.webp'
    ],
    bg_threshold=240
)

# 3. Pair 2 (Clear Transparent Watch Case with Bright Orange Strap)
process_packshot(
    'IMG_8015_2.png',
    [
        'assets/products/transparent-rugged-protective-apple-watch-case-with-strap-copy/bright-orange/01_packshot.webp',
        'assets/products/9873120330026/packshot_white_1.webp'
    ],
    bg_threshold=240
)

# 4. Pair 3 (Starlight + Pink Magnetic Loop Band)
process_packshot(
    'pair3_starlight_pink.png',
    [
        'assets/products/magnetic-loop-smartwatch-bands-dual-color-edition-copy-2/starlight-pink/01_packshot.webp',
        'assets/products/9871367274794/packshot_white_1.webp'
    ],
    bg_threshold=240
)

# 5. Pair 3 (Orange + Midnight Black Magnetic Loop Band)
process_packshot(
    'pair3_orange_midnight.png',
    [
        'assets/products/magnetic-loop-smartwatch-bands-dual-color-edition-copy-copy/orange-midnight-black/01_packshot.webp',
        'assets/products/9871361442090/packshot_white_1.webp'
    ],
    bg_threshold=240
)

print("\n--- HASH UNIQUENESS AUDIT ACROSS ALL 75 PRODUCTS ---")
data = json.load(open('assets/products_data.json', encoding='utf-8'))
img_to_prods = {}
for p in data:
    img = p.get('primary_image')
    if img:
        h = hashlib.md5(open(img, 'rb').read()).hexdigest()
        img_to_prods.setdefault(h, []).append((p['id'], p['title'], img))

print(f"Total unique hashes for 75 primary images: {len(img_to_prods)}")
duplicates = {h: prods for h, prods in img_to_prods.items() if len(prods) > 1}
if duplicates:
    print(f"FAIL: {len(duplicates)} duplicate hashes found!")
    for h, prods in duplicates.items():
        print(h, prods)
else:
    print("SUCCESS: ALL 75 PRODUCTS HAVE 100% UNIQUE PRIMARY PACKSHOTS!")
