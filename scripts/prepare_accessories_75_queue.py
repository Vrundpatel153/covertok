import json
import os
from PIL import Image

REFS_DIR = os.path.join('scripts', 'temp_acc75_refs')
os.makedirs(REFS_DIR, exist_ok=True)

# Bespoke engineering specs & physical fidelities for all 15 mobile accessory / charger products
SPECS = {
    'premium-magnetic-phone-holder-with-360-rotation-strong-adhesive-mount': {
        'title': 'Magnetic 360° Adhesive Mount',
        'desc': 'matte black aluminum ball-joint 360-degree magnetic dashboard & wall mount with knurled base and black silicone magnetic face',
        'model_scene': 'a real human hand in warm car cabin daylight effortlessly snapping a titanium iPhone onto the exact black knurled 360-degree magnetic dashboard mount attached to a clean dark leather car console',
        'macro_focus': 'machined knurled aluminum base ring, dual-axis ball-joint pivot neck, and silky matte black magnetic pad face',
        'headline': '360° Magnetic Swivel Mount',
        'bullets': [
            'Dual-Axis Ball Joint — Smooth 360° portrait & landscape tilt',
            'N52 Magnet Array — Vibration-proof dash & wall lock',
            'CNC Alloy Housing — Knurled gunmetal grip base',
        ],
    },
    'ribbed-knit-phone-sling-pouch': {
        'title': 'Ribbed Knit Phone Sling Pouch',
        'desc': 'cobalt royal blue vertical stretchy ribbed-knit minimalist crossbody sleeve pouch cradling an iPhone inside the upper cutout slot',
        'model_scene': 'a stylish young person outdoors in natural overcast city light holding/wearing the exact royal blue ribbed-knit vertical phone sling pouch with an iPhone neatly tucked inside the knit pocket',
        'macro_focus': 'dense tactile 3D vertical ribbed-knit yarn weave stitches, reinforced slit opening seam, and snug stretch pocket cradling the iPhone camera corners',
        'headline': '3D Knit Hands-Free Carry',
        'bullets': [
            'Stretch Ribbed Weave — Breathable shock-cushioned yarn',
            'Split-Access Opening — Quick camera & screen reach',
            'Seamless Tubular Knit — Lightweight everyday sling fit',
        ],
    },
    'pearl-phone-charm-with-airplane-bow-design': {
        'title': 'Pearl Charm With Airplane & Bow',
        'desc': 'lustrous cream pearl beaded wrist strap charm featuring a sparkling gold crystal-set bow knot, butterfly accent, gold key ring clasp, and dainty gold airplane charm',
        'model_scene': 'a young woman outdoors in soft sunlit cafe light holding her iPhone naturally with the exact cream pearl wrist strap, gold bowknot accent, and tiny gold airplane pendant draped over her wrist',
        'macro_focus': 'lustrous cream glass pearls on reinforced cord beside the paved crystal gold bow link, tiny gold key ring clasp, and sculpted gold airplane charm',
        'headline': 'Pearl & Travel Charm Lanyard',
        'bullets': [
            'High-Luster Pearls — Smooth cream beaded wrist loop',
            'Micro-Pavé Bow Link — Gold alloy sculptural centerpiece',
            'Reinforced Clasp Ring — Rust-proof swivel hook tether',
        ],
    },
    'multi-color-silicone-suction-grips-phone-holder-with-kickstand': {
        'title': 'Silicone Suction Grip & Stand',
        'desc': 'matte charcoal black rectangular 24-cup silicone suction phone grip pad with an integrated fold-out rigid flip kickstand bar at the bottom',
        'model_scene': 'a person at a sunlit modern kitchen/desk sticking their iPhone onto a smooth glass mirror or tilting it on the matte black 24-cup silicone suction grip kickstand for hands-free viewing',
        'macro_focus': 'precision 24 micro-suction silicone cup craters and the flush-hinged flip-out matte black kickstand latch',
        'headline': '24-Cup Suction & Flip Stand',
        'bullets': [
            '24 Nano-Suction Cups — Instant hands-free mirror & glass grip',
            'Integrated Kickstand — Flush folding horizontal desk stand',
            'Soft-Touch Silicone — Washable residue-free adhesive',
        ],
    },
    'magnetic-wireless-power-bank-ultra-sleek-5000mah-10000-mah': {
        'title': 'Magnetic Wireless Power Bank',
        'desc': 'ultra-slim brushed matte black anodized aluminum COVERTOK MagSafe wireless power bank with subtle crisp LED percentage display (82%) at bottom',
        'model_scene': 'a real hand holding a matte black titanium iPhone with the ultra-slim brushed black aluminum COVERTOK magnetic wireless power bank snapped cleanly onto the back in crisp daylight coffee shop ambiance',
        'macro_focus': 'brushed space-black anodized aluminum chamfered body edge, crisp minimalist COVERTOK wordmark, and glowing 82% LED charge readout',
        'headline': 'Ultra-Slim Magnetic Power',
        'bullets': [
            'Snap-On 15W Wireless — Auto-aligned MagSafe charging',
            'Anodized Alloy Shell — Pocket-thin thermal dissipation',
            'Digital LED Display — Instant live battery percentage',
        ],
    },
    'premium-tempered-glass-screen-protector-with-easy-installation-kit': {
        'title': 'Tempered Glass With Alignment Kit',
        'desc': 'ultra-clear 2.5D edge-to-edge 9H tempered glass screen protector paired with its sleek matte black precision auto-alignment installation tray frame',
        'model_scene': 'a person sitting at a clean bright minimalist desk naturally aligning the matte black installation applicator frame onto an iPhone screen in soft morning window light',
        'macro_focus': 'floating 2.5D beveled crystal-clear glass sheet hover-aligned millimeter above an iPhone titanium display catching subtle specular rim light',
        'headline': '9H Crystal Clarity & Auto Tray',
        'bullets': [
            '9H Tempered Sapphire — Impact & scratch-proof defense',
            'Dust-Free Alignment Kit — Bubble-free 5-second apply',
            '2.5D Oleophobic Coat — Zero fingerprint smudge glide',
        ],
    },
    'premium-matte-frosted-privacy-tempered-glass-screen-protector': {
        'title': '28° Frosted Privacy Glass',
        'desc': 'anti-glare 28-degree frosted matte privacy tempered glass screen protector paired with its crystal transparent easy dust-removal alignment applicator frame',
        'model_scene': 'a commuter holding an iPhone clad in the silky matte frosted privacy glass outdoors in bright natural daylight, showing crisp screen legibility straight on while blocking side glare',
        'macro_focus': 'micro-etched frosted anti-glare obsidian glass surface with top speaker dust-mesh cutout and ultra-thin tempered bevel edge',
        'headline': '28° Anti-Spy Matte Defense',
        'bullets': [
            '28° Privacy Louver — Side views blacked out instantly',
            'Silk-Frosted Matte — Zero harsh sunlight glare & smudges',
            'Dust-Removal Frame — Automatic precision self-align',
        ],
    },
    'silicone-suction-phone-grip-pad': {
        'title': 'Silicone Suction Phone Grip Pad',
        'desc': 'vibrant matte orange rectangular 24-cup peel-and-stick silicone suction phone grip pad mounted neatly on the back of a matte black iPhone case',
        'model_scene': 'a young creator in bright natural apartment daylight mounting their black iPhone onto a tiled bathroom mirror using the vibrant orange 24-cup silicone suction pad on the case back',
        'macro_focus': 'precision symmetrical orange silicone suction cup cavities catching soft side light against a clean matte black iPhone back',
        'headline': '24-Cup Peel & Stick Grip',
        'bullets': [
            '24 High-Hold Cups — Locks to mirrors, glass & tiles',
            'Washable Silicone — Rinse to restore full suction grip',
            '3M Peel Backing — Secure bond to smooth cases',
        ],
    },
    'magsafe-wallet-with-kickstand': {
        'title': 'MagSafe Wallet With Kickstand',
        'desc': 'sleek matte black fine-grain vegan leather MagSafe snap-on card wallet featuring a centered fold-out hinged vertical kickstand leg and top thumb slot',
        'model_scene': 'a person at a clean architectural oak desk using the matte black vegan leather MagSafe wallet flipped open as a vertical kickstand holding their titanium iPhone upright in warm daylight',
        'macro_focus': 'fine-grain matte black vegan leather perimeter stitching, precision metal hinge on the folding kickstand leg, and clean white card thumb cutout',
        'headline': 'Snap-On Wallet & Stand',
        'bullets': [
            'Folding Hinge Stand — Portrait & landscape hands-free view',
            '3-Card Secure Vault — Internal tension grip rails',
            'N52 MagSafe Lock — Snaps securely onto iPhone & cases',
        ],
    },
    'magsafe-leather-card-holder-snap-on-wallet': {
        'title': 'MagSafe Leather Card Holder',
        'desc': 'ultra-slim vibrant tangerine orange fine-grain vegan leather MagSafe snap-on wallet card sleeve with rounded top card pull tab and bottom push cutout',
        'model_scene': 'a real hand casually holding a matte black titanium iPhone with the slim tangerine orange vegan leather MagSafe card sleeve snapped flat onto the back in sunlit urban setting',
        'macro_focus': 'rich pebble-grain orange vegan leather edges, twin-needle saddle stitching, and smooth lower thumb-push card eject slot',
        'headline': 'Ultra-Slim MagSafe Sleeve',
        'bullets': [
            '1.8mm Slim Profile — Zero pocket bulk everyday carry',
            'Fine-Grain Leather — Tactile stain-resistant finish',
            'Quick-Eject Slot — Instant one-thumb card access',
        ],
    },
    'magsafe-wireless-charger-usb-c': {
        'title': 'MagSafe Wireless Charger USB-C',
        'desc': 'minimalist anodized silver aluminum magnetic wireless charging puck with clean white silicone charging pad and braided white USB-C cable',
        'model_scene': 'a real hand placing a titanium iPhone onto the sleek aluminum & white MagSafe wireless charger puck resting on a clean wood nightstand in soft morning window light',
        'macro_focus': 'chamfered brushed aluminum puck bezel meeting the matte white magnetic contact pad and strain-relieved white USB-C cord joint',
        'headline': '15W Snap-On Magnetic Puck',
        'bullets': [
            'Precision Coil Lock — Self-centering MagSafe alignment',
            'Braided USB-C Cord — Flexible tangle-free 1.5m reach',
            'Thermal Shield Pad — Cool & steady overnight fast charge',
        ],
    },
    '39w-7-1a-fast-car-charger-dual-usb-smart-charging-adapter-for-cigarette-lighter-compact-design-high-speed-charging-universal-compatibility': {
        'title': '39W+ 7.1A Fast Dual Car Charger',
        'desc': 'compact gloss black metallic-collar 12V car cigarette-lighter adapter featuring glowing orange Dual QC3.0 USB-A ports, a bottom PD 39W USB-C port, and subtle 39W+7.1A spec marking',
        'model_scene': 'a driver hand in clean daylight plugging a white braided USB-C cable into the compact black Dual QC3.0 + PD 39W fast car charger inside a modern minimalist dark car center console',
        'macro_focus': 'angled close-up of the glowing orange Dual QC 3.0 USB ports beside the PD USB-C fast port and knurled metallic tension collar',
        'headline': '39W+ Dual USB-A & PD Hub',
        'bullets': [
            'Tri-Port 39W+ Output — Dual QC3.0 + PD fast charge',
            'Smart IC Chip — Over-current & surge temperature guard',
            'Anti-Slip Tension — Stays locked on bumpy roads',
        ],
    },
    '100w-fast-charging-mini-alloy-car-charger-hidden-dual-port-car-adapter-with-pull-ring-design-for-cigarette-lighter-compact-portable-easy-to-carry-charge': {
        'title': '100W Mini Alloy Car Charger',
        'desc': 'ultra-tiny flush-fit brushed gunmetal titanium zinc-alloy mini car charger adapter with twin flush charging ports and recessed fold-out pull ring',
        'model_scene': 'a person sitting inside a luxury dark leather car cockpit lightly lifting the tiny flush-fit gunmetal zinc-alloy mini 100W car charger pull-ring cleanly out of the 12V console socket',
        'macro_focus': 'precision CNC-brushed titanium zinc-alloy cylinder body, dual recessed high-power ports, and crisp flush-folding stainless pull tab',
        'headline': '100W Flush Mini Alloy Hub',
        'bullets': [
            'Thumb-Size Flush Fit — Sits invisible inside car socket',
            '100W Dual Output — Powers laptops & iPhones fast',
            'Zinc-Alloy Body — Rapid heat dispersion & zero plastic',
        ],
    },
    'foldable-magnetic-phone-holder-strong-magnet-suction-mount-for-desk-wall-car-dashboard-windshield-360-adjustable-rotation-vacuum-adsorption-stand': {
        'title': 'Foldable Vacuum Magnetic Stand',
        'desc': 'matte black anodized aluminum vacuum-suction magnetic phone mount with cylindrical knurled locking base, dual-axis folding hinge arm, and circular black magnetic head',
        'model_scene': 'a creator sitting at a warm walnut studio desk adjusting the matte black knurled dual-axis folding vacuum magnetic stand holding an iPhone horizontally beside a laptop',
        'macro_focus': 'machined vertical knurling around the twist-lock vacuum base, exposed brushed steel hinge pin, and matte soft-touch magnetic face',
        'headline': 'Dual-Axis Vacuum Pro Stand',
        'bullets': [
            'Twist-Lock Vacuum — Zero-residue suction on desk & glass',
            'Dual-Axis Alloy Arm — Foldable pocket-compact articulation',
            'N52 Magnetic Head — Instant single-hand MagSafe snap',
        ],
    },
    '3-in-1-wireless-charger-magsafe-compatible-fast-charging-station-for-iphone-16-16-plus-16-pro-16-pro-max-15-15-plus-15-pro-15-pro-max-14-13-12-series-airpods-3rd-2nd-gen-apple-watch-series-9-8-7-6-5-4-se-black': {
        'title': '3-in-1 Foldable Charging Dock',
        'desc': 'sleek matte charcoal black foldable 3-in-1 wireless charging pad featuring left magnetic lightning-icon iPhone pad, pop-up center circular Apple Watch puck, and right AirPods charging pad',
        'model_scene': 'someone in a clean sunlit modern bedroom nightstand scene setting their iPhone, Apple Watch, and AirPods onto the sleek matte black 3-in-1 foldable wireless charging station',
        'macro_focus': 'matte soft-touch charcoal polymer body showing the precision raised hinge Watch puck, subtle white LED charge indicators, and slim folding seam',
        'headline': '3-in-1 Travel Fast Charger',
        'bullets': [
            'Simultaneous 3-Device — iPhone, Watch & AirPods together',
            'Pop-Up Watch Puck — Folds flat for effortless travel',
            'Slim Soft-Touch Deck — Non-slip desk nightstand dock',
        ],
    },
}

