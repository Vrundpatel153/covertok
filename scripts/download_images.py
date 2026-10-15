import json
import os
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def clean_filename(src, default_ext='.jpg'):
    path = urllib.parse.urlparse(src).path
    ext = os.path.splitext(path)[1]
    if not ext or len(ext) > 5:
        ext = default_ext
    return ext

def download_one_image(task):
    product_id, img_id, position, src, dest_dir = task
    ext = clean_filename(src)
    filename = f"{position}_{img_id}{ext}"
    dest_path = os.path.join(dest_dir, filename)

    rel_path = f"assets/products/{product_id}/{filename}"

    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 500:
        return {'product_id': product_id, 'img_id': img_id, 'local_path': rel_path, 'status': 'exists'}

    max_retries = 3
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(src, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=25) as resp:
                content = resp.read()
                if len(content) > 100:
                    with open(dest_path, 'wb') as f:
                        f.write(content)
                    return {'product_id': product_id, 'img_id': img_id, 'local_path': rel_path, 'status': 'downloaded'}
        except Exception as e:
            time.sleep(1)
            if attempt == max_retries - 1:
                print(f"Failed to download {src} after {max_retries} attempts: {e}")
                return {'product_id': product_id, 'img_id': img_id, 'local_path': rel_path, 'status': f'error: {e}'}

    return {'product_id': product_id, 'img_id': img_id, 'local_path': rel_path, 'status': 'failed'}

def main():
    with open('scripts/raw_products.json', 'r', encoding='utf-8') as f:
        products = json.load(f)

    tasks = []
    base_assets_dir = 'assets/products'
    os.makedirs(base_assets_dir, exist_ok=True)

    for p in products:
        p_id = str(p['id'])
        p_dir = os.path.join(base_assets_dir, p_id)
        os.makedirs(p_dir, exist_ok=True)

        for img in p.get('images', []):
            img_id = str(img['id'])
            pos = img.get('position', 1)
            src = img.get('src')
            if src:
                tasks.append((p_id, img_id, pos, src, p_dir))

    print(f"Total images to download: {len(tasks)}")

    results = {}
    completed = 0
    errors = 0

    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(download_one_image, t): t for t in tasks}
        for future in as_completed(futures):
            res = future.result()
            completed += 1
            if 'error' in res['status'] or res['status'] == 'failed':
                errors += 1
            results[f"{res['product_id']}_{res['img_id']}"] = res['local_path']
            if completed % 50 == 0 or completed == len(tasks):
                print(f"Progress: {completed}/{len(tasks)} images processed ({errors} errors)")

    print(f"\nDownload finished! Total processed: {completed}, Errors: {errors}")

    with open('scripts/downloaded_images_map.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    print("Saved image mapping to scripts/downloaded_images_map.json")

if __name__ == '__main__':
    main()
