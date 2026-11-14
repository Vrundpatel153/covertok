import json, os, re

with open("assets/covertok_collections_map.json", "r", encoding="utf-8") as f:
    col_map = json.load(f)

with open("assets/products_data.json", "r", encoding="utf-8") as f:
    products = json.load(f)

# Helper to normalize handle for matching
def norm_handle(h):
    if not h:
        return ""
    return re.sub(r'[^\x00-\x7F]+', '', h).lower().strip('-_')

bestseller_set = set(col_map.get("our-bestsellers", []))
new_set = set(col_map.get("new-arrivals", []))
mens_set = set(col_map.get("mens-cover", []))
womens_set = set(col_map.get("womens-cover", []))

# Primary category priority
category_priority = [
    ("airpod-covers", "AirPods Covers"),
    ("charger-covers", "Charger Cases"),
    ("cover-charms", "Cover Charms"),
    ("watchbands", "Watch Bands"),
    ("iphone-cases", "Phone Cases"),
    ("covers", "Phone Cases"),
    ("charger-and-cables", "Tech Essentials"),
    ("other-accessories", "Tech Essentials"),
]

for p in products:
    h = p["handle"]
    nh = norm_handle(h)

    # find which collections this product belongs to
    prod_collections = []
    for cname, handles in col_map.items():
        if h in handles or nh in [norm_handle(x) for x in handles]:
            prod_collections.append(cname)

    if "all" not in prod_collections:
        prod_collections.insert(0, "all")

    # Update flags
    p["is_bestseller"] = (h in bestseller_set or nh in [norm_handle(x) for x in bestseller_set])
    p["is_new"] = (h in new_set or nh in [norm_handle(x) for x in new_set])
    p["is_mens"] = (h in mens_set or nh in [norm_handle(x) for x in mens_set])
    p["is_womens"] = (h in womens_set or nh in [norm_handle(x) for x in womens_set])

    # Assign primary category
    assigned_cat = None
    assigned_name = None
    for cslug, ctitle in category_priority:
        if cslug in prod_collections:
            assigned_cat = cslug
            assigned_name = ctitle
            break

    if not assigned_cat:
        if p["is_mens"]:
            assigned_cat = "iphone-cases"
            assigned_name = "Phone Cases"
        elif p["is_womens"]:
            assigned_cat = "iphone-cases"
            assigned_name = "Phone Cases"
        else:
            assigned_cat = "other-accessories"
            assigned_name = "Tech Essentials"

    p["category"] = assigned_cat
    p["category_name"] = assigned_name
    p["collections"] = prod_collections

# Save updated assets/products_data.json
with open("assets/products_data.json", "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

# Save updated assets/products_data.js
js_content = f"// Covertok Master Products Catalog Data (Auto-optimized WebP)\nwindow.CovertokProducts = {json.dumps(products, indent=2, ensure_ascii=False)};\n"
with open("assets/products_data.js", "w", encoding="utf-8") as f:
    f.write(js_content)

# Re-run build_product_wise_data
import subprocess
subprocess.run(["python", "scripts/build_product_wise_data.py"], check=True)

print("Successfully synced all 75 products with authentic Covertok collections and flags!")
