import json, os
from PIL import Image

pids = [
    '9982201299242', '9873108828458', '9870558363946',
    '9870555054378', '9870554038570', '9870500364586',
    '9870449443114', '9869735723306', '9869730382122'
]

prods = json.load(open('assets/products_data.json', encoding='utf-8'))
for pid in pids:
    p = next((x for x in prods if str(x['id']) == pid), None)
    if not p: continue
    print(f"\n*** [{p['id']}] {p['title']} ***")
    print("  Primary:", p.get('primary_image'))
    for c in p.get('colors', []):
        print(f"    Color [{c.get('name')}]:", c.get('image'))
