import json
import os
import shutil
from PIL import Image

PRODUCTS_JSON = 'assets/products_data.json'
PRODUCTS_JS = 'assets/products_data.js'

def get_whiteness_score(img_path):
    if not os.path.exists(img_path):
        return -999
    try:
        with Image.open(img_path) as im:
            im = im.convert('RGB')
            w, h = im.size
            if w < 50 or h < 50:
                return -999
            
            # Sample boundary perimeter points
            points = [
                (10, 10), (w - 10, 10), (10, h - 10), (w - 10, h - 10),
                (w // 2, 10), (10, h // 2), (w - 10, h // 2), (w // 2, h - 10),
                (w // 4, 10), (3 * w // 4, 10)
            ]
            scores = []
            for px, py in points:
                r, g, b = im.getpixel((px, py))
                brightness = (r + g + b) / 3.0
                chroma = max(r, g, b) - min(r, g, b)
                # Pure white (255, 255, 255) has brightness=255, chroma=0 => score=255
                # Off-white / very light gray has score ~240-250
                # Wood/beige/color has high chroma or low brightness => lower score
                score = brightness - (chroma * 2.5)
                scores.append(score)
            return sum(scores) / len(scores)
    except Exception as e:
        return -999

def run():
    with open(PRODUCTS_JSON, 'r', encoding='utf-8') as f:
        products = json.load(f)

    promoted_count = 0
    updates = []

    for p in products:
        pid = p['id']
        title = p.get('title', '')
        curr_primary = p.get('primary_image', '')
        curr_score = get_whiteness_score(curr_primary)
        
        images = p.get('images', [])
        best_img = curr_primary
        best_score = curr_score
        
        for idx, img in enumerate(images):
            # Skip if same as current primary
            if img == curr_primary:
                continue
            sc = get_whiteness_score(img)
            # If the candidate image is substantially whiter/cleaner (> 25 points improvement)
            if sc > best_score + 25:
                best_score = sc
                best_img = img

        if best_img != curr_primary and best_score > 200:
            promoted_count += 1
            updates.append({
                'id': pid,
                'title': title,
                'old_primary': curr_primary,
                'old_score': curr_score,
                'new_primary': best_img,
                'new_score': best_score
            })
            # Reorder images array so best_img is first
            p['primary_image'] = best_img
            new_imgs = [best_img] + [im for im in images if im != best_img]
            p['images'] = new_imgs

    print(f"Total products evaluated: {len(products)}")
    print(f"Products promoted to clean white packshot: {promoted_count}")
    for u in updates[:15]:
        print(f"  [{u['id']}] {u['title'][:32]}: score {u['old_score']:.1f} -> {u['new_score']:.1f}")
        print(f"     Old: {u['old_primary']}")
        print(f"     New: {u['new_primary']}")

    if promoted_count > 0:
        # Save updated json
        with open(PRODUCTS_JSON, 'w', encoding='utf-8') as f:
            json.dump(products, f, indent=2, ensure_ascii=False)
            
        # Save updated js
        js_content = f"/**\n * Covertok Real Product Catalog Database\n * Auto-generated with {len(products)} authentic products and locally optimized packshots.\n */\nwindow.CovertokProducts = " + json.dumps(products, indent=2, ensure_ascii=False) + ";\n"
        with open(PRODUCTS_JS, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print("Updated products_data.json and products_data.js successfully.")

if __name__ == '__main__':
    run()
