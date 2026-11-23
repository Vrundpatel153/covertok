import os, json
from PIL import Image
import numpy as np

with open('assets/products_data.js', encoding='utf-8') as f:
    text = f.read()

idx = text.find('[')
last_idx = text.rfind(']')
products = json.loads(text[idx:last_idx+1])
phone_cases = [p for p in products if p.get('category') == 'iphone-cases']

audit_report = []

for i, p in enumerate(phone_cases, 1):
    handle = p.get('handle')
    title = p.get('title')
    primary = p.get('primary_image')
    colors = p.get('colors', [])
    
    im = Image.open(primary).convert('RGB')
    w, h = im.size
    
    # 1. Camera Cutout Region
    cam = im.crop((int(w*0.28), int(h*0.14), int(w*0.48), int(h*0.34)))
    cam_arr = np.array(cam)
    cam_white_pct = float(np.sum((cam_arr[:,:,0]>240) & (cam_arr[:,:,1]>240) & (cam_arr[:,:,2]>240)) / (cam.size[0]*cam.size[1]) * 100)
    cam_dark_pct = float(np.sum((cam_arr[:,:,0]<50) & (cam_arr[:,:,1]<50) & (cam_arr[:,:,2]<50)) / (cam.size[0]*cam.size[1]) * 100)
    
    # 2. Case Center Region
    center = im.crop((int(w*0.35), int(h*0.38), int(w*0.65), int(h*0.68)))
    cen_arr = np.array(center)
    center_white_pct = float(np.sum((cen_arr[:,:,0]>240) & (cen_arr[:,:,1]>240) & (cen_arr[:,:,2]>240)) / (center.size[0]*center.size[1]) * 100)
    center_mean = cen_arr.mean(axis=(0,1)).tolist()
    
    # Is it empty shell?
    # Criteria:
    # If camera cutout has > 40% white and dark lens < 5%, OR center is transparent white > 40%
    is_empty = False
    reasons = []
    if cam_white_pct > 35 and cam_dark_pct < 5:
        is_empty = True
        reasons.append(f'Camera cutout is empty white hole ({cam_white_pct:.1f}%)')
    if center_white_pct > 35:
        is_empty = True
        reasons.append(f'Center back is see-through white ({center_white_pct:.1f}%)')
        
    audit_report.append({
        'index': i,
        'handle': handle,
        'title': title,
        'primary': primary,
        'cam_white_pct': round(cam_white_pct, 1),
        'cam_dark_pct': round(cam_dark_pct, 1),
        'center_white_pct': round(center_white_pct, 1),
        'is_empty': is_empty,
        'reasons': reasons,
        'colors_count': len(colors)
    })

print(f"{'#':<3} | {'Handle':<45} | {'Empty?':<7} | {'CamWhite':<9} | {'DarkLens':<9} | {'CenterWhite':<11} | Reasons")
print("-" * 110)
for r in audit_report:
    empty_str = "EMPTY" if r['is_empty'] else "OK"
    reasons_str = "; ".join(r['reasons']) if r['reasons'] else "Fitted on phone"
    print(f"{r['index']:<3} | {r['handle'][:45]:<45} | {empty_str:<7} | {r['cam_white_pct']:<9} | {r['cam_dark_pct']:<9} | {r['center_white_pct']:<11} | {reasons_str}")

with open('scripts/28_cases_audit.json', 'w') as f:
    json.dump(audit_report, f, indent=2)
