import json
import os
from PIL import Image
import apply_all_informative_typography as old_manifest

REFS_DIR = os.path.join('scripts', 'temp_feature_refs')
os.makedirs(REFS_DIR, exist_ok=True)

with open('scripts/28_minimal_prompts.json', 'r', encoding='utf-8') as f:
    all_items = json.load(f)

EXTRA_SPECS = {
    'bumper-case': {
        'title': 'Ultra-Thin Frameless Protection',
        'callouts': [
            '0.3mm Bare-Side Profile — Authentic iPhone frame feel',
            '2.5mm Raised Camera Guard — Elevated lens bezel ring',
            '4-Corner Shock Buffers — Reinforced drop absorption',
            'MagSafe Ready Core — Ultra-thin magnetic pass-through'
        ]
    },
    'leopard-print-chic-transparent-phone-case': {
        'title': 'Leopard Print Clear Armor',
        'callouts': [
            '1.5mm Raised Camera Bezel — Shields triple lens array',
            'Tactile Metallic Buttons — Crisp responsive click feel',
            'Anti-Yellow Clear TPU — UV-resistant glossy backplate',
            'Corner Air Cushions — Shock-dispersing drop corners'
        ]
    },
    'silver-3d-love-heart-phone-case': {
        'title': '3D Silver Heart & Matte Grip',
        'callouts': [
            '3D Chrome Heart Studs — Sculpted metallic raised accents',
            '1.5mm Raised Lens Bezel — Recessed camera glass armor',
            'Soft-Touch Matte TPU — Fingerprint-resistant grip frame',
            'Shock-Absorbing Corners — Everyday 10ft drop cushion'
        ]
    }
}

queue = []
for idx, item in enumerate(all_items, 1):
    h = item['handle']
    ps_src = item['packshot']
    webp_src = os.path.splitext(ps_src)[0] + '.webp'
    use_src = webp_src if os.path.exists(webp_src) else ps_src

    ref_jpg = os.path.abspath(os.path.join(REFS_DIR, f'feat_{idx:02d}_{h[:25]}.jpg'))
    im = Image.open(use_src).convert('RGB').resize((768, 768), Image.Resampling.LANCZOS)
    im.save(ref_jpg, 'JPEG', quality=88)

    if h in old_manifest.MANIFEST:
        m = old_manifest.MANIFEST[h]
        headline = m['title']
        bullets = [f"{c['title']} — {c['desc']}" for c in m['callouts']]
    else:
        m = EXTRA_SPECS[h]
        headline = m['title']
        bullets = m['callouts']

    bullets_str = '\n'.join(f"  * {b}" for b in bullets)
    prompt = (
        f"Studio-designed commercial e-commerce feature infographic photograph in STRICT 1:1 SQUARE (1024x1024) for the EXACT phone case shown in the attached reference photo ({item['title']}):\n"
        f"- Product Fidelity: The iPhone and case MUST be 100% IDENTICAL to the uploaded reference photo (matching exact colors, camera bezels, textures, logos/text if any like rhode, charms, straps, or MagSafe rings).\n"
        f"- Infographic Layout (Apple / Pitaka / Spigen A+ Standard): Clean architectural layout on a seamless pure off-white / soft light studio gray backdrop (#F7F7F8). Position the main 3/4-angled phone case cleanly alongside 2 crisp circular or rounded macro detail zoom-in insets (showing the camera bezel thickness, corner cushion, or surface texture) with balanced whitespace.\n"
        f"- Integrated Studio Typography & Pointer Lines: Clean sans-serif dark charcoal (#0A0A0C) typography with tiny minimal orange (#FF5A18) accent dots and thin crisp leader pointer lines pointing accurately to each real physical feature — NEVER slap rectangular white label boxes or stickers across the top/bottom edges, and NEVER overlap the phone case or camera lenses:\n"
        f"  Headline: \"{headline}\"\n"
        f"{bullets_str}\n"
        f"- Lighting & Craft: Crisp commercial softbox lighting, soft realistic ground contact shadow, ultra-sharp spelled-accurately English labels. Strictly NO heavy gradients, NO messy clutter, NO fake stock watermarks."
    )

    queue.append({
        'index': idx,
        'handle': h,
        'title': item['title'],
        'ref_jpg': ref_jpg,
        'out_dir': os.path.abspath(item['out_dir']),
        'prompt': prompt
    })

out_json = os.path.join('scripts', 'all_28_features_queue.json')
with open(out_json, 'w', encoding='utf-8') as f:
    json.dump(queue, f, indent=2)
print(f"Prepared {len(queue)} feature infographic prompts -> {out_json}")
