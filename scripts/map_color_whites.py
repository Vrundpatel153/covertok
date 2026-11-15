import json
import os
import glob
from PIL import Image

with open('audit_issues.json', encoding='utf-8') as f:
    issues = json.load(f)

with open('assets/products_data.json', encoding='utf-8') as f:
    prods_data = json.load(f)
prod_by_id = {str(p['id']): p for p in prods_data}

print(f"Auditing color-to-white mapping for {len(issues)} issues across 29 products:")

for it in issues:
    pid = it['pid']
    title = it['title']
    color = it.get('color', 'PRIMARY')
    target = it['path']
    folder = f"assets/products/{pid}"
    
    # check if white_*.png exist in folder
    whites = sorted(glob.glob(f"{folder}/white_*.png"))
    clean_whites = []
    for w in whites:
        try:
            im = Image.open(w)
            clean_whites.append((os.path.basename(w), im.size))
        except:
            pass
    
    print(f"[{pid}] {title} | {color} -> {target}")
    print(f"    Available whites in {folder}: {len(clean_whites)} files: {[w[0] for w in clean_whites[:5]]}")
