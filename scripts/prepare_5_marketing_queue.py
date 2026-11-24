import json
import os
from PIL import Image

REFS_DIR = os.path.join('scripts', 'temp_refs')
os.makedirs(REFS_DIR, exist_ok=True)

with open('scripts/28_minimal_prompts.json', 'r', encoding='utf-8') as f:
    all_items = json.load(f)

TARGETS = {
    'phone-cover-with-built-in-lip-balm-holder-copy-copy-6': (
        'Clean Scandinavian minimalist flatlay on light cream travertine stone: accompanied ONLY by a plain matte ceramic coffee cup and brushed tortoise-shell sunglasses with crisp morning window shadows and generous negative space. Strictly NO perfume bottles, NO Chanel/Dior logos, NO satin fabric, NO flowers or jewelry clutter.'
    ),
    'luxury-steel-blue-heart-sparkle-phone-case-with-pearl-chain': (
        'Clean Japanese minimalist lifestyle flatlay on pale oak wood and linen surface: accompanied ONLY by sleek minimalist sunglasses and a clean brushed metal pen. Soft natural morning sunlight shadows and high negative space. Strictly NO perfume bottles, NO silk/satin waves, NO gold rings or flowers.'
    ),
    'premium-bowknot-phone-case-with-detachable-pearl-bracelet': (
        'Clean Scandinavian minimalist EDC flatlay on warm matte off-white stone: accompanied ONLY by wireless matte-white earbuds in an open charging case and a simple silver keyring. Soft morning window light, crisp quiet luxury vibe. Strictly NO perfume bottles, NO rings, NO satin fabric, NO flowers.'
    ),
    'silicone-world-map-travel-phone-case-copy': (
        'Clean modern minimalist flatlay on light neutral limestone surface: accompanied ONLY by sleek minimalist sunglasses and a matte silver metal pen. Soft natural daylight shadows and generous breathing space. Strictly NO perfume bottles, NO rings, NO satin fabric, NO flowers.'
    ),
    'luxury-bow-pearl-chain-phone-case': (
        'Clean Scandinavian minimalist desk flatlay on pale bleached oak and soft matte stone: accompanied ONLY by wireless earbuds and minimal silver sunglasses in soft morning window light with natural architectural shadows. Strictly NO Dior/perfume bottles, NO gold jewelry, NO satin cloth, NO flowers.'
    ),
}

queue = []
idx = 0
for item in all_items:
    h = item['handle']
    if h not in TARGETS:
        continue
    idx += 1
    ps_src = item['packshot']
    webp_src = os.path.splitext(ps_src)[0] + '.webp'
    use_src = webp_src if os.path.exists(webp_src) else ps_src

    ref_jpg = os.path.abspath(os.path.join(REFS_DIR, f'mkt_{idx:02d}_{h[:25]}.jpg'))
    im = Image.open(use_src).convert('RGB').resize((768, 768), Image.Resampling.LANCZOS)
    im.save(ref_jpg, 'JPEG', quality=88)

    prompt = (
        f"Minimalist commercial top-down flatlay photograph in STRICT 1:1 SQUARE (1024x1024) showcasing the EXACT SAME phone case shown in the attached reference photo ({item['title']}):\n"
        f"- Product Fidelity: The phone case MUST be 100% IDENTICAL to the uploaded reference packshot (exact color, camera ring/plateau, textures, charms/bow/tube details, and proportions).\n"
        f"- Minimalist EDC Scene: {TARGETS[h]}\n"
        f"- Lighting & Style: Clean natural morning daylight with subtle soft window shadows. Uncluttered modern Scandinavian / Japanese D2C editorial aesthetic.\n"
        f"- CRITICAL: Absolutely NO perfume bottles, NO satin ripples, NO text, NO typography, NO brand labels, and NO watermarks."
    )

    queue.append({
        'index': idx,
        'handle': h,
        'title': item['title'],
        'ref_jpg': ref_jpg,
        'out_dir': os.path.abspath(item['out_dir']),
        'target_file': '05_marketing',
        'prompt': prompt
    })
    print(f"{idx:02d}. Prepared marketing cleanup for {h}")

with open('scripts/remaining_5_marketing.json', 'w', encoding='utf-8') as f:
    json.dump(queue, f, indent=2)
print("Saved scripts/remaining_5_marketing.json")