with open('assets/products_data.js', 'r', encoding='utf-8') as f:
    txt = f.read()
prods = json.loads(txt[txt.find('['):txt.rfind(']') + 1])

targets = [p for p in prods if p.get('category') in ('other-accessories', 'charger-and-cables')]
assert len(targets) == 15, f"Expected 15 targets, got {len(targets)}"

queue = []
idx = 0
for p_idx, p in enumerate(targets, 1):
    h = p['handle']
    sp = SPECS[h]
    prim = p['primary_image'].split('?')[0].lstrip('/')
    out_dir = os.path.abspath(os.path.join('assets', 'products', h, 'showcase'))
    os.makedirs(out_dir, exist_ok=True)

    ref_jpg = os.path.abspath(os.path.join(REFS_DIR, f"{p_idx:02d}_{h[:28]}.jpg"))
    im = Image.open(prim).convert('RGB').resize((768, 768), Image.Resampling.LANCZOS)
    im.save(ref_jpg, 'JPEG', quality=88)

    bullets_str = '\n'.join(f"  * {b}" for b in sp['bullets'])

    roles = [
        ('01_model', (
            f"Authentic candid lifestyle photograph in STRICT 1:1 SQUARE (1024x1024) featuring the EXACT product shown in the attached reference photo ({sp['title']}):\n"
            f"- CRITICAL PRODUCT FIDELITY: The product MUST be 100% IDENTICAL to the uploaded reference photo ({sp['desc']}). Do NOT alter its shape, color, ports, logo, or mechanism.\n"
            f"- Realistic Scene: {sp['model_scene']}.\n"
            f"- Realism: Natural unretouched skin pores, real ambient window light, shallow depth of field, authentic everyday interaction. STRICTLY ZERO text overlays or AI watermarks."
        )),
        ('02_angle', (
            f"Ultra-clean minimalist commercial e-commerce 3/4 isometric product angle photograph in STRICT 1:1 SQUARE (1024x1024) featuring the EXACT product shown in the attached reference photo ({sp['title']}):\n"
            f"- CRITICAL PRODUCT FIDELITY: Match the exact hardware, colors, cutouts, and material finish ({sp['desc']}) cleanly from an elevated 3/4 studio perspective.\n"
            f"- Background: Pure solid #FFFFFF studio white backdrop with subtle soft natural ground contact shadow.\n"
            f"- STRICTLY NO extra props, NO text labels, NO callout badges, NO boxes."
        )),
        ('03_quality', (
            f"EXTREME TIGHT MACRO CLOSE-UP studio product photograph in STRICT 1:1 SQUARE (1024x1024) cropped closely onto ONLY a key craftsmanship section of the EXACT product shown in the reference photo ({sp['title']}):\n"
            f"- DO NOT show the entire product from far away! Fill 85% of the square frame at a 45-degree studio macro angle showing: {sp['macro_focus']}.\n"
            f"- Lighting & Craft: Crisp raking softbox lighting on clean off-white studio background (#F5F5F7), revealing real physical textures and finishes. STRICTLY ZERO text overlays."
        )),
        ('04_feature', (
            f"Studio-designed commercial e-commerce feature infographic photograph in STRICT 1:1 SQUARE (1024x1024) featuring the EXACT product shown in the attached reference photo ({sp['title']}):\n"
            f"- Product Fidelity: Product MUST match 100% of the uploaded reference photo ({sp['desc']}).\n"
            f"- Infographic Layout (Apple / Pitaka A+ Standard): Clean architectural layout on seamless soft light studio gray backdrop (#F7F7F8). Position the main 3/4-angled product cleanly alongside 3 spaced circular macro detail zoom-in insets with generous whitespace.\n"
            f"- Integrated Studio Typography & Pointer Lines: Clean sans-serif dark charcoal (#0A0A0C) typography with tiny minimal orange (#FF5A18) accent bar/dots and thin crisp pointer lines pointing accurately to real physical parts (NEVER place white rectangular label stickers over the product):\n"
            f"  Headline: \"{sp['headline']}\"\n"
            f"{bullets_str}\n"
            f"- Crystal-clear accurately spelled English text, ZERO clutter, ZERO promotional seals."
        )),
        ('05_marketing', (
            f"Minimalist luxury editorial overhead everyday-carry (EDC) flatlay photograph in STRICT 1:1 SQUARE (1024x1024) featuring the EXACT product shown in the attached reference photo ({sp['title']}):\n"
            f"- Product Fidelity: Exact same {sp['desc']} placed neatly as the hero object.\n"
            f"- Minimalist Props: Arranged calmly on warm sunlit travertine limestone or light oak desk alongside subtle curated Apple tech props (sleek iPhone corner, matte wireless earbuds, notebook edge, or sunglasses), crisp natural morning window shadows.\n"
            f"- STRICTLY ZERO superimposed text, NO banners, NO clutter."
        )),
    ]

    for role, prompt in roles:
        idx += 1
        queue.append({
            'index': idx,
            'prod_index': p_idx,
            'handle': h,
            'title': sp['title'],
            'role': role,
            'ref_jpg': ref_jpg,
            'out_dir': out_dir,
            'prompt': prompt,
        })

out_json = os.path.join('scripts', 'accessories_75_queue.json')
with open(out_json, 'w', encoding='utf-8') as f:
    json.dump(queue, f, indent=2)
print(f"Prepared {len(queue)} prompts ({len(targets)} accessories x 5 showcase roles) -> {out_json}")
