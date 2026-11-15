import json
import hashlib
import os

data = json.load(open('assets/products_data.json', encoding='utf-8'))
flagged = []

for p in data:
    colors = p.get('colors', [])
    if len(colors) > 1:
        hashes = {}
        for c in colors:
            img = c.get('image')
            if img and os.path.exists(img):
                h = hashlib.md5(open(img, 'rb').read()).hexdigest()
                hashes.setdefault(h, []).append((c['name'], img))
        duplicated = {h: items for h, items in hashes.items() if len(items) > 1}
        if duplicated:
            flagged.append((p['title'], p['handle'], duplicated))

print(f"Total multi-color products with duplicate color images: {len(flagged)}")
for title, handle, dups in flagged:
    print(f"\nProduct: {title} ({handle})")
    for h, items in dups.items():
        names = [it[0] for it in items]
        print(f"  Shared image across: {names} -> {items[0][1]}")

