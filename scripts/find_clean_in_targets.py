import json
import os
from PIL import Image
import numpy as np

def check_img(fp):
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
        return is_white, skin_pct, (w, h)
    except:
        return False, 999.0, (0, 0)

target_pids = [
    '9888955924778', # Power bank
    '9889169211690', # Suction grips
    '9875589628202', # Lip balm cover
    '9873114038570', # Pastel hearts
    '9854428905770', # MagSafe clear
    '9848506057002', # Leather card slot
    '9853436952874', # Metal camera ring
    '9853944529194', # Snap on wallet
    '10005871362346' # Ribbed knit pouch
]

for pid in target_pids:
    folder = f"assets/products/{pid}"
    print(f"\n================ PID: {pid} ================")
    if not os.path.exists(folder):
        print("  Folder does not exist")
        continue
    files = sorted(os.listdir(folder))
    for f in files:
        if f.endswith(('.png', '.webp', '.jpg')):
            fp = os.path.join(folder, f)
            w, skin, sz = check_img(fp)
            if w and skin < 4.0:
                print(f"  [CLEAN PACKSHOT] {f} -> size={sz}, skin={skin:.2f}%")
            elif w:
                print(f"  [HAND/SKIN IN WHITE] {f} -> size={sz}, skin={skin:.2f}%")
