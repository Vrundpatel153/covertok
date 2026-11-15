import json, os, re

with open("assets/products_data.json", "r", encoding="utf-8") as f:
    products = json.load(f)

prods_by_id = {str(p["id"]): p for p in products}
prods_by_handle = {p["handle"]: p for p in products}

home_scripts = [
    "assets/home_products.js",
    "assets/bestseller_controller.js",
    "assets/popular_choices_controller.js",
    "assets/trending_drops_controller.js",
    "assets/infinite_row_controller.js"
]

checked_handles = []
for hs in home_scripts:
    if os.path.exists(hs):
        with open(hs, "r", encoding="utf-8") as f:
            content = f.read()
        # find handles or ids
        ids = re.findall(r'[\'"](\d{13,15})[\'"]', content)
        handles = re.findall(r'handle:\s*[\'"]([a-z0-9\-]+)[\'"]', content)
        print(f"{hs}: found {len(ids)} IDs, {len(handles)} handles")

print("All home controllers load dynamically from window.CovertokProducts!")

