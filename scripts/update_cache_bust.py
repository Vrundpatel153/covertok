import re

files = ['collections.html', 'index.html', 'product.html']
for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(r'products_data\.js(\?v=[^"\'\s>]+)?', 'products_data.js?v=20261115_v4', content)
    content = re.sub(r'pdp_controller\.js(\?v=[^"\'\s>]+)?', 'pdp_controller.js?v=20261115_v4', content)
    content = re.sub(r'catalog\.js(\?v=[^"\'\s>]+)?', 'catalog.js?v=20261115_v4', content)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Updated cache bust in {file}')
