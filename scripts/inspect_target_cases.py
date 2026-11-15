import json, os

prods = json.load(open('assets/products_data.json', encoding='utf-8'))
targets = ['power', 'lip', 'suction', 'grip', 'charger', 'leather']

for p in prods:
    h = p['handle'].lower()
    t = p['title'].lower()
    if any(k in h or k in t for k in targets):
        print(f"=== {p['id']} | {p['title']} ===")
        print(f"  Handle: {p['handle']}")
        print(f"  Primary: {p.get('primary_image')}")
        for c in p.get('colors', []):
            print(f"    Color [{c.get('name')}]: {c.get('image')}")
        folder = f"assets/products/{p['id']}"
        if os.path.exists(folder):
            cands = [f for f in sorted(os.listdir(folder)) if f.startswith('white_') or 'packshot' in f]
            print(f"    Folder white candidates: {cands}")
