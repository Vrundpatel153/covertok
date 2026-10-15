import urllib.request
import json
import os
import re

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def fetch_json(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode('utf-8'))

def main():
    print("Fetching collections...")
    colls_data = fetch_json('https://covertok.com/collections.json?limit=250')
    collections = colls_data.get('collections', [])
    print(f"Found {len(collections)} collections.")

    coll_map = {}
    for c in collections:
        handle = c['handle']
        title = c['title']
        try:
            p_data = fetch_json(f'https://covertok.com/collections/{handle}/products.json?limit=250')
            prods = p_data.get('products', [])
            coll_map[handle] = {
                'id': c['id'],
                'title': title,
                'handle': handle,
                'products_count': len(prods),
                'product_ids': [p['id'] for p in prods]
            }
            print(f"  Collection '{title}' ({handle}): {len(prods)} products")
        except Exception as e:
            print(f"  Error fetching collection {handle}: {e}")

    print("\nFetching all products from /products.json?limit=250...")
    all_products_raw = []
    page = 1
    while True:
        url = f'https://covertok.com/products.json?limit=250&page={page}'
        data = fetch_json(url)
        prods = data.get('products', [])
        if not prods:
            break
        all_products_raw.extend(prods)
        print(f"  Page {page}: {len(prods)} products")
        if len(prods) < 250:
            break
        page += 1

    print(f"Total raw products fetched: {len(all_products_raw)}")

    # Save raw products and collections
    with open('scripts/raw_products.json', 'w', encoding='utf-8') as f:
        json.dump(all_products_raw, f, indent=2, ensure_ascii=False)
    with open('scripts/raw_collections.json', 'w', encoding='utf-8') as f:
        json.dump(coll_map, f, indent=2, ensure_ascii=False)

    print("Saved raw products and collections to scripts/")

if __name__ == '__main__':
    main()
