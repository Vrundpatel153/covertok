from PIL import Image
import os

def install_packshot(src_path, targets):
    im = Image.open(src_path).convert('RGB')
    im_1024 = im.resize((1024, 1024), Image.Resampling.LANCZOS)
    for t in targets:
        os.makedirs(os.path.dirname(t), exist_ok=True)
        if t.endswith('.webp'):
            im_1024.save(t, 'WEBP', quality=95)
        elif t.endswith('.png'):
            im_1024.save(t, 'PNG', optimize=True)
        elif t.endswith('.jpg'):
            im_1024.save(t, 'JPEG', quality=95)
        print(f"Installed packshot -> {t}")

# 1. Crystal Studded Luxe Case – Cosmic Orange
install_packshot(
    r'C:\Users\vrund\.gemini\antigravity\brain\bf9d02b0-6d62-46dd-8569-a82dd4dbb8ba\crystal_studded_luxe_case_orange_packshot_1794715202867.jpg',
    [
        'assets/products/crystal-studded-luxe-case-orange/cosmic-orange/01_packshot.webp',
        'assets/products/9982201299242/packshot_white_1.webp',
        'assets/products/9982201299242/white_0.png'
    ]
)

# 2. Transparent Magnetic Wireless Charging Phone Case – Cosmic Orange
install_packshot(
    r'C:\Users\vrund\.gemini\antigravity\brain\bf9d02b0-6d62-46dd-8569-a82dd4dbb8ba\transparent_magsafe_case_orange_packshot_1794715233923.jpg',
    [
        'assets/products/transparent-magnetic-wireless-charging-phone-case/cosmic-orange/01_packshot.webp',
        'assets/products/9989730304298/packshot_white_1.webp',
        'assets/products/9989730304298/white_0.png'
    ]
)
