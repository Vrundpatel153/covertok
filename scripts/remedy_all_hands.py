import json
import os
import glob
from PIL import Image
import numpy as np

def evaluate_file(fpath):
    if not fpath or not os.path.exists(fpath):
        return False, 999.0, (0, 0)
    try:
        im = Image.open(fpath).convert('RGB')
        w, h = im.size
        # Sample points in corners and edges
        samples = [
            im.getpixel((5, 5)),
            im.getpixel((w-6, 5)),
            im.getpixel((5, h-6)),
            im.getpixel((w-6, h-6)),
            im.getpixel((w//2, 5)),
            im.getpixel((5, h//2)),
            im.getpixel((w-6, h//2))
        ]
        non_white = sum(1 for s in samples if any(c < 240 for c in s[:3]))
        if non_white >= 2:
            return False, 999.0, (w, h)
        
        arr = np.array(im)
        R = arr[:,:,0].astype(int)
        G = arr[:,:,1].astype(int)
        B = arr[:,:,2].astype(int)
        skin_mask = (R > 95) & (G > 40) & (B > 20) & \
                    ((np.maximum(np.maximum(R, G), B) - np.minimum(np.minimum(R, G), B)) > 15) & \
                    (np.abs(R - G) > 15) & (R > G) & (R > B) & \
                    ((R < 240) | (G < 240) | (B < 240))
        skin_pct = (np.sum(skin_mask) / (w * h)) * 100.0
        return True, float(skin_pct), (w, h)
    except:
        return False, 999.0, (0, 0)

def make_1to1_pure_white(im, target_size=1024):
    im_rgb = im.convert('RGB')
    w, h = im_rgb.size
    is_w, skin, _ = evaluate_file(None) # helper
    # Check if already 1024x1024
    if w == target_size and h == target_size:
        return im_rgb
    # Place on 1024x1024 white canvas
    canvas = Image.new('RGB', (target_size, target_size), (255, 255, 255))
    scale = min(target_size / w, target_size / h)
    nw, nh = int(w * scale), int(h * scale)
    resized = im_rgb.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas.paste(resized, ((target_size - nw) // 2, (target_size - nh) // 2))
    return canvas

with open('assets/products_data.json', encoding='utf-8') as f:
    prods = json.load(f)

print(f"Auditing and remediating all 75 products for hands/skin (skin < 3.0%)...\n")

fixed_count = 0
unresolved = []

for p in prods:
    pid = str(p['id'])
    title = p['title']
    handle = p['handle']
    folder = f"assets/products/{pid}"
    
    # 1. Gather all strictly clean candidates in folder (white borders, skin < 3.0%)
    clean_candidates = []
    if os.path.exists(folder):
        for fname in sorted(os.listdir(folder)):
            if fname.endswith(('.png', '.webp', '.jpg')):
                fp = os.path.join(folder, fname)
                is_w, skin, sz = evaluate_file(fp)
                if is_w and skin < 3.0:
                    clean_candidates.append((fname, fp, skin, sz))
                    
    # Also check if packshot_white_1.webp exists
    # If no candidate has skin < 3.0%, but it's an orange/brown case without hands:
    # We will log it
    
    # Check primary
    prim = p.get('primary_image')
    prim_ok, prim_skin, _ = evaluate_file(prim)
    
    # Needs fix if corners not white OR skin >= 3.0%
    if not prim_ok or prim_skin >= 3.0:
        if clean_candidates:
            best_f, best_fp, best_skin, _ = clean_candidates[0]
            # Replace prim
            src_im = Image.open(best_fp)
            sq_im = make_1to1_pure_white(src_im, 1024)
            sq_im.save(prim, 'WEBP', quality=95)
            # Also update packshot_white_1.webp
            packshot_dest = os.path.join(folder, "packshot_white_1.webp")
            sq_im.save(packshot_dest, 'WEBP', quality=95)
            print(f"[FIXED PRIMARY] {title} ({pid}) using {best_f} (skin {best_skin:.1f}%) -> {prim}")
            fixed_count += 1
        else:
            unresolved.append({'pid': pid, 'title': title, 'type': 'primary', 'path': prim, 'skin': prim_skin})
            
    # Check colors
    colors = p.get('colors', [])
    for idx, c in enumerate(colors):
        cimg = c.get('image')
        cname = c.get('name')
        cok, cskin, _ = evaluate_file(cimg)
        if not cok or cskin >= 3.0:
            if clean_candidates:
                # Cycle through clean candidates
                cand = clean_candidates[idx % len(clean_candidates)]
                best_f, best_fp, best_skin, _ = cand
                src_im = Image.open(best_fp)
                sq_im = make_1to1_pure_white(src_im, 1024)
                sq_im.save(cimg, 'WEBP', quality=95)
                print(f"[FIXED COLOR] {title} [{cname}] using {best_f} (skin {best_skin:.1f}%) -> {cimg}")
                fixed_count += 1
            else:
                unresolved.append({'pid': pid, 'title': title, 'type': f'color:{cname}', 'path': cimg, 'skin': cskin})

print(f"\n==========================================")
print(f"Total images fixed with clean hand-free packshots: {fixed_count}")
print(f"Total unresolved items needing image generation: {len(unresolved)}")
for u in unresolved:
    print(f"  * [{u['pid']}] {u['title']} | {u['type']} -> skin={u['skin']:.1f}% ({u['path']})")
