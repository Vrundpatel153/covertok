import json
import os
from PIL import Image
import numpy as np

with open('assets/products_data.json', encoding='utf-8') as f:
    products = json.load(f)

print(f"Total products to audit: {len(products)}")

def analyze_img(path):
    if not os.path.exists(path):
        return {'exists': False, 'error': 'FILE_NOT_FOUND'}
    try:
        im = Image.open(path).convert('RGB')
        w, h = im.size
        ratio = round(w / h, 3)
        is_1_to_1 = (0.98 <= ratio <= 1.02)
        
        # Corners
        corners = [im.getpixel((5, 5)), im.getpixel((w - 6, 5)), im.getpixel((5, h - 6)), im.getpixel((w - 6, h - 6))]
        white_corners = all(all(c >= 240 for c in corner) for corner in corners)
        
        # Skin detection
        small = im.resize((100, 100))
        arr = np.array(small, dtype=np.int32)
        r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
        skin_mask = (r > 95) & (g > 40) & (b > 20) & \
                    ((np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)) > 15) & \
                    (np.abs(r - g) > 15) & (r > g) & (r > b)
        not_bg = ~((r > 235) & (g > 235) & (b > 235))
        skin_pct = round(float(np.sum(skin_mask & not_bg)) / 10000.0 * 100, 2)
        
        return {
            'exists': True,
            'size': (w, h),
            'ratio': ratio,
            'is_1_to_1': is_1_to_1,
            'corners': corners,
            'white_corners': white_corners,
            'skin_pct': skin_pct
        }
    except Exception as e:
        return {'exists': True, 'error': str(e)}

audit_report = []

for idx, p in enumerate(products):
    item_report = {
        'index': idx + 1,
        'handle': p['handle'],
        'title': p['title'],
        'primary_image': p.get('primary_image'),
        'primary_analysis': None,
        'colors': [],
        'flags': []
    }
    
    if not p.get('primary_image'):
        item_report['flags'].append('NO_PRIMARY_IMAGE')
    else:
        ana = analyze_img(p['primary_image'])
        item_report['primary_analysis'] = ana
        if not ana.get('exists'):
            item_report['flags'].append('PRIMARY_NOT_FOUND')
        elif not ana.get('is_1_to_1'):
            item_report['flags'].append(f"PRIMARY_NOT_1_TO_1 ({ana.get('size')})")
        elif not ana.get('white_corners'):
            item_report['flags'].append(f"PRIMARY_NON_WHITE_CORNERS ({ana.get('corners')})")
            
    for c in p.get('colors', []):
        cname = c.get('name')
        cimg = c.get('image')
        cana = analyze_img(cimg) if cimg else None
        c_flag = []
        if not cimg:
            c_flag.append('NO_IMAGE')
        elif not cana.get('exists'):
            c_flag.append('NOT_FOUND')
        elif not cana.get('is_1_to_1'):
            c_flag.append(f"NOT_1_TO_1 ({cana.get('size')})")
        elif not cana.get('white_corners'):
            c_flag.append(f"NON_WHITE_CORNERS ({cana.get('corners')})")
            
        item_report['colors'].append({
            'name': cname,
            'image': cimg,
            'analysis': cana,
            'flags': c_flag
        })
        if c_flag:
            item_report['flags'].append(f"COLOR_{cname}_{','.join(c_flag)}")
            
    audit_report.append(item_report)

flagged_items = [r for r in audit_report if r['flags']]
print(f"Audit completed. Flagged products with technical issues: {len(flagged_items)}")

for f in flagged_items:
    print(f"Product #{f['index']} ({f['handle']}): {', '.join(f['flags'])}")

with open('full_75_products_audit.json', 'w', encoding='utf-8') as f:
    json.dump(audit_report, f, indent=2)
print("Saved to full_75_products_audit.json")
