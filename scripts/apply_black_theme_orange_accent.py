import os
import re

# Intentional ACCENT-ONLY selector markers (where crisp International Orange #FF5A18 should remain as minimal accent)
ACCENT_SELECTORS = (
    '.bento-kicker-dot',
    '.bento-ticker-dot',
    '.status-dot',
    '.story-eyebrow-dot',
    '.cart-bundle-badge-dot',
    '.combo-dot.filled',
    '.hero-dot.active',
    '.nav-link.active::after',
    '.hero-kicker-gold',
    '.hero-text-signature',
    '.bento-heading-accent',
    '.bento-kicker',
    '.bento-ticker-tag',
    '.fl-eyebrow',
    '.fl-headline-accent',
    '.fl-offer-tag',
    '.fl-offer-save-badge',
    '.hardware-eyebrow-tag',
    '.drops-eyebrow-pill',
    '.instagram-eyebrow-text',
    '.faq-kicker-tag',
    '.pdp-brand-tag',
    '.pdp-urgency-fire',
    '.txt-accent',
    '.txt-badge',
    '.cart-bundle-badge-label',
    '.cart-savings-text',
    '.cart-milestone-lbl-bold',
    '.cart-milestone-btm-highlight',
    '.popular-eyebrow-line',
    '.option-check',
)


def is_accent_context(selector, line):
    s = (selector + ' ' + line).lower()
    for a in ACCENT_SELECTORS:
        if a in s:
            return True
    return False


