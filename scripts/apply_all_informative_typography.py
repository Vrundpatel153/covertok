import os, shutil
from PIL import Image, ImageDraw, ImageFont

# Complete specifications manifest for the 25 cases needing Amazon A+ typography
MANIFEST = {
    "aluminium-frame-transparent-case": {
        "badge": "AERO-GRADE ALLOY",
        "title": "CNC Aluminum Frame & Acrylic Back",
        "subtitle": "Rigid aircraft-grade aluminum alloy bumper with high-transparency tempered acrylic core.",
        "callouts": [
            {"title": "CNC Aluminum Frame", "desc": "Rigid structural drop shield"},
            {"title": "Tempered Clear Back", "desc": "Scratch & oil-resistant clarity"},
            {"title": "Internal TPU Liner", "desc": "Shock-absorbing cushion"}
        ]
    },
    "crystal-studded-luxe-case-orange": {
        "badge": "LUXURY CRAFT",
        "title": "Multi-Layer Shock & Scratch Defense",
        "subtitle": "Electroplated alloy bezel with hand-set crystals and 1.5mm camera lens shield.",
        "callouts": [
            {"title": "1.5mm Raised Bezel", "desc": "Full lens & screen armor"},
            {"title": "Multi-Layer TPU", "desc": "10ft drop shock absorption"},
            {"title": "Tactile Alloy Buttons", "desc": "Instant precision response"}
        ]
    },
    "cute-bear-phone-case-with-plush-keychain-copy-1": {
        "badge": "DUAL-TONE DESIGN",
        "title": "Vibrant Contrast Frame & Frosted Core",
        "subtitle": "High-contrast architectural perimeter bumper with anti-fingerprint frosted backplate.",
        "callouts": [
            {"title": "Vibrant Dual-Tone Trim", "desc": "High-contrast perimeter shield"},
            {"title": "Frosted Matte Core", "desc": "Resists smudges, sweat & oils"},
            {"title": "Air-Cushioned Corners", "desc": "Heavy-duty drop vibration buffer"}
        ]
    },
    "glow-edge-glow-in-dark-transparent-shockproof-clear-cover-with-bumper-camera-protection-for-iphone": {
        "badge": "LUMINESCENT GLOW",
        "title": "Glow-In-The-Dark Neon Bumper & Lens Shield",
        "subtitle": "Photoluminescent phosphor rim absorbs light and radiates bright neon in the dark.",
        "callouts": [
            {"title": "Phosphor Glow Rim", "desc": "Vibrant green nighttime radiance"},
            {"title": "Raised Lens Armor", "desc": "Guards triple camera sensors"},
            {"title": "Shock-Dispersing TPU", "desc": "10ft drop impact absorption"}
        ]
    },
    "luxury-bow-pearl-chain-phone-case": {
        "badge": "ARTISAN PEARL",
        "title": "Ribbon Bow Accent & Luminous Pearl Wristlet",
        "subtitle": "Dimensional ribbon bow motif with heavy-gauge detachable pearl wrist strap.",
        "callouts": [
            {"title": "3D Sculpted Bow", "desc": "Dimensional metallic centerpiece"},
            {"title": "Detachable Pearl Chain", "desc": "Steel-core woven beaded wristlet"},
            {"title": "360° Shockproof TPU", "desc": "Reinforced anti-drop border"}
        ]
    },
    "luxury-crossbody-wallet-phone-case": {
        "badge": "CROSSBODY WALLET",
        "title": "Quilted Faux Leather Wallet & Gold Chain",
        "subtitle": "Diamond-stitched RFID card organizer with a 48-inch woven gold crossbody strap.",
        "callouts": [
            {"title": "Dual-Card Organizer", "desc": "Secure snap-closure card slot"},
            {"title": "48\" Gold Crossbody", "desc": "Detachable hands-free carry"},
            {"title": "Reinforced Lens Bezel", "desc": "Elevated camera protection"}
        ]
    },
    "luxury-quilted-crossbody-wallet-phone-case-copy-1": {
        "badge": "KAWAII LUXE",
        "title": "Plush Bear Charm & Vegan Leather Back",
        "subtitle": "Embossed artisan teddy bear sketch on warm vegan microfiber leather with lanyard.",
        "callouts": [
            {"title": "Plush Bear Accent", "desc": "Hand-stitched textured teddy"},
            {"title": "Vegan Leather Finish", "desc": "Warm, smudge-proof grip"},
            {"title": "Wrist Lanyard Strap", "desc": "Secure anti-drop handling"}
        ]
    },
    "luxury-quilted-crossbody-wallet-phone-case-copy": {
        "badge": "CHARM EDITION",
        "title": "Silicone Bear Case with Detachable Plush Charm",
        "subtitle": "Velvety liquid silicone case paired with a fluffy stuffed teddy bear keychain charm.",
        "callouts": [
            {"title": "Fluffy Bear Charm", "desc": "Detachable braided tether"},
            {"title": "Liquid Silicone Shell", "desc": "Shock-absorbing soft-touch hold"},
            {"title": "Precision Port Cutouts", "desc": "Full access to speakers & USB-C"}
        ]
    },
    "luxury-steel-blue-heart-sparkle-phone-case-with-pearl-chain": {
        "badge": "SPARKLE JEWELRY",
        "title": "Steel Blue Heart Sparkle with Pearl Lanyard",
        "subtitle": "Iridescent glitter heart gems set on slate blue TPU with detachable pearl bracelet.",
        "callouts": [
            {"title": "Glitter Heart Gems", "desc": "Multi-angle sparkling crystal accents"},
            {"title": "Pearl Wrist Bracelet", "desc": "Polished high-luster pearl chain"},
            {"title": "Corner Air-Cushions", "desc": "Reinforced everyday drop defense"}
        ]
    },
    "magsafe-clear-case-for-iphone-13-to-16-series-supports-all-plus-pro-amp-pro-max-models-transparent-shockproof-cover": {
        "badge": "MAGSAFE COMPATIBLE",
        "title": "38-Magnet Fast Wireless Charging & Clarity",
        "subtitle": "Built-in N52 neodymium magnetic ring array for 15W MagSafe charging & accessories.",
        "callouts": [
            {"title": "38 N52 Magnets", "desc": "Ultra-strong magnetic snap alignment"},
            {"title": "Anti-Yellow Acrylic", "desc": "Crystal clarity that resists UV rays"},
            {"title": "Air-Pocket Corners", "desc": "10ft military drop protection"}
        ]
    },
    "magsafe-compatible-transparent-iphone-case-ultra-clear-shockproof-back-cover-with-magnetic-ring": {
        "badge": "LIFETIME CLARITY",
        "title": "Anti-Yellow MagSafe Crystal Back Cover",
        "subtitle": "Molecular anti-oxidation layer prevents yellowing with seamless magnetic charging.",
        "callouts": [
            {"title": "Lifetime Anti-Yellow", "desc": "UV-resistant polymer stays clear"},
            {"title": "MagSafe Compatibility", "desc": "Supports all chargers & wallets"},
            {"title": "Shock-Proof Armor", "desc": "Disperses impacts from 10ft drops"}
        ]
    },
    "pastel-heart-print-soft-silicone-phone-case": {
        "badge": "SOFT SILICONE",
        "title": "Pastel Heart Print & Velvety Silicone Body",
        "subtitle": "All-over pastel heart pattern with fingerprint-resistant silky silicone texture.",
        "callouts": [
            {"title": "Laser-Bonded Hearts", "desc": "Fade-proof, scratch-proof print"},
            {"title": "Velvet Microfiber Core", "desc": "Inner lining prevents phone scuffs"},
            {"title": "1.2mm Raised Lips", "desc": "Shields camera glass and screen"}
        ]
    },
    "phone-cover-with-built-in-lip-balm-holder-copy-copy-6": {
        "badge": "RHODE COMPATIBLE",
        "title": "Soft Liquid Silicone With Lip Balm Cradle",
        "subtitle": "Custom-molded pocket securely holds Rhode lip treatment with soft velvet lining.",
        "callouts": [
            {"title": "Custom Balm Pocket", "desc": "Secure, drop-proof fit"},
            {"title": "Liquid Silicone Body", "desc": "Silky soft ergonomic grip"},
            {"title": "Microfiber Interior", "desc": "Gentle zero-scratch cushion"}
        ]
    },
    "premium-bowknot-phone-case-with-detachable-pearl-bracelet": {
        "badge": "PEARL BRACELET",
        "title": "Metallic Bow Accent & Detachable Pearl Chain",
        "subtitle": "High-shine sculpted bowknot on pebble-grained vegan leather with pearl wrist strap.",
        "callouts": [
            {"title": "Sculpted Metal Bow", "desc": "High-shine chrome accent"},
            {"title": "Detachable Pearl Chain", "desc": "Durable steel-wire strung pearls"},
            {"title": "Grained Leather Touch", "desc": "Comfortable non-slip everyday hold"}
        ]
    },
    "premium-leather-finish-slim-case-with-metal-camera-ring": {
        "badge": "VEGAN LEATHER",
        "title": "Grained Microfiber Leather & Metal Lens Ring",
        "subtitle": "Supple vegan leather finish paired with an aerospace-grade alloy camera protector.",
        "callouts": [
            {"title": "Microfiber Vegan Leather", "desc": "Luxurious grained tactile feel"},
            {"title": "CNC Metal Lens Ring", "desc": "2.0mm raised camera defense"},
            {"title": "Slim 1.3mm Profile", "desc": "Featherlight pocket-friendly fit"}
        ]
    },
    "premium-magsafe-case-cover-with-metal-camera-ring-shockproof-stylish-with-magnetic-charging-support": {
        "badge": "MAGSAFE ALLOY",
        "title": "MagSafe Fast Charging & CNC Metal Camera Ring",
        "subtitle": "Strong integrated magnetic ring with elevated aluminum alloy camera lens frame.",
        "callouts": [
            {"title": "Strong Magnetic Ring", "desc": "Instant MagSafe lock for charging"},
            {"title": "Alloy Camera Ring", "desc": "CNC-machined elevated lip"},
            {"title": "Matte Frosted Armor", "desc": "Shockproof TPU absorbs drops"}
        ]
    },
    "silicone-world-map-travel-phone-case-copy": {
        "badge": "HOLOGRAPHIC PRISM",
        "title": "Prism Bow Glitter Shell & Pearl Wristlet",
        "subtitle": "Light-refracting holographic glitter bow with a detachable heavy-gauge pearl chain.",
        "callouts": [
            {"title": "3D Prism Bow Accent", "desc": "Holographic multi-angle sparkle"},
            {"title": "Detachable Pearl Lanyard", "desc": "Hands-free wristlet security"},
            {"title": "Shockproof Clear TPU", "desc": "Crystal clarity with drop cushions"}
        ]
    },
    "silver-3d-love-heart-phone-case-copy": {
        "badge": "CROSSBODY WALLET",
        "title": "Cream Quilted Wallet Case & Gold Crossbody",
        "subtitle": "Luxe diamond-quilted faux leather with card organizer and gold link chain.",
        "callouts": [
            {"title": "RFID Card Storage", "desc": "Holds 2 cards with secure snap"},
            {"title": "48\" Gold Crossbody", "desc": "Detachable hands-free wear"},
            {"title": "Reinforced Lens Lip", "desc": "Elevated camera protection"}
        ]
    },
    "transparent-magnetic-wireless-charging-phone-case": {
        "badge": "MAGSAFE COMPATIBLE",
        "title": "38-Magnet Fast Charge & Drop Armor",
        "subtitle": "Optical-grade anti-yellowing acrylic back with reinforced air-cushion corners.",
        "callouts": [
            {"title": "38 MagSafe Magnets", "desc": "Instant wireless charging snap"},
            {"title": "Optical Clear Acrylic", "desc": "UV non-yellowing backplate"},
            {"title": "10ft Military Drop", "desc": "Reinforced 1.2mm screen lips"}
        ]
    },
    "trendy-graphic-phone-cases-copy": {
        "badge": "MINIMALIST MATTE",
        "title": "Ultra-Slim 0.8mm Frosted Translucent Case",
        "subtitle": "Featherlight micro-sandblasted finish resists fingerprints, smudges, and oils.",
        "callouts": [
            {"title": "0.8mm Ultra-Slim", "desc": "Naked iPhone form factor feel"},
            {"title": "Micro-Sandblast Matte", "desc": "100% smudge & fingerprint proof"},
            {"title": "Raised Camera Bezel", "desc": "0.8mm elevated lens buffer"}
        ]
    },
    "ultra-clear-sideless-anti-yellow-back-case": {
        "badge": "BARE METAL TOUCH",
        "title": "Sideless Frameless Grip & Clear Backplate",
        "subtitle": "Exposed side rails provide authentic bare-phone tactile feel with drop cushions.",
        "callouts": [
            {"title": "Sideless Architecture", "desc": "True bare iPhone side rail touch"},
            {"title": "Anti-Yellow Acrylic", "desc": "Optical-grade UV-resistant back"},
            {"title": "4-Corner Drop Cushions", "desc": "Air-bag impact dispersion"}
        ]
    },
    "ultra-thin-frosted-phone-cases-copy": {
        "badge": "TRAVEL EDITION",
        "title": "World Map Cartography & Matte Silicone",
        "subtitle": "Laser-etched flight path and world map graphics on warm matte-finish silicone.",
        "callouts": [
            {"title": "Laser-Etched Map", "desc": "High-definition travel art"},
            {"title": "Matte Silicone Body", "desc": "Silky grip, zero fingerprints"},
            {"title": "Screen & Camera Lip", "desc": "1.2mm raised surface guard"}
        ]
    },
    "untitled-27jul_18-46": {
        "badge": "EXECUTIVE LEATHER",
        "title": "Vegan Grain Leather with Quick-Tap Card Slot",
        "subtitle": "Handcrafted saddle-stitched vegan leather with integrated magnetic card pocket.",
        "callouts": [
            {"title": "Quick-Tap Card Slot", "desc": "Holds transit & credit cards"},
            {"title": "Vegan Grain Leather", "desc": "Warm, non-slip luxury texture"},
            {"title": "Independent Alloy Keys", "desc": "Crisp tactile button feedback"}
        ]
    },
    "vibrant-frame-style-iphone-cases-copy": {
        "badge": "POP-ART GRAPHIC",
        "title": "High-Gloss Designer Graphic & Drop Armor",
        "subtitle": "Scratch-resistant coated pop-art graphic backplate with shock-absorbing TPU bumper.",
        "callouts": [
            {"title": "Scratch-Proof Gloss", "desc": "UV-sealed vibrant artwork"},
            {"title": "Shock-Absorbing TPU", "desc": "Full perimeter drop defense"},
            {"title": "1.5mm Camera Ring", "desc": "Elevated lens & screen safety"}
        ]
    },
    "wavy-edge-transparent-shockproof-pastel-cover": {
        "badge": "ERGONOMIC WAVY",
        "title": "Scalloped Wavy Grip & Clear Acrylic Core",
        "subtitle": "Ergonomic wavy finger-groove edges deliver anti-slip handling and drop defense.",
        "callouts": [
            {"title": "Ergonomic Wavy Edge", "desc": "Contoured non-slip finger grip"},
            {"title": "Pastel Shock Bumper", "desc": "Cushions drop impacts safely"},
            {"title": "Crystal Clear Core", "desc": "Reveals original iPhone finish"}
        ]
    }
}

