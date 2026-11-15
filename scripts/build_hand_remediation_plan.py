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

remediation_plan = []

for p in prods:
    pid = str(p['id'])
    handle = p['handle']
    title = p['title']
    folder = f"assets/products/{pid}"
    
    # Collect all clean white packshots in folder
    clean_whites = []
    if os.path.exists(folder):
        for fname in sorted(os.listdir(folder)):
            if fname.endswith(('.png', '.webp', '.jpg')):
                fp = os.path.join(folder, fname)
                is_w, skin, sz = check_img(fp)
                if is_w and skin < 3.0:
                    clean_whites.append((fname, fp, skin, sz))
                    
    # Check primary
    prim = p.get('primary_image')
    prim_ok, prim_skin, _ = check_img(prim)
    if not prim_ok or prim_skin >= 3.0:
        remediation_plan.append({
            'pid': pid,
            'title': title,
            'handle': handle,
            'role': 'primary',
            'color': 'PRIMARY',
            'current_path': prim,
            'current_skin': prim_skin,
            'has_clean_replacement': len(clean_whites) > 0,
            'chosen_replacement': clean_whites[0] if clean_whites else None
        })
        
    # Check colors
    for idx, c in enumerate(p.get('colors', [])):
        cimg = c.get('image')
        cname = c.get('name')
        cok, cskin, _ = check_img(cimg)
        if not cok or cskin >= 3.0:
            # Pick a clean white replacement that matches or cycles
            chosen = clean_whites[idx % len(clean_whites)] if clean_whites else None
            remediation_plan.append({
                'pid': pid,
                'title': title,
                'handle': handle,
                'role': 'color',
                'color': cname,
                'current_path': cimg,
                'current_skin': cskin,
                'has_clean_replacement': len(clean_whites) > 0,
                'chosen_replacement': chosen
            })

print(f"Total items needing remediation: {len(remediation_plan)}")
fixable = [r for r in remediation_plan if r['has_clean_replacement']]
unfixable = [r for r in remediation_plan if not r['has_clean_replacement']]
print(f"Items fixable with existing clean packshots: {len(fixable)}")
print(f"Items without existing clean packshots: {len(unfixable)}")

for u in unfixable:
    print(f"  * [{u['pid']}] {u['title']} | {u['role']} ({u['color']}) -> skin={u['current_skin']:.1f}%")

with open('full_hand_remediation_plan.json', 'w', encoding='utf-8') as f:
    json.dump(remediation_plan, f, indent=2)
