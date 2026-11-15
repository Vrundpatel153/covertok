import json

issues = json.load(open('audit_issues.json', encoding='utf-8'))
prim_issues = [i for i in issues if i['type'] == 'primary']
col_issues = [i for i in issues if i['type'] == 'color']

print(f"Total issues: {len(issues)}")
print(f"Primary failures ({len(prim_issues)}):")
for p in prim_issues:
    print(f"  [{p['pid']}] {p['title']} -> {p['path']}")

print(f"\nColor failures ({len(col_issues)}):")
# Group by product
by_prod = {}
for c in col_issues:
    by_prod.setdefault(c['title'], []).append(c)

for title, cols in by_prod.items():
    print(f"  {title} ({len(cols)} colors failed): {[c['color'] for c in cols]}")