def render_informative_overlay(base_im, badge_text, title_text, subtitle_text, callouts):
    w, h = base_im.size # 1254 x 1254
    scale = 2
    canvas_w = w * scale
    canvas_h = h * scale
    
    overlay = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    font_title = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 40 * scale)
    font_badge = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 18 * scale)
    font_sub = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 23 * scale)
    font_callout_title = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 22 * scale)
    font_callout_desc = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 19 * scale)
    
    # 1. Top Header Card (Sleek Compact Glass Card)
    hx = 50 * scale
    hy = 35 * scale
    hw = canvas_w - (100 * scale)
    hh = 145 * scale
    
    # Soft drop shadow
    for r in range(4, 0, -1):
        draw.rounded_rectangle(
            [hx - r*scale, hy - r*scale, hx + hw + r*scale, hy + hh + r*scale],
            radius=18*scale,
            fill=(0, 0, 0, int(10 / r))
        )
    # Glass surface
    draw.rounded_rectangle(
        [hx, hy, hx + hw, hy + hh],
        radius=16*scale,
        fill=(255, 255, 255, 246),
        outline=(228, 224, 218, 255),
        width=2*scale
    )
    
    # Eyebrow Badge
    bx = hx + 24 * scale
    by = hy + 18 * scale
    b_bbox = draw.textbbox((0, 0), badge_text, font=font_badge)
    bw = (b_bbox[2] - b_bbox[0]) + 20 * scale
    bh = 28 * scale
    draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=6*scale, fill=(245, 130, 32, 235))
    draw.text((bx + 10*scale, by + 4*scale), badge_text, font=font_badge, fill=(255, 255, 255, 255))
    
    # Main Title
    tx = bx
    ty = by + bh + 8 * scale
    draw.text((tx, ty), title_text, font=font_title, fill=(20, 18, 16, 255))
    
    # Subtitle
    sx = tx
    sy = ty + 46 * scale
    draw.text((sx, sy), subtitle_text, font=font_sub, fill=(85, 80, 75, 255))
    
    # 2. Bottom Callout Badges (3 horizontal cards)
    callout_y = canvas_h - (115 * scale)
    num_callouts = len(callouts)
    gap = 18 * scale
    total_avail_w = canvas_w - (100 * scale)
    cw = int((total_avail_w - (gap * (num_callouts - 1))) / num_callouts)
    ch = 76 * scale
    
    for i, c in enumerate(callouts):
        cx = (50 * scale) + i * (cw + gap)
        # Drop shadow
        for r in range(3, 0, -1):
            draw.rounded_rectangle(
                [cx - r*scale, callout_y - r*scale, cx + cw + r*scale, callout_y + ch + r*scale],
                radius=16*scale,
                fill=(0, 0, 0, int(8 / r))
            )
        # Card body
        draw.rounded_rectangle(
            [cx, callout_y, cx + cw, callout_y + ch],
            radius=14*scale,
            fill=(255, 255, 255, 248),
            outline=(225, 220, 212, 255),
            width=2*scale
        )
        
        # Accent icon dot
        dot_x = cx + 18 * scale
        dot_y = callout_y + 24 * scale
        draw.ellipse([dot_x, dot_y, dot_x + 9*scale, dot_y + 9*scale], fill=(245, 130, 32, 255))
        
        # Text
        text_x = dot_x + 16 * scale
        draw.text((text_x, callout_y + 14 * scale), c['title'], font=font_callout_title, fill=(20, 18, 16, 255))
        draw.text((text_x, callout_y + 40 * scale), c['desc'], font=font_callout_desc, fill=(95, 90, 85, 255))

    overlay_down = overlay.resize((w, h), Image.Resampling.LANCZOS)
    return Image.alpha_composite(base_im.convert('RGBA'), overlay_down).convert('RGB')

