import re

version = "20261115_75prods_v2"

files = ["collections.html", "index.html", "product.html"]

for fname in files:
    with open(fname, "r", encoding="utf-8") as f:
        content = f.read()

    # bump catalog.css
    content = re.sub(r'catalog\.css(\?v=[^"\'\s>]+)?', f'catalog.css?v={version}', content)
    # bump styles.css
    content = re.sub(r'styles\.css(\?v=[^"\'\s>]+)?', f'styles.css?v={version}', content)
    # bump products_data.js
    content = re.sub(r'assets/products_data\.js(\?v=[^"\'\s>]+)?', f'assets/products_data.js?v={version}', content)
    # bump catalog.js
    content = re.sub(r'assets/catalog\.js(\?v=[^"\'\s>]+)?', f'assets/catalog.js?v={version}', content)

    with open(fname, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Updated cache-busting in {fname}")

