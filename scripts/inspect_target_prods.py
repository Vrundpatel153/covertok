import json
import glob
import os

prods = json.load(open('assets/products_data.json', encoding='utf-8'))

search_terms = ['butterfly', 'smartwatch', 'crystal phone charm', 'bow pearl', 'studded', 'sideless', 'pastel heart']

found_prods = []
for p in prods:
    t = p['title'].lower()
    if any(s in t for s in search_terms):
        found_prods.append(p)

print(f"Matched {len(found_prods)} products:")
for p in found_prods:
    print(f"\n[{p['id']}] {p['title']}")
    print(f"  Handle: {p['handle']}")
    print(f"  Primary: {p.get('primary_image')}")
    print(f"  Colors ({len(p.get('colors', []))}):")
    for c in p.get('colors', []):
        print(f"    - {c['name']}: {c.get('image')}")
    
    # Check if there are generated white images in assets/products/{id}/
    id_dir = f"assets/products/{p['id']}"
    if os.path.exists(id_dir):
        whites = glob.glob(f"{id_dir}/*white*") + glob.glob(f"{id_dir}/*packshot*")
        print(f"  Files in {id_dir}: {len(os.listdir(id_dir))} files, whites/packshots: {[os.path.basename(w) for w in whites]}")
