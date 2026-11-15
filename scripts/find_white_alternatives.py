import json
import os
import glob
from PIL import Image
from collections import defaultdict

with open('audit_issues.json', encoding='utf-8') as f:
    issues = json.load(f)

pids = sorted(list(set(x['pid'] for x in issues)))

print(f"Auditing {len(pids)} products with issues:")

def is_pure_white(im):
    w, h = im.size
    samples = [
        im.getpixel((0, 0)),
        im.getpixel((w-1, 0)),
        im.getpixel((0, h-1)),
        im.getpixel((w-1, h-1)),
        im.getpixel((w//2, 0)),
        im.getpixel((0, h//2)),
        im.getpixel((w-1, h//2)),
    ]
    # check if all samples are rgb >= 250
    return all(all(c >= 250 for c in s[:3]) for s in samples)

report = {}

for pid in pids:
    folder = f"assets/products/{pid}"
    title = next(x['title'] for x in issues if x['pid'] == pid)
    print(f"\n[{pid}] {title}")
    if not os.path.exists(folder):
        print("  Folder does not exist!")
        continue
    
    files = os.listdir(folder)
    print(f"  Total files in {folder}: {len(files)}")
    
    white_files = []
    for f in files:
        if f.endswith(('.png', '.webp', '.jpg')):
            fpath = os.path.join(folder, f)
            try:
                im = Image.open(fpath)
                if is_pure_white(im):
                    white_files.append((f, im.size))
            except Exception as e:
                pass
    
    print(f"  Files with pure white borders: {len(white_files)}")
    for wf, sz in white_files[:10]:
        print(f"    - {wf} (size {sz})")
    
    report[pid] = {
        'title': title,
        'total_files': len(files),
        'white_files': [w[0] for w in white_files]
    }

with open('white_alternatives_report.json', 'w', encoding='utf-8') as f:
    json.dump(report, f, indent=2)

print("\nWrote white_alternatives_report.json")
