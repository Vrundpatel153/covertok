import re, os

files = ['collections.html', 'index.html', 'product.html', 'combo.html', 'about.html', 'contact.html']
version = '20261122_nav_fix'

for fpath in files:
    if not os.path.exists(fpath):
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(r'styles\.css(\?v=[^"\'\s>]+)?', f'styles.css?v={version}', content)
    content = re.sub(r'catalog\.css(\?v=[^"\'\s>]+)?', f'catalog.css?v={version}', content)
    content = re.sub(r'pdp\.css(\?v=[^"\'\s>]+)?', f'pdp.css?v={version}', content)
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Updated cache bust in {fpath} to {version}')
