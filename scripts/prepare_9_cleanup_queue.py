import json
import os
from PIL import Image

REFS_DIR = os.path.join('scripts', 'temp_cleanup_refs')
os.makedirs(REFS_DIR, exist_ok=True)

ITEMS = [
    {
        'id': 'leopard_01_packshot',
        'title': 'Leopard Print Clear Case (Clean Packshot)',
        'src_ref': 'assets/products/leopard-print-chic-transparent-phone-case/showcase/02_angle.webp',
        'out_webp': 'assets/products/leopard-print-chic-transparent-phone-case/amber-leopard/01_packshot.webp',
        'out_png': 'assets/products/leopard-print-chic-transparent-phone-case/amber-leopard/01_packshot.png',
        'size': 1024,
        'prompt': (
            "Ultra-clean e-commerce studio packshot photograph in STRICT 1:1 SQUARE (1024x1024) of the EXACT amber leopard-print transparent MagSafe/clear iPhone case shown in the attached reference photo:\n"
            "- Product Fidelity: Exact same iPhone 16 Pro / Pro Max clear TPU case with warm champagne-amber translucent tint and crisp black organic leopard spots across the entire backplate, raised clear camera bezel, and tactile clear side buttons.\n"
            "- IMPORTANT Cleanliness Rule: Straight-on upright vertical centered back view floating on a pure solid #FFFFFF white studio background with subtle soft natural contact shadow beneath the bottom edge. ZERO text labels, ZERO white rectangular brand patches, ZERO watermarks on the case back — just pure continuous seamless leopard spots across the entire backplate.\n"
            "- Lighting: Crisp commercial studio softbox photography, sharp specular acrylic highlights."
        ),
    },
    {
        'id': 'leopard_04_feature',
        'title': 'Leopard Print Clear Case (Studio Feature Infographic)',
        'src_ref': 'assets/products/leopard-print-chic-transparent-phone-case/showcase/02_angle.webp',
        'out_webp': 'assets/products/leopard-print-chic-transparent-phone-case/showcase/04_feature.webp',
        'out_png': 'assets/products/leopard-print-chic-transparent-phone-case/showcase/04_feature.png',
        'size': 1254,
        'prompt': (
            "Studio-designed commercial e-commerce feature infographic photograph in STRICT 1:1 SQUARE (1024x1024) for the EXACT amber leopard-print transparent iPhone case shown in the attached reference photo:\n"
            "- Product Fidelity: The iPhone and case MUST be 100% IDENTICAL to the uploaded reference photo (amber leopard spots on glossy transparent TPU case with raised clear camera frame). ZERO random brand labels or text patches printed on the case backplate.\n"
            "- Infographic Layout (Apple / Pitaka A+ Standard): Clean breathable architectural layout on a seamless soft light studio off-white backdrop (#F7F7F8). Position the main upright 3/4-angled phone case cleanly on the left/center, paired with 3 spaced crisp circular macro detail zoom-in insets on the right.\n"
            "- Integrated Studio Typography & Pointer Lines: Clean sans-serif dark charcoal (#0A0A0C) typography with tiny minimal orange (#FF5A18) accent dots and thin crisp leader pointer lines pointing accurately to each real feature:\n"
            "  Headline: \"Leopard Print Clear Armor\"\n"
            "  * 1.5mm Camera Bezel — Shields triple lens array\n"
            "  * Tactile Alloy Buttons — Crisp responsive click feel\n"
            "  * Anti-Yellow Clear TPU — UV-resistant glossy backplate\n"
            "- Ultra-clean whitespace, razor-sharp English spelling, NO stickers, NO badges, NO clutter."
        ),
    },
    {
        'id': 'mag_holder_05_extra',
        'title': 'Premium Magnetic Phone Holder (Clean Usage Studio)',
        'src_ref': 'assets/products/premium-magnetic-phone-holder-with-360-rotation-strong-adhesive-mount/space-black/01_packshot.webp',
        'out_webp': 'assets/products/premium-magnetic-phone-holder-with-360-rotation-strong-adhesive-mount/extra/05_extra.webp',
        'out_png': None,
        'size': 1024,
        'prompt': (
            "Clean luxury minimalist commercial photograph in STRICT 1:1 SQUARE (1024x1024) featuring the EXACT matte gunmetal aluminum 360-degree magnetic phone mount shown in the attached reference photo:\n"
            "- Product Fidelity: The mount MUST be 100% IDENTICAL to the uploaded reference photo (knurled metallic circular base, dual ball-joint pivot, matte black silicone magnetic face — without weird illegible edge gibberish).\n"
            "- Scene: Clean architectural real-life studio scene inside a dark matte dashboard/minimalist brushed slate wall mounting an iPhone effortlessly at a viewing angle in crisp soft natural daylight. Realistic aluminum texture, realistic magnetic snap grip.\n"
            "- STRICTLY NO futuristic neon glowing light rings, NO laser beams, NO superimposed marketing text, NO icons or collages."
        ),
    },
    {
        'id': 'foldable_03_extra',
        'title': 'Foldable Magnetic Phone Holder (Minimalist Desk Setup)',
        'src_ref': 'assets/products/foldable-magnetic-phone-holder-strong-magnet-suction-mount-for-desk-wall-car-dashboard-windshield-360-adjustable-rotation-vacuum-adsorption-stand/metallic-silver/01_packshot.webp',
        'out_webp': 'assets/products/foldable-magnetic-phone-holder-strong-magnet-suction-mount-for-desk-wall-car-dashboard-windshield-360-adjustable-rotation-vacuum-adsorption-stand/extra/03_extra.webp',
        'out_png': None,
        'size': 1024,
        'prompt': (
            "Clean Apple-store style editorial product photograph in STRICT 1:1 SQUARE (1024x1024) featuring the EXACT matte black anodized aluminum foldable vacuum suction magnetic phone stand shown in the attached reference photo:\n"
            "- Product Fidelity: Match the cylindrical knurled vacuum locking base, dual folding metallic hinge arm, and circular black magnetic ring face from the reference.\n"
            "- Scene: Standing firmly on a clean warm architectural oak wood desk surface beside a matte laptop corner, holding a titanium iPhone naturally in landscape ergonomic desk viewing angle under soft sunlit studio light.\n"
            "- STRICTLY ZERO text callouts, ZERO arrows, ZERO inset zoom badges, ZERO stickers."
        ),
    },
    {
        'id': 'foldable_04_extra',
        'title': 'Foldable Magnetic Phone Holder (Hinge & Ring Close-up)',
        'src_ref': 'assets/products/foldable-magnetic-phone-holder-strong-magnet-suction-mount-for-desk-wall-car-dashboard-windshield-360-adjustable-rotation-vacuum-adsorption-stand/metallic-silver/01_packshot.webp',
        'out_webp': 'assets/products/foldable-magnetic-phone-holder-strong-magnet-suction-mount-for-desk-wall-car-dashboard-windshield-360-adjustable-rotation-vacuum-adsorption-stand/extra/04_extra.webp',
        'out_png': None,
        'size': 1024,
        'prompt': (
            "Architectural macro studio photograph in STRICT 1:1 SQUARE (1024x1024) of the EXACT foldable black aluminum vacuum magnetic mount shown in the attached reference photo:\n"
            "- Show two sleek mounts side by side — one folded flat compactly and one extended open at a 45-degree dual-axis hinge angle — resting on a minimalist warm light gray travertine stone podium (#F4F4F5) with soft directional studio shadow.\n"
            "- Crisp machined knurling and clean anodized aluminum textures.\n"
            "- STRICTLY ZERO overlaid text, ZERO road thumbnails, ZERO lighting VFX or blue magnetic beams."
        ),
    },
    {
        'id': 'tempered_02_extra',
        'title': 'Tempered Glass Screen Protector (Clarity Macro)',
        'src_ref': 'assets/products/premium-tempered-glass-screen-protector-with-easy-installation-kit/ultra-clear/01_packshot.webp',
        'out_webp': 'assets/products/premium-tempered-glass-screen-protector-with-easy-installation-kit/extra/02_extra.webp',
        'out_png': None,
        'size': 1024,
        'prompt': (
            "Minimalist Apple-style commercial macro photograph in STRICT 1:1 SQUARE (1024x1024) illustrating an ultra-clear edge-to-edge 2.5D tempered glass screen protector hovering 3mm above a sleek Natural Titanium iPhone face-up on a seamless off-white stone surface (#F6F6F7).\n"
            "- Crystal clear glass sheet catching a subtle crisp studio edge reflection, clean dark bezels, pure natural softbox lighting.\n"
            "- STRICTLY ZERO explosion shards, ZERO hammers, ZERO yellow promotional text banners or logos."
        ),
    },
    {
        'id': 'tempered_03_extra',
        'title': 'Tempered Glass Screen Protector (Alignment Tray Kit)',
        'src_ref': 'assets/products/premium-tempered-glass-screen-protector-with-easy-installation-kit/ultra-clear/01_packshot.webp',
        'out_webp': 'assets/products/premium-tempered-glass-screen-protector-with-easy-installation-kit/extra/03_extra.webp',
        'out_png': None,
        'size': 1024,
        'prompt': (
            "Clean luxury overhead 3/4 flatlay studio photograph in STRICT 1:1 SQUARE (1024x1024) featuring the EXACT matte black auto-alignment screen protector installation frame box and ultra-clear glass film shown in the attached reference photo:\n"
            "- Show the sleek matte charcoal installation tray cleanly arranged beside a crystal-clear tempered glass screen and microfiber cloth on a bright neutral light stone studio tabletop.\n"
            "- Softbox editorial photography, natural shadows.\n"
            "- STRICTLY ZERO superimposed text overlays, ZERO yellow stickers, ZERO step-1/2 boxes."
        ),
    },
    {
        'id': 'privacy_01_extra',
        'title': 'Matte Frosted Privacy Glass (28-Deg Anti-Spy Angle)',
        'src_ref': 'assets/products/premium-matte-frosted-privacy-tempered-glass-screen-protector/matte-privacy/01_packshot.webp',
        'out_webp': 'assets/products/premium-matte-frosted-privacy-tempered-glass-screen-protector/extra/01_extra.webp',
        'out_png': None,
        'size': 1024,
        'prompt': (
            "Minimalist luxury editorial studio photograph in STRICT 1:1 SQUARE (1024x1024) demonstrating anti-spy privacy glass on two iPhones side by side on a clean warm travertine stone surface (#F5F5F7):\n"
            "- Left iPhone facing directly forward displays a sharp bright clean abstract iOS wallpaper clearly; right iPhone tilted slightly at a 35-degree side angle appears sleekly darkened matte black by the frosted privacy filter.\n"
            "- Subtle silky anti-glare matte finish under soft studio daylight.\n"
            "- STRICTLY ZERO marketing text headers, ZERO split comparison labels, ZERO bright green banners."
        ),
    },
    {
        'id': 'privacy_03_extra',
        'title': 'Matte Frosted Privacy Glass (Installation Tray Flatlay)',
        'src_ref': 'assets/products/premium-matte-frosted-privacy-tempered-glass-screen-protector/matte-privacy/01_packshot.webp',
        'out_webp': 'assets/products/premium-matte-frosted-privacy-tempered-glass-screen-protector/extra/03_extra.webp',
        'out_png': None,
        'size': 1024,
        'prompt': (
            "Clean minimalist product studio photograph in STRICT 1:1 SQUARE (1024x1024) showing the EXACT transparent dust-removal alignment applicator tray with a dark matte frosted privacy tempered glass screen protector lifted slightly above an iPhone on a clean light gray studio desk (#F6F6F7).\n"
            "- Smooth matte obsidian glass sheen with precision speaker mesh slot, realistic soft shadow.\n"
            "- STRICTLY ZERO neon green graphics, ZERO arrows, ZERO 'CORE UPGRADE' or text overlays."
        ),
    },
]

queue = []
for idx, it in enumerate(ITEMS, 1):
    ref_jpg = os.path.abspath(os.path.join(REFS_DIR, f"{idx:02d}_{it['id']}.jpg"))
    im = Image.open(it['src_ref']).convert('RGB').resize((768, 768), Image.Resampling.LANCZOS)
    im.save(ref_jpg, 'JPEG', quality=88)
    queue.append({
        'index': idx,
        'id': it['id'],
        'title': it['title'],
        'ref_jpg': ref_jpg,
        'out_webp': os.path.abspath(it['out_webp']),
        'out_png': os.path.abspath(it['out_png']) if it['out_png'] else None,
        'size': it['size'],
        'prompt': it['prompt'],
    })

out_json = os.path.join('scripts', 'cleanup_9_queue.json')
with open(out_json, 'w', encoding='utf-8') as f:
    json.dump(queue, f, indent=2)
print(f"Prepared {len(queue)} cleanup generation items -> {out_json}")
