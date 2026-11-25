import json
import os
import shutil

# 1. Fix bumper-case broken composite packshots
for variant in ['natural-titanium', 'desert-titanium', 'dark-red', 'sierra-blue', 'cosmic-orange']:
    base_dir = os.path.join('assets', 'products', 'bumper-case', variant)
    for ext in ['.png', '.webp']:
        src = os.path.join(base_dir, '02_packshot_bare' + ext)
        dst = os.path.join(base_dir, '01_packshot' + ext)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"[bumper-case] Copied clean {src} -> {dst}")

# Fix black/02_packshot_bare (had sierra blue by mistake)
blk_dir = os.path.join('assets', 'products', 'bumper-case', 'black')
for ext in ['.png', '.webp']:
    src = os.path.join(blk_dir, '01_packshot' + ext)
    dst = os.path.join(blk_dir, '02_packshot_bare' + ext)
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"[bumper-case] Fixed {dst} from {src}")

# 2. Clean cluttered supplier infographics from assets/products_data.js
with open('assets/products_data.js', 'r', encoding='utf-8') as f:
    txt = f.read()

prefix = txt[:txt.find('[')]
suffix = ';\n'
prods = json.loads(txt[txt.find('['):txt.rfind(']') + 1])

REMOVE_BY_HANDLE = {
    'bumper-case': {
        'black/02_packshot_bare.webp',
        'natural-titanium/02_packshot_bare.webp',
        'desert-titanium/02_packshot_bare.webp',
        'dark-red/02_packshot_bare.webp',
        'sierra-blue/02_packshot_bare.webp',
        'cosmic-orange/02_packshot_bare.webp',
    },
    'premium-magnetic-phone-holder-with-360-rotation-strong-adhesive-mount': {
        'extra/08_extra.webp',  # keep 05_extra for ChatGPT replacement
    },
    'premium-silicone-watch-bands-available-in-18-colors-copy-1': {
        'extra/22_extra.webp',
        'extra/23_extra.webp',
        'extra/24_extra.webp',
        'extra/25_extra.webp',
        'extra/26_extra.webp',
    },
    'magnetic-loop-smartwatch-bands-dual-color-edition-copy-2': {
        'extra/08_extra.webp',
    },
    'magnetic-loop-smartwatch-bands-dual-color-edition-copy-1': {
        'extra/11_extra.webp',
        'extra/16_extra.webp',
    },
    'magnetic-loop-smartwatch-bands-dual-color-edition-copy-copy': {
        'extra/14_extra.webp',
    },
    'magnetic-loop-smartwatch-bands-dual-color-edition-copy': {
        'extra/06_extra.webp',
    },
    'magnetic-loop-smartwatch-bands-dual-color-edition': {
        'extra/09_extra.webp',
        'extra/11_extra.webp',
    },
    'foldable-magnetic-phone-holder-strong-magnet-suction-mount-for-desk-wall-car-dashboard-windshield-360-adjustable-rotation-vacuum-adsorption-stand': {
        'extra/05_extra.webp',
        'extra/06_extra.webp',  # keep 03_extra & 04_extra for ChatGPT replacement
    },
    'premium-tempered-glass-screen-protector-with-easy-installation-kit': {
        'extra/05_extra.webp',  # keep 02_extra & 03_extra for ChatGPT replacement
    },
    'premium-matte-frosted-privacy-tempered-glass-screen-protector': {
        'extra/04_extra.webp',
        'extra/05_extra.webp',
        'extra/06_extra.webp',
        'extra/07_extra.webp',
        'extra/08_extra.webp',
        'extra/09_extra.webp',
        'extra/10_extra.webp',
        'extra/11_extra.webp',  # keep 01_extra & 03_extra for ChatGPT replacement
    },
}

total_removed = 0
for p in prods:
    h = p.get('handle')
    rules = REMOVE_BY_HANDLE.get(h)
    if not rules:
        continue
    old_imgs = p.get('images') or []
    new_imgs = []
    for u in old_imgs:
        clean = u.split('?')[0]
        if any(clean.endswith('/' + r) for r in rules):
            total_removed += 1
        else:
            new_imgs.append(u)
    p['images'] = new_imgs
    print(f"[{h[:42]}] images: {len(old_imgs)} -> {len(new_imgs)}")

out_js = prefix + json.dumps(prods, indent=2) + suffix
with open('assets/products_data.js', 'w', encoding='utf-8') as f:
    f.write(out_js)

print(f"Total cluttered/duplicate images trimmed from products_data.js: {total_removed}")

# 3. Clean instagram_controller.js screenshots with baked UI icons
with open('assets/instagram_controller.js', 'r', encoding='utf-8') as f:
    ig_txt = f.read()

ig_txt = ig_txt.replace(
    'assets/instagram/modal/view_04_studio.webp',
    'assets/products/magsafe-clear-case-for-iphone-13-to-16-series-supports-all-plus-pro-and-pro-max-models-transparent-shockproof-cover/showcase/02_angle.webp'
)
ig_txt = ig_txt.replace(
    'assets/bestseller/prod_02_wallet_kickstand.webp',
    'assets/bestseller/bestseller_left_stage_clean.webp'
)
with open('assets/instagram_controller.js', 'w', encoding='utf-8') as f:
    f.write(ig_txt)
print("Updated assets/instagram_controller.js")
