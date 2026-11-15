import os
import json

targets = [
    'multi-color-silicone-suction-grips-phone-holder-with-kickstand',
    'premium-silicone-watch-bands-available-in-18-colors-copy-1',
    'pastel-heart-print-soft-silicone-phone-case',
    'luxury-quilted-crossbody-wallet-phone-case-copy-1',
    'heart-iphone-charger-case-set-with-matching-cable-',
    'silicone-airpods-cases-with-rope-strap-copy',
    'title-butterfly-charm-airpods-case--copy',
    'pearl-charm-bow-airpods-cases--copy',
    'ultra-thin-frosted-phone-cases-copy',
    'trendy-graphic-phone-cases-copy',
    'cute-bear-phone-case-with-plush-keychain-copy-1',
    'untitled-27jul_18-46',
    'bumper-case'
]

for t in targets:
    p = os.path.join('assets', 'products', t)
    if os.path.exists(p):
        print(f"\n=== {t} ===")
        for root, dirs, files in os.walk(p):
            rel = os.path.relpath(root, p)
            if files:
                print(f"  [{rel}] {len(files)} files: {files[:4]}")

