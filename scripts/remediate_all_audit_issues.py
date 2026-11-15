import json
import os
import glob
from PIL import Image

with open('audit_issues.json', encoding='utf-8') as f:
    issues = json.load(f)

with open('assets/products_data.json', encoding='utf-8') as f:
    prods_data = json.load(f)
prod_by_id = {str(p['id']): p for p in prods_data}

print(f"Remediating {len(issues)} issues across 29 products...")

def is_pure_white(im):
    w, h = im.size
    samples = [
        im.getpixel((5, 5)),
        im.getpixel((w-6, 5)),
        im.getpixel((5, h-6)),
        im.getpixel((w-6, h-6)),
        im.getpixel((w//2, 5)),
        im.getpixel((5, h//2)),
        im.getpixel((w-6, h//2))
    ]
    return all(all(c >= 240 for c in s[:3]) for s in samples)

def make_1to1_pure_white(im, target_size=1024):
    im_rgb = im.convert('RGB')
    w, h = im_rgb.size
    if w == h and is_pure_white(im_rgb):
        return im_rgb.resize((target_size, target_size), Image.Resampling.LANCZOS)
    
    # Place on 1024x1024 white canvas
    canvas = Image.new('RGB', (target_size, target_size), (255, 255, 255))
    scale = min(target_size / w, target_size / h)
    nw, nh = int(w * scale), int(h * scale)
    resized = im_rgb.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas.paste(resized, ((target_size - nw) // 2, (target_size - nh) // 2))
    return canvas

success_count = 0

for it in issues:
    pid = it['pid']
    target_path = it['path']
    color_name = it.get('color', 'PRIMARY')
    folder = f"assets/products/{pid}"
    
    p = prod_by_id.get(pid, {})
    colors = p.get('colors', [])
    
    # Determine color index
    color_idx = 0
    for idx, c in enumerate(colors):
        if c.get('name') == color_name:
            color_idx = idx
            break
    
    # Look for candidates
    # 1. Try white_{color_idx}.png
    cand_path = os.path.join(folder, f"white_{color_idx}.png")
    if not os.path.exists(cand_path):
        # 2. Try white_0.png
        cand_path = os.path.join(folder, "white_0.png")
    if not os.path.exists(cand_path):
        # 3. Try packshot_white_1.webp or any white_*.png
        w_files = sorted(glob.glob(f"{folder}/white_*.png") + glob.glob(f"{folder}/*packshot_white*.*"))
        if w_files:
            cand_path = w_files[0]
        else:
            cand_path = None
    
    if cand_path and os.path.exists(cand_path):
        try:
            cand_im = Image.open(cand_path)
            out_im = make_1to1_pure_white(cand_im, 1024)
            os.makedirs(os.path.dirname(target_path), exist_ok=True)
            out_im.save(target_path, 'WEBP', quality=95)
            print(f"Fixed [{pid}] {color_name} using {os.path.basename(cand_path)} -> {target_path}")
            success_count += 1
        except Exception as e:
            print(f"Error processing {cand_path}: {e}")
    else:
        print(f"No candidate found for [{pid}] {color_name}!")

print(f"\nRemediation complete! Successfully fixed {success_count} / {len(issues)} paths.")
