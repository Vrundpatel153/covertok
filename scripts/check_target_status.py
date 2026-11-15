import os, json
from PIL import Image
import numpy as np

def check_file(fp):
    if not fp or not os.path.exists(fp): return 'MISSING: ' + str(fp)
    try:
        im = Image.open(fp).convert('RGB')
        arr = np.array(im)
        w, h = im.size
        R, G, B = arr[:,:,0].astype(int), arr[:,:,1].astype(int), arr[:,:,2].astype(int)
        skin = (R > 95) & (G > 40) & (B > 20) & \
               ((np.maximum(np.maximum(R, G), B) - np.minimum(np.minimum(R, G), B)) > 15) & \
               (np.abs(R - G) > 15) & (R > G) & (R > B) & \
               ((R < 240) | (G < 240) | (B < 240))
        skin_pct = (np.sum(skin) / (w * h)) * 100
        corners = [im.getpixel((5,5)), im.getpixel((w-6,5)), im.getpixel((5,h-6)), im.getpixel((w-6,h-6))]
        white_corners = all(all(c >= 240 for c in s) for s in corners)
        return f"size={im.size}, skin={skin_pct:.2f}%, white={white_corners}"
    except Exception as e:
        return f"ERROR: {e}"

prods = json.load(open('assets/products_data.json', encoding='utf-8'))
target_pids = [
    '9875589628202', # Lip balm cover
    '9889169211690', # Suction grips
    '9888955924778', # Power bank
    '9848506057002', # Leather card slot
    '9982201299242', # Crystal studded luxe case
    '9989730304298', # Transparent magnetic charging case
    '9870559183146', # Crystal butterfly charm
    '9871354528042', # Magnetic loop watch bands
    '9981786390826', # Ultra clear sideless
    '9873114038570', # Pastel heart print
    '9870558036266', # Crystal beaded charm
    '9870550761770'  # Bow pearl charger case set
]

for pid in target_pids:
    p = next((x for x in prods if str(x['id']) == pid), None)
    if not p: continue
    print(f"\n*** [{p['id']}] {p['title']} ***")
    prim = p.get('primary_image')
    print(f"  Primary: {prim} -> {check_file(prim)}")
    for c in p.get('colors', []):
        cimg = c.get('image')
        print(f"  Color [{c.get('name')}]: {cimg} -> {check_file(cimg)}")
