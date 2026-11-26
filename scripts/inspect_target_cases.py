import os, json

with open('assets/products_data.js', encoding='utf-8') as f:
    text = f.read()

idx = text.find('[')
last_idx = text.rfind(']')
products = json.loads(text[idx:last_idx+1])

targets = [
    'transparent-magnetic-wireless-charging-phone-case',
    'crystal-studded-luxe-case-orange',
    'ultra-clear-sideless-anti-yellow-back-case',
    'luxury-steel-blue-heart-sparkle-phone-case-with-pearl-chain',
    'silver-3d-love-heart-phone-case-copy',
    'silver-3d-love-heart-phone-case',
    'luxury-crossbody-wallet-phone-case',
    'glow-edge-glow-in-dark-transparent-shockproof-clear-cover-with-bumper-camera-protection-for-iphone',
    'bumper-case'
]

for p in products:
    h = p.get('handle')
    if h in targets:
        print(f"=== {h} ===")
        print(f"Title: {p.get('title')}")
        print(f"Primary: {p.get('primary_image')}")
        for c in p.get('colors', []):
            print(f"  Color: {c.get('name')} -> {c.get('image')}")
