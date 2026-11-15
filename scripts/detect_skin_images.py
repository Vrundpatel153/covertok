import os, glob
from PIL import Image
import numpy as np

def detect_skin_percentage(img_path):
    try:
        im = Image.open(img_path).convert('RGB')
        arr = np.array(im)
        R = arr[:,:,0].astype(int)
        G = arr[:,:,1].astype(int)
        B = arr[:,:,2].astype(int)
        
        # Standard RGB skin tone heuristics:
        # R > 95 and G > 40 and B > 20 and max(R,G,B) - min(R,G,B) > 15 and |R - G| > 15 and R > G and R > B
        skin_mask = (R > 95) & (G > 40) & (B > 20) & \
                    ((np.maximum(np.maximum(R, G), B) - np.minimum(np.minimum(R, G), B)) > 15) & \
                    (np.abs(R - G) > 15) & (R > G) & (R > B)
        
        # Ignore very light/white pixels
        not_white = (R < 240) | (G < 240) | (B < 240)
        skin_mask = skin_mask & not_white
        
        pct = (np.sum(skin_mask) / (arr.shape[0] * arr.shape[1])) * 100.0
        return pct
    except Exception as e:
        return 0.0

folders = [
    'assets/products/9871354528042',
    'assets/products/9982201299242',
    'assets/products/9981786390826',
    'assets/products/9870558036266',
    'assets/products/9870550761770',
    'assets/products/9873114038570',
    'assets/products/9989730304298'
]

for d in folders:
    print(f"\n=== {d} ===")
    for f in sorted(glob.glob(f"{d}/*.webp")):
        skin_pct = detect_skin_percentage(f)
        # also check white corners
        im = Image.open(f).convert('RGB')
        w, h = im.size
        corners = [im.getpixel((0,0)), im.getpixel((w-1,0)), im.getpixel((0,h-1)), im.getpixel((w-1,h-1))]
        is_w = all(all(c >= 240 for c in pxl) for pxl in corners)
        print(f"  {os.path.basename(f)}: skin={skin_pct:.1f}%, white_corners={is_w}, size={im.size}")
