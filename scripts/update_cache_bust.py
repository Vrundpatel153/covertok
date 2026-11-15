import re

files = ['collections.html', 'index.html', 'product.html']
version = '20261115_v5'

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(r'products_data\.js(\?v=[^"\'\s>]+)?', f'products_data.js?v={version}', content)
    content = re.sub(r'pdp_controller\.js(\?v=[^"\'\s>]+)?', f'pdp_controller.js?v={version}', content)
    content = re.sub(r'catalog\.js(\?v=[^"\'\s>]+)?', f'catalog.js?v={version}', content)
    content = re.sub(r'styles\.css(\?v=[^"\'\s>]+)?', f'styles.css?v={version}', content)
    content = re.sub(r'catalog\.css(\?v=[^"\'\s>]+)?', f'catalog.css?v={version}', content)
    content = re.sub(r'pdp\.css(\?v=[^"\'\s>]+)?', f'pdp.css?v={version}', content)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Updated cache bust in {file} to {version}')

