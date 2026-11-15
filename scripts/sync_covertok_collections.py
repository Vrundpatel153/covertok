import urllib.request
import json
import time

collections = [
    'airpod-covers', 'buy-three', 'charger-and-cables', 'charger-covers',
    'cover-charms', 'covers', 'iphone-cases', 'watchbands',
    'mens-cover', 'new-arrivals', 'other-accessories', 'our-bestsellers', 'womens-cover'
]

collection_map = {c: [] for c in collections}

print("Fetching collections membership from Covertok official...")

for col in collections:
    url = f"https://covertok.com/collections/{col}/products.json?limit=250"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            prods = data.get('products', [])
            handles = [p['handle'] for p in prods]
            collection_map[col] = handles
            print(f"  {col}: {len(handles)} products")
    except Exception as e:
        print(f"  Error fetching {col}: {e}")
    time.sleep(0.3)

with open("assets/covertok_collections_map.json", "w", encoding="utf-8") as f:
    json.dump(collection_map, f, indent=2)

print("Saved assets/covertok_collections_map.json")

