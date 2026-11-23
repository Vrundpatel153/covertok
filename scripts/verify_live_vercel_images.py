import urllib.request
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

manifest = json.load(open('scripts/28_minimal_prompts.json'))
slots = ['01_model', '02_angle', '03_quality', '04_feature', '05_marketing']
base_url = 'https://covertok.vercel.app'

urls_to_check = []
for p in manifest:
    h = p['handle']
    for s in slots:
        urls_to_check.append((h, s, f'{base_url}/assets/products/{h}/showcase/{s}.webp', 'webp'))
        urls_to_check.append((h, s, f'{base_url}/assets/products/{h}/showcase/{s}.png', 'png'))

print(f'Starting concurrent live HTTP audit of {len(urls_to_check)} showcase assets on {base_url} (20 threads)...', flush=True)
start_time = time.time()

def check_url(item):
    handle, slot, url, ext = item
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=12) as res:
            code = res.getcode()
            clen = int(res.headers.get('Content-Length', 0))
            return (handle, slot, url, ext, code, clen, None)
    except Exception as e:
        return (handle, slot, url, ext, 0, 0, str(e))

results = []
with ThreadPoolExecutor(max_workers=20) as executor:
    futures = [executor.submit(check_url, item) for item in urls_to_check]
    for f in as_completed(futures):
        results.append(f.result())

duration = time.time() - start_time

webp_success = [r for r in results if r[3] == 'webp' and r[4] == 200 and r[5] > 1000]
png_success = [r for r in results if r[3] == 'png' and r[4] == 200 and r[5] > 1000]
failures = [r for r in results if r[4] != 200 or r[5] <= 1000]

print('\n======================================================', flush=True)
print(f'LIVE VERCEL PRODUCTION AUDIT COMPLETE (in {duration:.1f}s)', flush=True)
print(f'WebP Showcase Assets Verified (HTTP 200): {len(webp_success)} / 140', flush=True)
print(f'PNG Showcase Assets Verified (HTTP 200):  {len(png_success)} / 140', flush=True)
print(f'Total Failures: {len(failures)}', flush=True)

if failures:
    print('\nFailed assets on Vercel:')
    for h, s, url, ext, code, clen, err in failures:
        print(f'  [FAIL] {h} / {s}.{ext} -> HTTP {code}, length: {clen}, error: {err}', flush=True)
else:
    print('\n100% OF ALL 140 WEBP AND 140 PNG SHOWCASE ASSETS ARE ACTIVE, HEALTHY, AND SERVING FROM VERCEL CDN!', flush=True)
print('======================================================', flush=True)
