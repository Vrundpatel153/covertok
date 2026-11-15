import glob
import os
from PIL import Image
import numpy as np

def detect_skin_percentage(img_path):
    try:
        im = Image.open(img_path).convert('RGB')
        arr = np.array(im)
        R = arr[:,:,0].astype(int)
        G = arr[:,:,1].astype(int)
        B = arr[:,:,2].astype(int)
        skin_mask = (R > 95) & (G > 40) & (B > 20) & \
                    ((np.maximum(np.maximum(R, G), B) - np.minimum(np.minimum(R, G), B)) > 15) & \
                    (np.abs(R - G) > 15) & (R > G) & (R > B)
        not_white = (R < 240) | (G < 240) | (B < 240)
        skin_mask = skin_mask & not_white
        pct = (np.sum(skin_mask) / (arr.shape[0] * arr.shape[1])) * 100.0
        return pct
    except Exception as e:
        return 0.0

for f in sorted(glob.glob('assets/products/9989730304298/white_*.png')):
    skin = detect_skin_percentage(f)
    im = Image.open(f)
    print(f, im.size, f"skin={skin:.1f}%")