def process_all():
    print(f"Starting informative typography processing for {len(MANIFEST)} products...")
    success_count = 0
    
    for handle, meta in MANIFEST.items():
        prod_dir = os.path.join('assets', 'products', handle, 'showcase')
        webp_path = os.path.join(prod_dir, '04_feature.webp')
        png_path = os.path.join(prod_dir, '04_feature.png')
        
        if not os.path.exists(webp_path):
            print(f"[MISSING] {webp_path}")
            continue
            
        # Backup raw original if not already backed up
        raw_webp = os.path.join(prod_dir, '04_feature_raw.webp')
        raw_png = os.path.join(prod_dir, '04_feature_raw.png')
        if not os.path.exists(raw_webp):
            shutil.copy2(webp_path, raw_webp)
        if os.path.exists(png_path) and not os.path.exists(raw_png):
            shutil.copy2(png_path, raw_png)
            
        # Read from raw if available, else from webp
        source_path = raw_webp if os.path.exists(raw_webp) else webp_path
        base_im = Image.open(source_path)
        
        # Render overlay
        final_im = render_informative_overlay(
            base_im,
            meta['badge'],
            meta['title'],
            meta['subtitle'],
            meta['callouts']
        )
        
        # Save both webp and png
        final_im.save(webp_path, 'WEBP', quality=95)
        final_im.save(png_path, 'PNG')
        success_count += 1
        print(f"[{success_count:02d}/{len(MANIFEST)}] Updated {handle} (webp: {os.path.getsize(webp_path):,} bytes, png: {os.path.getsize(png_path):,} bytes)")

    print(f"\nCompleted! Successfully processed {success_count}/{len(MANIFEST)} products.")

if __name__ == '__main__':
    process_all()