def replace_colors_to_black(line, is_accent=False, selector=''):
    # Preserve root comments / tokens properly
    if is_accent:
        # Standardize accent color to #FF5A18, while keeping dark-card pills clean & turning light-card eyebrow pills neutral zinc!
        if re.search(r'\bbackground(?:-color)?\s*:', line, re.I) and any(k in selector.lower() for k in ('eyebrow', 'faq-kicker')):
            line = re.sub(r'rgba\(\s*(?:255\s*,\s*85\s*,\s*0|255\s*,\s*90\s*,\s*24|255\s*,\s*122\s*,\s*48|231\s*,\s*114\s*,\s*66)\s*,\s*[0-9.]+\)', 'rgba(10, 10, 12, 0.06)', line)
        elif 'border' in line.lower() and ('rgba(' in line.lower()) and not any(k in selector.lower() for k in ('txt-badge', 'save-badge')):
            line = re.sub(r'rgba\(\s*(?:255\s*,\s*85\s*,\s*0|255\s*,\s*90\s*,\s*24|255\s*,\s*122\s*,\s*48|231\s*,\s*114\s*,\s*66)\s*,\s*[0-9.]+\)', 'rgba(10, 10, 12, 0.16)', line)
        else:
            line = re.sub(r'#ff5500\b|#e77242\b|#ff7a30\b|#e5a87b\b|#ff8f60\b', '#FF5A18', line, flags=re.I)
            line = re.sub(r'rgba\(\s*(?:255\s*,\s*85\s*,\s*0|231\s*,\s*114\s*,\s*66|229\s*,\s*168\s*,\s*123|255\s*,\s*122\s*,\s*48)\s*,', 'rgba(255, 90, 24,', line)
        return line

    # Non-accent (theme body, buttons, hovers, shadows, borders, light tints, dark shades) -> Black & Shades!
    # 1. Hover dark orange / bright orange gradients & backgrounds
    line = re.sub(r'linear-gradient\([^)]*#(?:ff8a00|ff7733|ff5500|ff5a18|ffaa00)[^)]*\)',
                  'linear-gradient(135deg, #0A0A0C 0%, #27272A 100%)', line, flags=re.I)
    line = re.sub(r'radial-gradient\(circle at center,\s*rgba\(255,\s*255,\s*255,\s*0\.85\)[^)]*rgba\(255,\s*85,\s*0[^)]+\)[^)]*\)',
                  'radial-gradient(circle at center, rgba(255, 255, 255, 0.85) 0%, rgba(244, 244, 245, 0.5) 45%, rgba(10, 10, 12, 0.08) 70%, transparent 82%)', line, flags=re.I)
    line = re.sub(r'radial-gradient\(circle,\s*rgba\(255,\s*85,\s*0[^)]*\)[^)]*\)',
                  'radial-gradient(circle, rgba(10, 10, 12, 0.07) 0%, rgba(10, 10, 12, 0) 70%)', line, flags=re.I)
    line = re.sub(r'linear-gradient\(135deg,\s*#FFFFFF\s*0%,\s*#E7D5A4\s*100%\)', '#FFFFFF', line, flags=re.I)
    line = re.sub(r'linear-gradient\(145deg,\s*#FFFFFF\s*0%,\s*#FFF[89]F5\s*100%\)',
                  'linear-gradient(145deg, #FFFFFF 0%, #F4F4F5 100%)', line, flags=re.I)

    # 2. Specific dark/medium/light orange shades -> black & zinc/charcoal shades
    replacements = [
        # Light peach/orange backgrounds -> soft cool zinc/neutral slate
        (r'#fff7ed\b', '#F4F4F5'),
        (r'#fff0e8\b', '#F4F4F5'),
        (r'#fff3eb\b', '#F4F4F5'),
        (r'#fff9f5\b', '#F4F4F5'),
        (r'#fff8f5\b', '#F4F4F5'),
        (r'#fbebe3\b', '#F4F4F5'),
        (r'#ffedd5\b', '#E4E4E7'),
        (r'#ffd9c6\b', '#E4E4E7'),
        (r'#ffd8c2\b', '#D4D4D8'),
        (r'#f8d8b6\b', '#0A0A0C'),   # btn-peach -> solid obsidian black
        (r'#e8ba87\b', '#0A0A0C'),   # heroExploreArrow -> solid obsidian black
        (r'#d89858\b', '#27272A'),   # heroExploreArrow:hover -> charcoal black
        (r'#eacaa6\b', '#FFFFFF'),   # combo-slot.filled on dark card -> crisp white
        (r'#e7d5a4\b', '#F4F4F5'),
        (r'#fde3b8\b', '#E4E4E7'),
        # Deep brown/orange-rust text -> jet/charcoal black
        (r'#9a3412\b', '#18181B'),
        (r'#7c2d12\b', '#0A0A0C'),
        (r'#ea580c\b', '#18181B'),
        (r'#63431d\b', '#18181B'),
        (r'#735238\b', '#27272A'),
        (r'#9f5927\b', '#27272A'),
        (r'#925833\b', '#27272A'),
        (r'#2d2721\b', '#18181B'),
        (r'#786b61\b', '#52525B'),
        (r'#5c5249\b', '#3F3F46'),
        (r'#6d6359\b', '#52525B'),
        (r'#706458\b', '#52525B'),
        (r'#4a443e\b', '#27272A'),
        (r'#4b423a\b', '#27272A'),
        (r'#4a4036\b', '#27272A'),
        (r'#524b43\b', '#27272A'),
        (r'#5a554e\b', '#3F3F46'),
        (r'#9e948a\b', '#71717A'),
        (r'#8c827a\b', '#71717A'),
        (r'#8c8278\b', '#71717A'),
        # Primary bright oranges & hover oranges -> Black / Charcoal shades!
        (r'var\(--color-accent,\s*#FF5500\)', '#18181B'),
        (r'var\(--brand-orange,\s*#E77242\)', '#0A0A0C'),
        (r'#e64d00\b', '#27272A'),
        (r'#e0480c\b', '#27272A'),
        (r'#ff6826\b', '#18181B'),
        (r'#ff8a00\b', '#18181B'),
        (r'#ff7733\b', '#27272A'),
        (r'#ff7a30\b', '#18181B'),
        (r'#ff8f60\b', '#A1A1AA'),
        (r'#e5a87b\b', '#18181B'),
        (r'#e77242\b', '#18181B'),
        (r'#ff5500\b', '#0A0A0C'),
        (r'#ff5a18\b', '#0A0A0C'),
    ]
    for pat, repl in replacements:
        line = re.sub(pat, repl, line, flags=re.I)

    # 3. RGBA orange/amber/gold-brown shadows & translucent borders -> Black/Obsidian RGBA
    line = re.sub(
        r'rgba\(\s*(?:255\s*,\s*85\s*,\s*0|255\s*,\s*90\s*,\s*24|231\s*,\s*114\s*,\s*66|234\s*,\s*88\s*,\s*12|255\s*,\s*122\s*,\s*48|230\s*,\s*77\s*,\s*0|255\s*,\s*138\s*,\s*0|169\s*,\s*129\s*,\s*53|229\s*,\s*168\s*,\s*123|220\s*,\s*185\s*,\s*135|234\s*,\s*202\s*,\s*166|159\s*,\s*89\s*,\s*39|154\s*,\s*105\s*,\s*75)\s*,',
        'rgba(10, 10, 12,',
        line
    )
    return line


