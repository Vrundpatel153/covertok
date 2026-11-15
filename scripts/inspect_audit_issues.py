import json
from collections import defaultdict

with open('audit_issues.json', encoding='utf-8') as f:
    issues = json.load(f)

by_prod = defaultdict(list)
for item in issues:
    by_prod[(item['pid'], item['title'], item['handle'])].append(item)

print(f"Total issue records: {len(issues)}")
print(f"Total products affected: {len(by_prod)}")

for (pid, title, handle), items in sorted(by_prod.items()):
    print(f"\n[{pid}] {title} ({len(items)} issues)")
    print(f"  Handle: {handle}")
    for it in items:
        clr = it.get('color', 'PRIMARY')
        print(f"    - {clr}: {it['path']}")
