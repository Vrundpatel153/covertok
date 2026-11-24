import glob, re

for f in glob.glob('*.html'):
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    
    new_content = re.sub(r'assets/products_data\.js\?v=[^\"\'\s>]+', 'assets/products_data.js?v=20261124_v32_lifestyle_models', content)
    new_content = re.sub(r'assets/pdp_controller\.js\?v=[^\"\'\s>]+', 'assets/pdp_controller.js?v=20261124_v32_lifestyle_models', new_content)
    new_content = re.sub(r'assets/catalog\.js\?v=[^\"\'\s>]+', 'assets/catalog.js?v=20261124_v32_lifestyle_models', new_content)
    
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as fp:
            fp.write(new_content)
        print(f"Updated cachebuster in {f}")

print("All cachebusters updated to v=20261124_v32_lifestyle_models.")