def process_css(path):
    lines = open(path, 'r', encoding='utf-8', errors='ignore').read().splitlines()
    out = []
    curr_sel = ''
    in_root = False
    changed = 0
    for i, orig in enumerate(lines):
        line = orig
        st = line.strip()
        if ':root' in st and '{' in st:
            in_root = True
        if '}' in st:
            if in_root:
                in_root = False
        if '{' in st and not st.startswith('/*'):
            curr_sel = st.split('{')[0].strip()

        if in_root:
            # Handle CSS custom properties carefully
            if '--color-accent:' in line or '--color-orange:' in line:
                line = line.replace('#FF5500', '#FF5A18')
            elif '--color-accent-hover:' in line or '--color-accent-deep:' in line:
                pass
            elif '--color-accent-subtle:' in line:
                line = '  --color-accent-subtle: rgba(10, 10, 12, 0.06); /* Ambient Neutral Fill */'
            elif '--color-accent-glow:' in line or '--color-orange-glow:' in line:
                line = re.sub(r'rgba\([^)]+\)', 'rgba(10, 10, 12, 0.20)', line)
            elif '--color-accent-border:' in line:
                line = '  --color-accent-border: rgba(10, 10, 12, 0.16); /* Neutral Hairline Border */'
            else:
                line = replace_colors_to_black(line, is_accent=False)
        else:
            # Skip comments cleanly
            if st.startswith('/*') or st.startswith('*'):
                out.append(orig)
                continue
            # Preserve star ratings (#F59E0B/#FBBF24) & external Instagram gradient (#fd5949)
            if '#fd5949' in line.lower() or '#f59e0b' in line.lower() or '#fbbf24' in line.lower():
                out.append(orig)
                continue

            accent_flag = is_accent_context(curr_sel, line)
            line = replace_colors_to_black(line, is_accent=accent_flag, selector=curr_sel)

            # Ensure hover buttons that turned dark/charcoal still have crisp #FFFFFF text & visible contrast
            if '.popular-cart-btn.btn-peach' in curr_sel and 'color:' in line:
                line = re.sub(r'color:\s*#1E1A16', 'color: #FFFFFF', line, flags=re.I)
            if '#heroExploreArrow' in curr_sel and 'color:' in line and ':hover' not in curr_sel:
                line = re.sub(r'color:\s*#0A0A0C', 'color: #FFFFFF', line, flags=re.I)
            if '.combo-sticky-checkout-btn:not(:disabled)' in curr_sel and 'background:' in line:
                if ':hover' in curr_sel:
                    line = '  background: #F4F4F5 !important;'
                else:
                    line = '  background: #FFFFFF !important;'
            if '.combo-sticky-checkout-btn:not(:disabled)' in curr_sel and 'color:' in line:
                line = '  color: #0A0A0C !important;'
            if '.combo-sticky-checkout-btn:not(:disabled)' in curr_sel and 'box-shadow:' in line:
                line = '  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.22) !important;'
            if '.fl-offer-price' in curr_sel and 'color:' in line:
                line = '  color: #FFFFFF;'

        if line != orig:
            changed += 1
        out.append(line)

    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(out) + '\n')
    return changed


