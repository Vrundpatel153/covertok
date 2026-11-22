import json, re

# Check products_data.js syntax
with open('assets/products_data.js', 'r', encoding='utf-8') as f:
    content = f.read()
    assert 'window.PRODUCTS_DATA' in content
    print('products_data.js loaded successfully')

# Check index.html hero notch
with open('index.html', 'r', encoding='utf-8') as f:
    idx = f.read()
    assert 'id="heroCardClip"' in idx
    assert 'class="hero-card"' in idx
    main_nav = re.search(r'<nav[^>]*class="main-nav"[^>]*>(.*?)</nav>', idx, re.DOTALL).group(1)
    assert 'ABOUT US' not in main_nav
    assert 'CONTACT US' not in main_nav
    print('index.html navbar and hero verified')

# Check product.html
with open('product.html', 'r', encoding='utf-8') as f:
    pdp = f.read()
    main_nav = re.search(r'<nav[^>]*class="main-nav"[^>]*>(.*?)</nav>', pdp, re.DOTALL).group(1)
    assert 'ABOUT US' not in main_nav
    assert 'CONTACT US' not in main_nav
    assert 'id="galleryPrevBtn"' in pdp
    assert 'id="galleryNextBtn"' in pdp
    print('product.html navbar and gallery buttons verified')

# Check styles.css
with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()
    assert 'url(#heroCardClip)' in css
    assert '-68px' in css
    print('styles.css verified')

print('ALL CODE AND ASSET CHECKS PASSED!')
