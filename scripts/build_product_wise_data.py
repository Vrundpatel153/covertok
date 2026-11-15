import json
import os
import re
from html import unescape

with open("assets/covertok_live_products.json", "r", encoding="utf-8") as f:
    live_raw = json.load(f)
live_by_id = {str(p["id"]): p for p in live_raw}
live_by_handle = {p["handle"]: p for p in live_raw}

with open("assets/products_data.json", "r", encoding="utf-8") as f:
    local_prods = json.load(f)

os.makedirs("data/products", exist_ok=True)

def strip_tags(html):
    if not html:
        return ""
    text = re.sub(r'<[^>]+>', ' ', html)
    text = unescape(text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_features(html):
    if not html:
        return []
    features = []
    # match <li> tags
    li_matches = re.findall(r'<li[^>]*>(.*?)</li>', html, re.DOTALL | re.IGNORECASE)
    for m in li_matches:
        clean = strip_tags(m)
        if clean and len(clean) > 3:
            features.append(clean)
    if not features:
        # try lines with checkmarks or bullets
        lines = html.split('<br')
        for l in lines:
            cl = strip_tags(l)
            if any(cl.startswith(x) for x in ['✔', '•', '-', '*']) or 'Key Features' in cl:
                cl_clean = re.sub(r'^[✔•\-\*\s]+', '', cl).strip()
                if cl_clean and len(cl_clean) > 4:
                    features.append(cl_clean)
    return features

created_count = 0

for p in local_prods:
    pid = str(p["id"])
    handle = p["handle"]
    live_p = live_by_id.get(pid) or live_by_handle.get(handle) or {}

    body_html = live_p.get("body_html") or p.get("description", "")
    features = extract_features(body_html)
    desc_text = strip_tags(body_html)

    # find folder
    clean_handle = re.sub(r'[^\x00-\x7F]+', '', handle)
    target_folder = None
    if os.path.isdir(os.path.join("assets", "products", handle)):
        target_folder = os.path.join("assets", "products", handle)
    elif os.path.isdir(os.path.join("assets", "products", clean_handle)):
        target_folder = os.path.join("assets", "products", clean_handle)
    else:
        for d in os.listdir("assets/products"):
            if d.startswith(clean_handle[:20]):
                target_folder = os.path.join("assets", "products", d)
                break

    structured_data = {
        "id": p["id"],
        "handle": p["handle"],
        "title": p["title"],
        "price": p["price"],
        "original_price": p.get("original_price", p["price"]),
        "discount_percent": p.get("discount_percent", 0),
        "rating": p.get("rating", 4.9),
        "reviews_count": p.get("reviews_count", 150),
        "category": p.get("category", "all"),
        "category_name": p.get("category_name", "Accessories"),
        "collections": p.get("collections", [p.get("category", "all")]),
        "vendor": "Covertok",
        "product_type": live_p.get("product_type", ""),
        "tags": live_p.get("tags", p.get("tags", [])),
        "is_bestseller": p.get("is_bestseller", False),
        "is_new": p.get("is_new", False),
        "is_mens": p.get("is_mens", False),
        "is_womens": p.get("is_womens", False),
        "primary_image": p.get("primary_image"),
        "images": p.get("images", []),
        "colors": p.get("colors", []),
        "models": p.get("models", []),
        "model_label": p.get("model_label", "Select Model"),
        "options": live_p.get("options", []),
        "variants": live_p.get("variants", []),
        "features": features,
        "description_text": desc_text,
        "description_html": body_html
    }

    # Save to data/products/<clean_handle>.json
    safe_slug = re.sub(r'[^a-zA-Z0-9_\-]+', '', clean_handle).strip('-_')
    if safe_slug:
        data_path = os.path.join("data", "products", f"{safe_slug}.json")
        with open(data_path, "w", encoding="utf-8") as f:
            json.dump(structured_data, f, indent=2, ensure_ascii=False)

    # Save to assets/products/<target_folder>/product.json
    if target_folder and os.path.isdir(target_folder):
        asset_json_path = os.path.join(target_folder, "product.json")
        with open(asset_json_path, "w", encoding="utf-8") as f:
            json.dump(structured_data, f, indent=2, ensure_ascii=False)
        created_count += 1

print(f"Successfully generated structured product.json for {created_count} / {len(local_prods)} products!")