def process_html_or_js(path):
    txt = open(path, 'r', encoding='utf-8', errors='ignore').read()
    lines = txt.splitlines()
    out = []
    changed = 0
    in_style = False
    curr_sel = ''
    for line in lines:
        orig = line
        st = line.strip()
        if '<style' in st.lower():
            in_style = True
        if '</style>' in st.lower():
            in_style = False
            curr_sel = ''

        if in_style:
            if '{' in st and not st.startswith('/*'):
                curr_sel = st.split('{')[0].strip()
            accent_flag = is_accent_context(curr_sel, line)
            line = replace_colors_to_black(line, is_accent=accent_flag, selector=curr_sel)
        else:
            # HTML tags or JS strings
            # Preserve real swatch dots, payment brand logos (Mastercard/UPI/RuPay/Google/Discover), review stars
            if any(k in line for k in ('class="color-dot', 'data-color-img', 'hero_hand_slideshow', 'fill="#F59E0B"', 'stroke="#F59E0B"', 'stroke="#D97706"', 'fill="#EA4335"', 'fill="#FBBC05"', 'fill="#F79E1B"', 'fill="#FF5F00"', 'fill="#F47920"', 'fill="#F9A825"', 'fill="#F37021"')):
                out.append(orig)
                continue

            # Keep small lightning bolt / bento-kicker accent, wishlist filled heart, bundle discount row text crisp #FF5A18
            if any(k in line for k in ('points="13 2 3 14 12 14', 'bento-kicker', 'stroke="#FF5A18"', 'cartBundleDiscountRow', 'cartDrawerBundleDiscount', 'actionAddBtn.innerHTML', 'stroke="#EA580C"')):
                # Wait: pdp urgency stock icon #EA580C (stock box) -> black; lightning bolt & bento-kicker & wishlist/discount -> #FF5A18 accent
                if 'stroke="#EA580C"' in line:
                    line = line.replace('#EA580C', '#18181B')
                elif 'actionAddBtn.style.borderColor' in line:
                    line = line.replace('#FF5500', '#0A0A0C')
                else:
                    line = re.sub(r'#FF5500\b', '#FF5A18', line, flags=re.I)
            elif 'sidebar-help-btn' in line and 'border-color: #FF5500' in line:
                line = line.replace('border-color: #FF5500', 'border-color: rgba(255, 255, 255, 0.35)')
            elif 'heroExploreArrow' in line or 'btn-peach' in line:
                line = replace_colors_to_black(line, is_accent=False)
            elif 'luxury-card-tag' in line and 'BESTSELLER' in line:
                line = line.replace('background: #FF5500; color: #171513;', 'background: #0A0A0C; color: #FFFFFF; border: 1px solid rgba(255, 90, 24, 0.45);')
            elif 'instant_navigation.js' in path:
                line = line.replace('#FF5500 0%, #FFAA00 100%', '#0A0A0C 0%, #27272A 85%, #FF5A18 100%')
                line = line.replace('rgba(255, 85, 0, 0.4)', 'rgba(10, 10, 12, 0.25)')
            else:
                line = replace_colors_to_black(line, is_accent=False)

        if line != orig:
            changed += 1
        out.append(line)

    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(out) + '\n')
    return changed


def main():
    css_files = ['styles.css', 'catalog.css', 'pdp.css', 'microinteractions.css', 'combo.css', 'pages.css', os.path.join('assets', 'trending_drops.css')]
    for p in css_files:
        c = process_css(p)
        print(f'[CSS] {p}: {c} lines updated')

    other_files = []
    for d in ['.', 'assets', 'snippets']:
        if not os.path.exists(d):
            continue
        for fn in sorted(os.listdir(d)):
            p = os.path.join(d, fn)
            if os.path.isfile(p) and fn.endswith(('.html', '.js')) and fn not in ('products_data.js', 'three.min.js', 'dev_server.js', 'test_gallery.js'):
                other_files.append(p)
    for p in other_files:
        c = process_html_or_js(p)
        if c:
            print(f'[HTML/JS] {p}: {c} lines updated')


if __name__ == '__main__':
    main()
