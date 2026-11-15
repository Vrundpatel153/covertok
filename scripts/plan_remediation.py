import json
import os
import glob
from PIL import Image
import numpy as np

with open('audit_issues.json', encoding='utf-8') as f:
    issues = json.load(f)

with open('white_alternatives_report.json', encoding='utf-8') as f:
    white_rep = json.load(f)

print(f"Planning remediation for {len(issues)} issues across {len(set(x['pid'] for x in issues))} products\n")

def check_img(path):
    if not os.path.exists(path):
        return False, 999.0, (0,0)
    try:
        im = Image.open(path).convert('RGB')
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
        is_w = all(all(c >= 240 for c in s) for s in samples)
        arr = np.array(im)
        R = arr[:,:,0].astype(int)
        G = arr[:,:,1].astype(int)
        B = arr[:,:,2].astype(int)
        skin_mask = (R > 95) & (G > 40) & (B > 20) & \
                    ((np.maximum(np.maximum(R, G), B) - np.minimum(np.minimum(R, G), B)) > 15) & \
                    (np.abs(R - G) > 15) & (R > G) & (R > B) & \
                    ((R < 240) | (G < 240) | (B < 240))
        skin_pct = (np.sum(skin_mask) / (w * h)) * 100.0
        return is_w, skin_pct, (w, h)
    except:
        return False, 999.0, (0,0)

plan = []

for it in issues:
    pid = it['pid']
    clr = it.get('color', 'PRIMARY')
    target_path = it['path']
    folder = f"assets/products/{pid}"
    
    # Check current target image
    curr_w, curr_skin, curr_sz = check_img(target_path)
    
    # Find candidates in folder
    candidates = []
    if os.path.exists(folder):
        for f in sorted(os.listdir(folder)):
            if f.endswith(('.png', '.webp', '.jpg')):
                fp = os.path.join(folder, f)
                is_w, skin, sz = check_img(fp)
                if is_w and skin < 3.0: # clean packshot
                    candidates.append((f, fp, skin, sz))
    
    plan.append({
        'pid': pid,
        'title': it['title'],
        'color': clr,
        'target_path': target_path,
        'curr_white': curr_w,
        'curr_skin': round(curr_skin, 1),
        'candidates_count': len(candidates),
        'top_candidates': [(c[0], round(c[2], 1), c[3]) for c in candidates[:5]]
    })

print(f"Analyzed {len(plan)} targets:")
for p in plan:
    c_str = f"{p['candidates_count']} clean white candidates" if p['candidates_count'] > 0 else "NO clean candidate in folder -> NEEDS REMBG ISOLATION"
    print(f"[{p['pid']}] {p['title']} ({p['color']}): {c_str}")

with open('remediation_plan.json', 'w', encoding='utf-8') as f:
    json.dump(plan, f, indent=2)
