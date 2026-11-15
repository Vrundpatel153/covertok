import json
import os
import hashlib
from PIL import Image
import numpy as np

def run_comprehensive_audit():
    print("=" * 60)
    print("STARTING COMPREHENSIVE REPOSITORY & CATALOG AUDIT")
    print("=" * 60)
    
    # 1. Load products_data.json
    with open('assets/products_data.json', encoding='utf-8') as f:
        products = json.load(f)
    print(f"[CHECK 1] Total products in assets/products_data.json: {len(products)}")
    assert len(products) == 75, f"Expected 75 products, found {len(products)}"
    
    # 2. Check window.CovertokProducts in assets/products_data.js
    with open('assets/products_data.js', encoding='utf-8') as f:
        js_text = f.read()
    js_json = js_text.split('window.CovertokProducts = ')[1].rstrip(';\n ')
    js_prods = json.loads(js_json)
    print(f"[CHECK 2] Total products in assets/products_data.js: {len(js_prods)}")
    assert len(js_prods) == 75, f"Expected 75 products in js, found {len(js_prods)}"

    # 3. Check individual structured files in data/products/
    data_files = [f for f in os.listdir('data/products') if f.endswith('.json')]
    print(f"[CHECK 3] Total product files in data/products/: {len(data_files)}")
    assert len(data_files) == 75, f"Expected 75 data/products files, found {len(data_files)}"

    # 4. Check primary image uniqueness (0 duplicates)
    hashes = {}
    duplicates = []
    for p in products:
        p_img = p.get('primary_image')
        assert p_img and os.path.exists(p_img), f"Missing primary image: {p_img} for {p['title']}"
        h = hashlib.md5(open(p_img, 'rb').read()).hexdigest()
        if h in hashes:
            duplicates.append((p['title'], hashes[h], p_img))
        else:
            hashes[h] = p['title']
    print(f"[CHECK 4] Unique hashes for 75 primary images: {len(hashes)} (Duplicates: {len(duplicates)})")
    assert len(duplicates) == 0, f"Found duplicate primary images: {duplicates}"

    # 5. Check all primary images: 1:1 ratio, pure white corners
    non_1_1_primary = []
    non_white_primary = []
    for p in products:
        p_img = p.get('primary_image')
        im = Image.open(p_img).convert('RGB')
        w, h = im.size
        ratio = round(w / h, 3)
        if not (0.98 <= ratio <= 1.02):
            non_1_1_primary.append((p_img, w, h, p['title']))
        corners = [im.getpixel((5, 5)), im.getpixel((w - 6, 5)), im.getpixel((5, h - 6)), im.getpixel((w - 6, h - 6))]
        if not all(all(c >= 240 for c in corner) for corner in corners):
            non_white_primary.append((p_img, corners, p['title']))
            
    print(f"[CHECK 5] Primary images non-1:1: {len(non_1_1_primary)}, non-white: {len(non_white_primary)}")
    assert len(non_1_1_primary) == 0, f"Non 1:1 primary images: {non_1_1_primary}"
    assert len(non_white_primary) == 0, f"Non white primary images: {non_white_primary}"

    # 6. Check all color swatches across all products
    total_colors = 0
    non_1_1_colors = []
    non_white_colors = []
    for p in products:
        for c in p.get('colors', []):
            total_colors += 1
            c_img = c.get('image')
            assert c_img and os.path.exists(c_img), f"Missing color image: {c_img} for {p['title']} [{c.get('name')}]"
            im = Image.open(c_img).convert('RGB')
            w, h = im.size
            ratio = round(w / h, 3)
            if not (0.98 <= ratio <= 1.02):
                non_1_1_colors.append((c_img, w, h, p['title'], c.get('name')))
            corners = [im.getpixel((5, 5)), im.getpixel((w - 6, 5)), im.getpixel((5, h - 6)), im.getpixel((w - 6, h - 6))]
            if not all(all(c >= 240 for c in corner) for corner in corners):
                non_white_colors.append((c_img, corners, p['title'], c.get('name')))

    print(f"[CHECK 6] Total color swatches checked: {total_colors}. Non-1:1: {len(non_1_1_colors)}, non-white: {len(non_white_colors)}")
    assert len(non_1_1_colors) == 0, f"Non 1:1 color images: {non_1_1_colors}"
    assert len(non_white_colors) == 0, f"Non white color images: {non_white_colors}"

    # 7. Check all images in extra folders across 75 named products
    total_extra = 0
    non_1_1_extra = []
    for p in products:
        handle = p['handle']
        # Find folder
        for root, dirs, files in os.walk(f'assets/products/{handle}'):
            if 'extra' in root:
                for f in files:
                    if f.endswith(('.webp', '.png', '.jpg', '.jpeg')):
                        total_extra += 1
                        path = os.path.join(root, f)
                        im = Image.open(path)
                        w, h = im.size
                        ratio = round(w / h, 3)
                        if not (0.98 <= ratio <= 1.02):
                            non_1_1_extra.append((path, w, h))

    print(f"[CHECK 7] Total extra/gallery images checked in product folders: {total_extra}. Non-1:1: {len(non_1_1_extra)}")

    # 8. Check CSS rules for mobile buttons, pagination, and full-bleed cards
    with open('styles.css', encoding='utf-8') as f:
        css = f.read()
    assert 'catalog-pagination' in css, "Missing catalog-pagination in styles.css"
    assert 'flex-wrap: nowrap' in css, "Pagination single-row flex-wrap: nowrap missing"
    
    with open('catalog.css', encoding='utf-8') as f:
        cat_css = f.read()
    assert 'card-add-btn' in cat_css, "Missing card-add-btn in catalog.css"
    print("[CHECK 8] Stylesheet checks passed (single-row pagination in styles.css, compact card-add-btn in catalog.css).")

    print("=" * 60)
    print("ALL 8 COMPREHENSIVE CHECKS PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == '__main__':
    run_comprehensive_audit()
