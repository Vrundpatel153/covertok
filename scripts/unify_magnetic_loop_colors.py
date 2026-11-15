import json

with open('assets/products_data.json', encoding='utf-8') as f:
    products = json.load(f)

all_loop_colors = [
    {
        "name": "Cloud Grey+Blue",
        "hex": "#64748B",
        "price": 999.0,
        "image": "assets/products/magnetic-loop-smartwatch-bands-dual-color-edition-copy/cloud-grey-blue/01_packshot.webp",
        "images": [
            "assets/products/magnetic-loop-smartwatch-bands-dual-color-edition-copy/cloud-grey-blue/01_packshot.webp"
        ]
    },
    {
        "name": "Blue+Midnight Black",
        "hex": "#1E3A8A",
        "price": 999.0,
        "image": "assets/products/magnetic-loop-smartwatch-bands-dual-color-edition/blue-midnight-black/01_packshot.webp",
        "images": [
            "assets/products/magnetic-loop-smartwatch-bands-dual-color-edition/blue-midnight-black/01_packshot.webp"
        ]
    },
    {
        "name": "Black+Grey",
        "hex": "#18181B",
        "price": 999.0,
        "image": "assets/products/magnetic-loop-smartwatch-bands-dual-color-edition-copy-1/black-grey/01_packshot.webp",
        "images": [
            "assets/products/magnetic-loop-smartwatch-bands-dual-color-edition-copy-1/black-grey/01_packshot.webp"
        ]
    },
    {
        "name": "Starlight+Pink",
        "hex": "#F472B6",
        "price": 999.0,
        "image": "assets/products/magnetic-loop-smartwatch-bands-dual-color-edition-copy-2/starlight-pink/01_packshot.webp",
        "images": [
            "assets/products/magnetic-loop-smartwatch-bands-dual-color-edition-copy-2/starlight-pink/01_packshot.webp"
        ]
    },
    {
        "name": "Orange+Midnight Black",
        "hex": "#EA580C",
        "price": 999.0,
        "image": "assets/products/magnetic-loop-smartwatch-bands-dual-color-edition-copy-copy/orange-midnight-black/01_packshot.webp",
        "images": [
            "assets/products/magnetic-loop-smartwatch-bands-dual-color-edition-copy-copy/orange-midnight-black/01_packshot.webp"
        ]
    }
]

loop_handles = [
    'magnetic-loop-smartwatch-bands-dual-color-edition-copy',
    'magnetic-loop-smartwatch-bands-dual-color-edition',
    'magnetic-loop-smartwatch-bands-dual-color-edition-copy-1',
    'magnetic-loop-smartwatch-bands-dual-color-edition-copy-2',
    'magnetic-loop-smartwatch-bands-dual-color-edition-copy-copy'
]

for p in products:
    if p['handle'] in loop_handles:
        p['has_colors'] = True
        # Order colors so the product's primary color is first
        cur_img = p.get('primary_image')
        sorted_colors = sorted(all_loop_colors, key=lambda c: 0 if c['image'] == cur_img else 1)
        p['colors'] = sorted_colors
        # Ensure primary_image is clean isolated packshot of that color
        p['primary_image'] = sorted_colors[0]['image']

with open('assets/products_data.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2)

with open('assets/products_data.js', 'w', encoding='utf-8') as f:
    f.write('window.CovertokProducts = ' + json.dumps(products, indent=2) + ';\n')

print("Updated magnetic loop smartwatch bands with all 5 color options!")

