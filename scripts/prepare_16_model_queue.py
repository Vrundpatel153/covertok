import json
import os
from PIL import Image

REFS_DIR = os.path.join('scripts', 'temp_refs')
os.makedirs(REFS_DIR, exist_ok=True)

with open('scripts/28_minimal_prompts.json', 'r', encoding='utf-8') as f:
    all_items = json.load(f)

COMPLETED = {
    'aluminium-frame-transparent-case',
    'crystal-studded-luxe-case-orange',
    'luxury-crossbody-wallet-phone-case',
    'luxury-steel-blue-heart-sparkle-phone-case-with-pearl-chain',
    'pastel-heart-print-soft-silicone-phone-case',
    'phone-cover-with-built-in-lip-balm-holder-copy-copy-6',
    'premium-bowknot-phone-case-with-detachable-pearl-bracelet',
    'premium-leather-finish-slim-case-with-metal-camera-ring',
    'silver-3d-love-heart-phone-case-copy',
    'transparent-magnetic-wireless-charging-phone-case',
    'ultra-clear-sideless-anti-yellow-back-case',
    'wavy-edge-transparent-shockproof-pastel-cover'
}

SCENES = {
    'luxury-quilted-crossbody-wallet-phone-case-copy-1': (
        'Cheerful young woman in her mid-20s wearing a cozy oatmeal knit sweater, standing in a sunlit minimalist apartment, holding the phone naturally at chest level so the back of the case, plush bear detail, and matching cream wrist strap are clearly visible.'
    ),
    'silicone-world-map-travel-phone-case-copy': (
        'Stylish young woman in her mid-20s wearing a soft ivory silk blouse in a bright, warm minimalist boutique, holding the phone casually at chest height clearly showing the pearlescent marbled case back and 3D pearl bow charm.'
    ),
    'ultra-thin-frosted-phone-cases-copy': (
        'Relaxed young man in his late 20s wearing a casual olive linen overshirt over a white crewneck t-shirt seated by a bright sunlit cafe window, holding the phone naturally so the matte world map back design is cleanly visible.'
    ),
    'trendy-graphic-phone-cases-copy': (
        'Modern young man in his late 20s wearing a clean charcoal wool crewneck sweater in an airy minimalist oak-and-concrete studio, casually holding the iPhone up showing the sleek translucent frosted-black back cover clearly.'
    ),
    'vibrant-frame-style-iphone-cases-copy': (
        'Friendly young woman in her 20s wearing an oversized cream cotton sweatshirt at a bright minimalist wooden coffee counter in soft morning daylight, holding the phone showing the graphic back design clearly beside a plain ceramic coffee cup.'
    ),
    'cute-bear-phone-case-with-plush-keychain-copy-1': (
        'Young woman in her 20s wearing a crisp white cotton t-shirt and light washed denim jacket outdoors on a softly sunlit minimalist city terrace, holding the vibrant yellow-bumper frosted clear phone case clearly angled toward the camera.'
    ),
    'luxury-quilted-crossbody-wallet-phone-case-copy': (
        'Warm, authentic young woman in her early 20s wearing a soft beige knit cardigan seated in a bright Scandinavian cafe, smiling naturally while holding the phone showing the bear graphic back and fluffy plush bear keychain clearly.'
    ),
    'silver-3d-love-heart-phone-case': (
        'Chic young woman in her mid-20s wearing a soft light-grey cashmere sweater in a sunlit minimalist bedroom/loft, holding the soft pink case with 3D metallic silver hearts naturally in front of her so the case back is tack-sharp.'
    ),
    'leopard-print-chic-transparent-phone-case': (
        'Fashionable young woman in her mid-20s wearing a relaxed tailored black blazer over a clean white t-shirt walking along a quiet sunlit stone street, holding the leopard-print transparent iPhone case clearly visible toward the camera.'
    ),
    'luxury-bow-pearl-chain-phone-case': (
        'Poised young woman in her mid-20s wearing a fitted black ribbed turtleneck in a sunlit minimalist studio, the pearl strap draped gently around her wrist while holding the black pearl-bow iPhone case clearly facing forward.'
    ),
    'magsafe-clear-case-for-iphone-13-to-16-series-supports-all-plus-pro-amp-pro-max-models-transparent-shockproof-cover': (
        'Clean-cut young man in his late 20s wearing a crisp white oxford cotton shirt with rolled sleeves in a bright modern glass-and-wood workspace, holding the iPhone naturally showing the crystal-clear MagSafe ring back cleanly.'
    ),
    'glow-edge-glow-in-dark-transparent-shockproof-clear-cover-with-bumper-camera-protection-for-iphone': (
        'Athletic young man in his mid-20s wearing a heather-grey cotton crewneck sweatshirt outdoors beside clean modern architecture in bright natural daylight, holding the neon-teal bumper clear iPhone case clearly toward the camera.'
    ),
    'premium-magsafe-case-cover-with-metal-camera-ring-shockproof-stylish-with-magnetic-charging-support': (
        'Confident young man in his early 30s wearing a dark charcoal overshirt over a white tee in a bright Scandinavian-style wood-accented studio, holding the matte smoke-black MagSafe case clearly angled to show the metal camera ring and magnetic circle.'
    ),
    'magsafe-compatible-transparent-iphone-case-ultra-clear-shockproof-back-cover-with-magnetic-ring': (
        'Natural young woman in her mid-20s wearing a relaxed sage-green linen button-down shirt sitting near a bright sunlit balcony window, holding the ultra-clear iPhone case with black MagSafe ring cleanly visible.'
    ),
    'untitled-27jul_18-46': (
        'Stylish woman in her late 20s wearing a crisp white linen shirt and cream trousers in a bright sunlit gallery interior, holding the sky-blue pebble-leather iPhone card-slot case clearly showing the gold hardware clasp.'
    ),
    'bumper-case': (
        'Minimalist young man in his late 20s wearing a fine black merino knit sweater in a bright, airy white-walled design studio, holding the ultra-thin black frameless bumper iPhone case cleanly in hand.'
    ),
}

