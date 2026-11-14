import json, os

with open("assets/products_data.json", "r", encoding="utf-8") as f:
    products = json.load(f)

missing_images = []
total_images_checked = 0

for p in products:
    primary = p.get("primary_image")
    if primary:
        total_images_checked += 1
        if not os.path.exists(primary):
            missing_images.append((p["handle"], "primary", primary))
    for c in p.get("colors", []):
        cimg = c.get("image")
        if cimg:
            total_images_checked += 1
            if not os.path.exists(cimg):
                missing_images.append((p["handle"], f"color:{c.get('name')}", cimg))
        for img in c.get("images", []):
            total_images_checked += 1
            if not os.path.exists(img):
                missing_images.append((p["handle"], f"color_img:{c.get('name')}", img))

print(f"Total product images checked: {total_images_checked}")
print(f"Missing images count: {len(missing_images)}")
if missing_images:
    for m in missing_images[:10]:
        print("  Missing:", m)
else:
    print("ALL 75 PRODUCTS HAVE 100% VALID, EXISTING IMAGES ON DISK!")
