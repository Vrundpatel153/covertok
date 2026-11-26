import json
import os
from PIL import Image

REFS_DIR = os.path.join('scripts', 'temp_fidelity_refs')
os.makedirs(REFS_DIR, exist_ok=True)

ITEMS = [
    {
        'id': '03_crystal_luxe_01_model',
        'handle': 'crystal-studded-luxe-case-orange',
        'role': '01_model',
        'src_ref': 'assets/products/crystal-studded-luxe-case-orange/cosmic-orange/01_packshot.webp',
        'out_dir': 'assets/products/crystal-studded-luxe-case-orange/showcase',
        'prompt': (
            "Authentic candid lifestyle portrait photograph in STRICT 1:1 SQUARE (1024x1024) of a stylish young woman holding the EXACT iPhone case shown in the attached reference photo:\n"
            "- CRITICAL PRODUCT FIDELITY: Hold the phone with the BACK OF THE CASE facing directly toward the camera (do NOT show the screen, and do NOT make the backplate black!). The backplate MUST be crystal-clear glossy TRANSPARENT acrylic over a clean silver/white iPhone back, featuring the exact orange electroplated perimeter frame, the exact row of sparkling white crystal rhinestones around the camera module bezel, and the exact open C-shaped silver/crystal rhinestone MagSafe ring with vertical alignment bar.\n"
            "- Human & Scene: Natural warm afternoon window light inside a serene beige minimalist living room or cafe. Realistic natural human skin texture with subtle pores, authentic hand grip, relaxed linen knitwear.\n"
            "- STRICTLY NO studio plastic glow, NO overlaid text, NO watermarks."
        ),
    },
    {
        'id': '05_leather_slim_01_model',
        'handle': 'premium-leather-finish-slim-case-with-metal-camera-ring',
        'role': '01_model',
        'src_ref': 'assets/products/premium-leather-finish-slim-case-with-metal-camera-ring/black/01_packshot.webp',
        'out_dir': 'assets/products/premium-leather-finish-slim-case-with-metal-camera-ring/showcase',
        'prompt': (
            "Authentic candid lifestyle portrait photograph in STRICT 1:1 SQUARE (1024x1024) of a well-dressed man in a charcoal knit polo holding an iPhone clad in the EXACT case shown in the attached reference photo:\n"
            "- CRITICAL PRODUCT FIDELITY: Hold the phone with the BACK OF THE CASE facing clearly toward the camera (do NOT show only the side or front screen!). Show the exact deep matte jet-black micro-grain pebbled vegan leather back with its crisp brushed silver CNC metallic camera bezel ring and silver triple-lens accent frame.\n"
            "- Scene & Realism: Warm architectural daylight in a modern walnut study, natural relaxed posture, unretouched human skin texture, sharp focus on the leather texture and metallic bezel.\n"
            "- STRICTLY NO watermarks, NO overlaid text."
        ),
    },
    {
        'id': '05_leather_slim_03_quality',
        'handle': 'premium-leather-finish-slim-case-with-metal-camera-ring',
        'role': '03_quality',
        'src_ref': 'assets/products/premium-leather-finish-slim-case-with-metal-camera-ring/black/01_packshot.webp',
        'out_dir': 'assets/products/premium-leather-finish-slim-case-with-metal-camera-ring/showcase',
        'prompt': (
            "EXTREME TIGHT MACRO CLOSE-UP studio product photograph in STRICT 1:1 SQUARE (1024x1024) tightly cropped onto ONLY the upper camera corner and leather surface of the EXACT black iPhone case shown in the reference photo:\n"
            "- DO NOT show the full phone from afar! Fill 85% of the frame at an angled 45-degree macro zoom showing the machined silver aluminum raised camera lens ring bezel, fine-grain matte black vegan leather surface pores, and precision side edge chamfers on a clean light gray studio backdrop (#F4F4F5).\n"
            "- Sharp raking softbox lighting revealing crisp tactile leather grain and brushed metal sheen. Zero text overlays."
        ),
    },
    {
        'id': '06_aluminium_frame_01_model',
        'handle': 'aluminium-frame-transparent-case',
        'role': '01_model',
        'src_ref': 'assets/products/aluminium-frame-transparent-case/cosmic-orange/01_packshot.webp',
        'out_dir': 'assets/products/aluminium-frame-transparent-case/showcase',
        'prompt': (
            "Authentic candid lifestyle portrait photograph in STRICT 1:1 SQUARE (1024x1024) of a young man holding the EXACT Cosmic Orange iPhone case shown in the attached reference photo:\n"
            "- CRITICAL PRODUCT FIDELITY: The back of the case MUST face the camera cleanly and match 100%: a solid frosted matte warm-orange backplate framed by a sleek anodized metallic Cosmic Orange aluminum bumper and the distinctive full-width integrated orange aluminum camera island cover plate (DO NOT show a clear transparent silver iPhone back or black MagSafe ring lines!).\n"
            "- Human & Scene: Natural daylight studio loft / bright modern workspace, clean white tee under overshirt, natural skin texture and authentic hand grip.\n"
            "- Zero text overlays."
        ),
    },
    {
        'id': '09_bowknot_01_model',
        'handle': 'premium-bowknot-phone-case-with-detachable-pearl-bracelet',
        'role': '01_model',
        'src_ref': 'assets/products/premium-bowknot-phone-case-with-detachable-pearl-bracelet/off-white/01_packshot.webp',
        'out_dir': 'assets/products/premium-bowknot-phone-case-with-detachable-pearl-bracelet/showcase',
        'prompt': (
            "Authentic candid lifestyle portrait photograph in STRICT 1:1 SQUARE (1024x1024) of a smiling woman in an ivory cream boucle coat holding an iPhone clad in the EXACT case shown in the attached reference photo:\n"
            "- CRITICAL PRODUCT FIDELITY: Hold the phone so the BACK OF THE CASE clearly faces the camera (NEVER show the front phone screen!). Match EVERY SINGLE DETAIL of the attached reference case: pebbled cream-ivory vegan leather back framed by a sleek black protective border, a 3D iridescent pearl-finish sculpted bow fixed on the upper center back, the vertical cream leather snap rivet tab near the bottom, and the attached large cream pearl beaded bracelet wristlet plus delicate gold wire bow charm dangling from the bottom gold clasp ring (DO NOT invent a fabric silk ribbon!).\n"
            "- Scene & Realism: Soft Paris street daylight, natural unretouched human skin texture, natural hand hold around the phone sides with pearl wrist strap draped lightly.\n"
            "- Zero overlaid text or logos."
        ),
    },
    {
        'id': '09_bowknot_03_quality',
        'handle': 'premium-bowknot-phone-case-with-detachable-pearl-bracelet',
        'role': '03_quality',
        'src_ref': 'assets/products/premium-bowknot-phone-case-with-detachable-pearl-bracelet/off-white/01_packshot.webp',
        'out_dir': 'assets/products/premium-bowknot-phone-case-with-detachable-pearl-bracelet/showcase',
        'prompt': (
            "EXTREME TIGHT MACRO CLOSE-UP studio photograph in STRICT 1:1 SQUARE (1024x1024) zoomed closely onto the lower-center craftsmanship of the EXACT off-white leather bowknot phone case shown in the attached reference photo:\n"
            "- DO NOT show the full phone from far away! Fill 85% of the frame at an angled 45-degree studio macro angle showing the pebbled cream vegan leather grain, the lustrous 3D sculpted iridescent bow, the brushed gold snap rivet leather tab, and the gold clasp ring holding the creamy pearls and gold wire bow charm on a bright clean studio surface (#F5F5F7).\n"
            "- Crisp luxury jewelry-grade studio lighting, shallow depth of field, zero text."
        ),
    },
    {
        'id': '10_pastel_heart_05_marketing',
        'handle': 'pastel-heart-print-soft-silicone-phone-case',
        'role': '05_marketing',
        'src_ref': 'assets/products/pastel-heart-print-soft-silicone-phone-case/ivory-hearts/01_packshot.webp',
        'out_dir': 'assets/products/pastel-heart-print-soft-silicone-phone-case/showcase',
        'prompt': (
            "Minimalist editorial overhead everyday-carry flatlay photograph in STRICT 1:1 SQUARE (1024x1024) featuring the EXACT IVORY / CREAM colored phone case shown in the attached reference photo:\n"
            "- CRITICAL COLOR MATCH: The case MUST remain soft IVORY CREAM matte silicone with tiny delicate muted taupe/silver micro-hearts printed evenly across the back (DO NOT change the case color to pink!).\n"
            "- Minimalist Props: Resting cleanly on warm sunlit cream travertine stone beside crisp white wireless earbuds, minimalist tortoise sunglasses, and a linen notebook edge.\n"
            "- Soft natural morning window shadows, realistic matte silicone texture, zero text banners."
        ),
    },
    {
        'id': '11_bear_crossbody_03_quality',
        'handle': 'luxury-quilted-crossbody-wallet-phone-case-copy-1',
        'role': '03_quality',
        'src_ref': 'assets/products/luxury-quilted-crossbody-wallet-phone-case-copy-1/black/01_packshot.webp',
        'out_dir': 'assets/products/luxury-quilted-crossbody-wallet-phone-case-copy-1/showcase',
        'prompt': (
            "EXTREME TIGHT MACRO CLOSE-UP studio photograph in STRICT 1:1 SQUARE (1024x1024) tightly cropped onto the plush 3D teddy bear emblem and lower hardware of the EXACT cream phone case shown in the reference photo:\n"
            "- DO NOT show the full case and full long strap from afar! Fill 85% of the frame at a 45-degree angled macro studio shot highlighting the fluffy curly fleece 3D teddy bear stitched firmly onto the pebbled cream vegan leather back, plus the stitched card pocket tab and brushed gold D-ring lanyard hardware on clean off-white studio ground (#F6F6F7).\n"
            "- Rich tactile textile detail, crisp lighting, zero text overlays."
        ),
    },
    {
        'id': '14_smoky_matte_03_quality',
        'handle': 'trendy-graphic-phone-cases-copy',
        'role': '03_quality',
        'src_ref': 'assets/products/trendy-graphic-phone-cases-copy/frost-black/01_packshot.webp',
        'out_dir': 'assets/products/trendy-graphic-phone-cases-copy/showcase',
        'prompt': (
            "EXTREME TIGHT MACRO CLOSE-UP studio photograph in STRICT 1:1 SQUARE (1024x1024) tightly cropped onto the upper camera corner and edge profile of the EXACT smoky translucent matte charcoal-black iPhone case shown in the reference photo:\n"
            "- DO NOT show the full upright phone from afar! Fill 85% of the frame at an angled 3/4 macro perspective showing the ultra-thin 0.8mm sandblasted smoky frosted surface, raised protective camera bezel lip around the dual lenses, subtle translucent Apple logo glimpse beneath, and tactile side buttons on a clean bright light gray studio backdrop (#F4F4F5).\n"
            "- Crisp Apple hardware photography style, zero text."
        ),
    },
    {
        'id': '17_caramel_bear_03_quality',
        'handle': 'luxury-quilted-crossbody-wallet-phone-case-copy',
        'role': '03_quality',
        'src_ref': 'assets/products/luxury-quilted-crossbody-wallet-phone-case-copy/warm-caramel/01_packshot.webp',
        'out_dir': 'assets/products/luxury-quilted-crossbody-wallet-phone-case-copy/showcase',
        'prompt': (
            "EXTREME TIGHT MACRO CLOSE-UP studio photograph in STRICT 1:1 SQUARE (1024x1024) cropped closely onto the lower-right corner and fluffy bear keychain of the EXACT warm-tan caramel silicone iPhone case shown in the reference photo:\n"
            "- DO NOT show the full case from afar! Fill 85% of the frame at a 45-degree studio macro angle showing the smooth warm-tan matte silicone case body with clean black ink minimalist bear line-art, dark brown raised camera bumper edge, and the soft fluffy golden-brown plush teddy bear pom-pom charm resting cleanly beside the corner on a soft studio surface (#F6F6F7).\n"
            "- Rich plush fur texture, zero text."
        ),
    },
    {
        'id': '18_cream_wallet_chain_03_quality',
        'handle': 'silver-3d-love-heart-phone-case-copy',
        'role': '03_quality',
        'src_ref': 'assets/products/silver-3d-love-heart-phone-case-copy/espresso-brown/01_packshot.webp',
        'out_dir': 'assets/products/silver-3d-love-heart-phone-case-copy/showcase',
        'prompt': (
            "EXTREME TIGHT MACRO CLOSE-UP studio photograph in STRICT 1:1 SQUARE (1024x1024) cropped tightly onto the cognac leather mini-bag pocket flap, gold lock clasp, and pearl camera studs of the EXACT cream crossbody wallet iPhone case shown in the reference photo:\n"
            "- DO NOT show the full long chain from afar! Fill 85% of the frame at a 45-degree studio macro angle showcasing the stitched caramel-brown leather pocket flap, mirror-polished gold lock hardware, cream pebbled leather back, small twin pearl studs next to the camera, and gold woven leather-chain links on clean #F6F6F7 studio surface.\n"
            "- Razor-sharp stitching & metal reflections, zero text overlays."
        ),
    },
    {
        'id': '28_bumper_02_angle',
        'handle': 'bumper-case',
        'role': '02_angle',
        'src_ref': 'assets/products/bumper-case/black/01_packshot.webp',
        'out_dir': 'assets/products/bumper-case/showcase',
        'prompt': (
            "Ultra-clean minimalist e-commerce 3/4 isometric studio angle product photograph in STRICT 1:1 SQUARE (1024x1024) of the EXACT Matte BLACK frameless modular bumper iPhone case shown in the attached reference photo:\n"
            "- CRITICAL COLOR FIDELITY: Show the MATTE JET BLACK anodized modular bumper case (matching the attached black iPhone 16 Pro Titanium Black back — DO NOT make it blue!).\n"
            "- Show a clean sleek 3/4 floating isometric view of the assembled slim black corner & camera armor bumper mounted snugly onto a matte Space Black iPhone over a pure solid #FFFFFF white studio background with crisp soft ground shadow.\n"
            "- Zero floating exploded arrows or text."
        ),
    },
    {
        'id': '28_bumper_03_quality',
        'handle': 'bumper-case',
        'role': '03_quality',
        'src_ref': 'assets/products/bumper-case/black/01_packshot.webp',
        'out_dir': 'assets/products/bumper-case/showcase',
        'prompt': (
            "EXTREME TIGHT MACRO CLOSE-UP studio product photograph in STRICT 1:1 SQUARE (1024x1024) tightly cropped onto ONLY the upper camera bezel armor corner of the EXACT Matte BLACK frameless bumper iPhone case shown in the reference photo:\n"
            "- CRITICAL COLOR FIDELITY: MATTE JET BLACK corner guard & camera lens surround mounted on a dark Space Black titanium iPhone frame (DO NOT make it blue!).\n"
            "- Highlight the 2.5mm raised CNC black camera armor ring, bare uncovered titanium side rails, and shock-absorbing matte black corner lip on a clean light gray studio surface (#F4F4F5).\n"
            "- Ultra-sharp metallic and matte polymer textures, zero text."
        ),
    },
    {
        'id': '28_bumper_05_marketing',
        'handle': 'bumper-case',
        'role': '05_marketing',
        'src_ref': 'assets/products/bumper-case/black/01_packshot.webp',
        'out_dir': 'assets/products/bumper-case/showcase',
        'prompt': (
            "Minimalist luxury editorial overhead everyday-carry flatlay photograph in STRICT 1:1 SQUARE (1024x1024) featuring the EXACT Matte BLACK frameless modular bumper iPhone case shown in the attached reference photo:\n"
            "- CRITICAL COLOR FIDELITY: MATTE JET BLACK corner & camera-island bumper case on a dark Space Black iPhone (DO NOT make it blue!).\n"
            "- Scene: Clean architectural flatlay on light warm concrete/limestone desk surface beside a brushed titanium mechanical watch, black wireless earbuds case, and sleek metal pen in soft natural morning sunlight.\n"
            "- Crisp realistic materials and shadows, zero text overlays."
        ),
    },
]

queue = []
for idx, it in enumerate(ITEMS, 1):
    ref_jpg = os.path.abspath(os.path.join(REFS_DIR, f"{idx:02d}_{it['id']}.jpg"))
    im = Image.open(it['src_ref']).convert('RGB').resize((768, 768), Image.Resampling.LANCZOS)
    im.save(ref_jpg, 'JPEG', quality=88)
    out_dir = os.path.abspath(it['out_dir'])
    queue.append({
        'index': idx,
        'id': it['id'],
        'handle': it['handle'],
        'role': it['role'],
        'ref_jpg': ref_jpg,
        'out_webp': os.path.join(out_dir, f"{it['role']}.webp"),
        'out_png': os.path.join(out_dir, f"{it['role']}.png"),
        'size': 1254,
        'prompt': it['prompt'],
    })

out_json = os.path.join('scripts', 'fidelity_14_queue.json')
with open(out_json, 'w', encoding='utf-8') as f:
    json.dump(queue, f, indent=2)
print(f"Prepared {len(queue)} fidelity repair prompts -> {out_json}")
