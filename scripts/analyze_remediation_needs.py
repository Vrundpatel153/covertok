import json
import os
from PIL import Image
import numpy as np

with open('assets/products_data.json', encoding='utf-8') as f:
    prods = json.load(f)

def check_img(fp):
    if not fp or not os.path.exists(fp):
        return False, 999.0, (0, 0)
    try:
        im = Image.open(fp).convert('RGB')
        w, h = im.size
        arr = np.array(im)
        R = arr[:,:,0].astype(int)
        G = arr[:,:,1].astype(int)
        B = arr[:,:,2].astype(int)
        skin = (R > 95) & (G > 40) & (B > 20) & \
               ((np.maximum(np.maximum(R, G), B) - np.minimum(np.minimum(R, G), B)) > 15) & \
               (np.abs(R - G) > 15) & (R > G) & (R > B) & \
               ((R < 240) | (G < 240) | (B < 240))
        skin_pct = (np.sum(skin) / (w * h)) * 100.0
        corners = [
            im.getpixel((5, 5)),
            im.getpixel((w-6, 5)),
            im.getpixel((5, h-6)),
            im.getpixel((w-6, h-6))
        ]
        is_white = all(all(c >= 240 for c in s) for s in corners)
        is_square = abs((w / h) - 1.0) < 0.03
        return is_white and is_square, skin_pct, (w, h)
    except:
        return False, 999.0, (0, 0)

auto_fixable = []
needs_ai_gen = []

for p in prods:
    pid = str(p['id'])
    handle = p['handle']
    title = p['title']
    folder = f"assets/products/{pid}"
    
    # Check folder clean candidates
    clean_in_folder = []
    if os.path.exists(folder):
        for fname in sorted(os.listdir(folder)):
            if fname.endswith(('.png', '.webp', '.jpg')):
                fp = os.path.join(folder, fname)
                is_w, skin, sz = check_img(fp)
                if is_w and skin < 3.0:
                    clean_in_folder.append((fname, skin, sz))
                    
    # Check primary
    prim = p.get('primary_image')
    prim_ok, prim_skin, _ = check_img(prim)
    if not prim_ok or prim_skin >= 3.0:
        if clean_in_folder:
            auto_fixable.append({
                'pid': pid,
                'title': title,
                'type': 'primary',
                'target': prim,
                'available_clean': clean_in_folder[0]
            })
        else:
            needs_ai_gen.append({
                'pid': pid,
                'title': title,
                'type': 'primary',
                'target': prim,
                'current_skin': prim_skin
            })
            
    # Check colors
    for c in p.get('colors', []):
        cimg = c.get('image')
        cname = c.get('name')
        cok, cskin, _ = check_img(cimg)
        if not cok or cskin >= 3.0:
            if clean_in_folder:
                auto_fixable.append({
                    'pid': pid,
                    'title': title,
                    'type': f'color:{cname}',
                    'target': cimg,
                    'available_clean': clean_in_folder[0]
                })
            else:
                needs_ai_gen.append({
                    'pid': pid,
                    'title': title,
                    'type': f'color:{cname}',
                    'target': cimg,
                    'current_skin': cskin
                })

print(f"Total issues auto-fixable with existing clean packshots: {len(auto_fixable)}")
print(f"Total issues with NO clean packshot in folder (needing AI generation): {len(needs_ai_gen)}")
if needs_ai_gen:
    print("\nNeeding AI generation:")
    for ng in needs_ai_gen:
        print(f"  * [{ng['pid']}] {ng['title']} | {ng['type']} -> skin={ng['current_skin']:.1f}% ({ng['target']})")
