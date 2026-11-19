import json
import os
import re
from PIL import Image

data_file = 'assets/products_data.js'
with open(data_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract json
prefix = "// Covertok Full 75-Product Canonical Dataset\nwindow.CovertokProducts = window.PRODUCTS_DATA = "
suffix = ";\n"

if content.startswith(prefix):
    json_str = content[len(prefix):].rstrip().rstrip(';')
else:
    match = re.search(r'window\.PRODUCTS_DATA\s*=\s*(\[.*\]);?', content, re.DOTALL)
    json_str = match.group(1)

products = json.loads(json_str)

iphone_cases = [p for p in products if p.get('category') == 'iphone-cases']
print(f"Total iPhone case products found in products_data.js: {len(iphone_cases)}")

image_names = ["01_model", "02_angle", "03_quality", "04_feature", "05_marketing"]
all_verified = True
verified_count = 0

for p in iphone_cases:
    handle = p['handle']
    showcase_dir = os.path.join('assets', 'products', handle, 'showcase')
    if not os.path.isdir(showcase_dir):
        print(f"ERROR: Missing showcase dir for {handle}")
        all_verified = False
        continue

    showcase_list = []
    prod_ok = True
    for name in image_names:
        webp_path = os.path.join(showcase_dir, f"{name}.webp")
        png_path = os.path.join(showcase_dir, f"{name}.png")

        if not os.path.exists(webp_path):
            print(f"ERROR: Missing {webp_path}")
            prod_ok = False
        else:
            with Image.open(webp_path) as im:
                if im.size != (1254, 1254):
                    print(f"ERROR: Incorrect size {im.size} for {webp_path}")
                    prod_ok = False

        if not os.path.exists(png_path):
            print(f"ERROR: Missing {png_path}")
            prod_ok = False
        else:
            with Image.open(png_path) as im:
                if im.size != (1254, 1254):
                    print(f"ERROR: Incorrect size {im.size} for {png_path}")
                    prod_ok = False

        web_url = f"assets/products/{handle}/showcase/{name}.webp"
        showcase_list.append(web_url)

    if prod_ok:
        p['showcase'] = showcase_list
        verified_count += 1
    else:
        all_verified = False

print(f"Verified {verified_count}/{len(iphone_cases)} iPhone cases with full 1254x1254 showcase sets.")

if all_verified and verified_count == 28:
    new_content = prefix + json.dumps(products, indent=2, ensure_ascii=False) + suffix
    with open(data_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated assets/products_data.js with canonical showcase arrays!")
else:
    print("Verification failed or incomplete, not writing products_data.js")

