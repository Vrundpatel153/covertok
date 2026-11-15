import json
import os

with open('active_image_failures.json', encoding='utf-8') as f:
    failures = json.load(f)

# Group by product id
by_pid = {}
for f in failures:
    pid = f['pid']
    if pid not in by_pid:
        by_pid[pid] = {
            'pid': pid,
            'title': f['title'],
            'handle': f['handle'],
            'issues': []
        }
    by_pid[pid]['issues'].append(f)

print(f"Total products with active image issues: {len(by_pid)}\n")
for pid, data in sorted(by_pid.items()):
    print(f"[{pid}] {data['title']} ({len(data['issues'])} issues):")
    for iss in data['issues']:
        print(f"   * {iss['label']}: skin={iss['skin_pct']}%, reason={iss['reason']}, path={iss['path']}")
    print()
