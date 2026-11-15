from PIL import Image
import os
import shutil

def copy_and_resize(src, dest, quality=95):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    im = Image.open(src).convert('RGB')
    if im.size != (1024, 1024):
        im = im.resize((1024, 1024), Image.Resampling.LANCZOS)
    im.save(dest, 'WEBP', quality=quality)
    print(f"Installed -> {dest}")

# 1. Crystal Butterfly Beaded Phone Charm (Ocean Butterfly)
copy_and_resize(
    'test_u2netp_butterfly.webp',
    'assets/products/crystal-butterfly-beaded-phone-charm-/ocean-butterfly/01_packshot.webp'
)
copy_and_resize(
    'test_u2netp_butterfly.webp',
    'assets/products/9870559183146/packshot_white_1.webp'
)

# 2. Magnetic Loop Smartwatch Bands (Cloud grey+Blue)
copy_and_resize(
    'assets/products/9871354528042/10_49997038813482.webp',
    'assets/products/magnetic-loop-smartwatch-bands-dual-color-edition-copy/cloud-grey-blue/01_packshot.webp'
)
copy_and_resize(
    'assets/products/9871354528042/10_49997038813482.webp',
    'assets/products/9871354528042/packshot_white_1.webp'
)

# 3. Ultra Clear Sideless Anti-Yellow Back Case
copy_and_resize(
    'assets/products/9981786390826/white_0.png',
    'assets/products/ultra-clear-sideless-anti-yellow-back-case/crystal-clear/01_packshot.webp'
)
copy_and_resize(
    'assets/products/9981786390826/white_0.png',
    'assets/products/9981786390826/packshot_white_1.webp'
)

# 4. Pastel Heart Print Soft Silicone Phone Case
copy_and_resize(
    'assets/products/9873114038570/white_2.png',
    'assets/products/pastel-heart-print-soft-silicone-phone-case/ivory-hearts/01_packshot.webp'
)
copy_and_resize(
    'assets/products/9873114038570/white_2.png',
    'assets/products/9873114038570/packshot_white_1.webp'
)
copy_and_resize(
    'assets/products/9873114038570/white_3.png',
    'assets/products/pastel-heart-print-soft-silicone-phone-case/blush-pink/01_packshot.webp'
)
copy_and_resize(
    'assets/products/9873114038570/white_4.png',
    'assets/products/pastel-heart-print-soft-silicone-phone-case/mint-breeze/01_packshot.webp'
)

# 5. Crystal Phone Charm
copy_and_resize(
    'assets/products/9870558036266/white_2.png',
    'assets/products/crystal-beaded-phone-charm-/crystal-glass/01_packshot.webp'
)
copy_and_resize(
    'assets/products/9870558036266/white_2.png',
    'assets/products/9870558036266/packshot_white_1.webp'
)

# 6. Bow Pearl iPhone Charger Case Set
copy_and_resize(
    'assets/products/9870550761770/white_0.png',
    'assets/products/bow-pearl-iphone-charger-case-set-/pearl-white/01_packshot.webp'
)
copy_and_resize(
    'assets/products/9870550761770/white_0.png',
    'assets/products/9870550761770/packshot_white_1.webp'
)