queue = []
idx = 0
for item in all_items:
    h = item['handle']
    if h in COMPLETED:
        continue
    idx += 1
    # Use the actual webp primary_image from assets/products/<handle>/<default>/01_packshot.webp or fallback to item['packshot']
    ps_src = item['packshot']
    webp_src = os.path.splitext(ps_src)[0] + '.webp'
    use_src = webp_src if os.path.exists(webp_src) else ps_src

    ref_jpg = os.path.abspath(os.path.join(REFS_DIR, f'{idx:02d}_{h[:30]}.jpg'))
    im = Image.open(use_src).convert('RGB')
    im_small = im.resize((768, 768), Image.Resampling.LANCZOS)
    im_small.save(ref_jpg, 'JPEG', quality=88)

    scene = SCENES[h]
    prompt = (
        f"Authentic commercial lifestyle portrait photograph in STRICT 1:1 SQUARE (1024x1024) featuring the EXACT SAME phone case shown in the attached reference image ({item['title']}):\n"
        f"- Product Fidelity: The iPhone and phone case held by the model MUST look 100% IDENTICAL to the uploaded reference packshot (exact colors, camera bezel/cutouts, charms/straps/prints/rings, texture, and proportions). Keep the back of the phone case facing clearly toward the camera.\n"
        f"- Human Model & Realism: {scene} Captured on a 50mm lens at f/2.8 with genuine natural daylight, authentic human skin texture with real pores, subtle flyaway hair, natural hands and fingers gripping the phone realistically. Strictly NO plastic airbrushed AI skin, NO uncanny CGI glow, NO floating empty cases.\n"
        f"- Minimalist Aesthetic: Calm editorial e-commerce lifestyle photography (like Apple, Rhode, or Scandinavian minimalist tech brands). Soft neutral tones, clean uncluttered background.\n"
        f"- CRITICAL: Do NOT add any overlaid text, badges, watermarks, or extra fake brand logos. Pure clean lifestyle photograph only."
    )

    queue.append({
        'index': idx,
        'handle': h,
        'title': item['title'],
        'ref_jpg': ref_jpg,
        'out_dir': os.path.abspath(item['out_dir']),
        'prompt': prompt
    })
    print(f"{idx:02d}. Prepared {h} -> ref={os.path.basename(ref_jpg)} ({os.path.getsize(ref_jpg)//1024} KB)")

out_json = os.path.join('scripts', 'remaining_16_models.json')
with open(out_json, 'w', encoding='utf-8') as f:
    json.dump(queue, f, indent=2)
print(f"\nSaved {len(queue)} items to {out_json}")
