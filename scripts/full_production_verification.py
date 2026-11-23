import os, json, re, glob
from PIL import Image

print("=== STARTING FULL PRODUCTION VERIFICATION ===")

# 1. Verify products_data.js
with open('assets/products_data.js', encoding='utf-8') as f:
    text = f.read()

idx = text.find('[')
last_idx = text.rfind(']')
products = json.loads(text[idx:last_idx+1])
print(f"[OK] products_data.js parsed successfully: {len(products)} products found")

# 2. Verify all 28 phone cases
phone_cases = [p for p in products if p.get('category') == 'iphone-cases']
print(f"[OK] Total phone cases: {len(phone_cases)}")

missing_images = []
extra_found = []
empty_packshots = []

for i, p in enumerate(phone_cases, 1):
    handle = p.get('handle')
    primary = p.get('primary_image')
    
    # Check primary image existence
    if not os.path.exists(primary):
        missing_images.append((handle, 'primary', primary))
    else:
        # Check size & mode
        im = Image.open(primary)
        if im.size != (1254, 1254) and im.size != (1024, 1024):
            print(f"[WARN] Non-standard size: {handle} -> {im.size}")
            
    # Check color packshots
    if p.get('colors'):
        for c in p.get('colors'):
            c_img = c.get('image')
            if c_img and not os.path.exists(c_img):
                missing_images.append((handle, f"color:{c.get('name')}", c_img))
                
    # Check gallery images for /extra/
    images = p.get('images', [])
    for img in images:
        if '/extra/' in img:
            extra_found.append((handle, img))
        if not os.path.exists(img):
            missing_images.append((handle, 'gallery', img))

print(f"Missing images count: {len(missing_images)}")
if missing_images:
    for m in missing_images[:5]:
        print(" - MISSING:", m)
assert len(missing_images) == 0, "Found missing images!"

print(f"Legacy /extra/ images in phone cases gallery: {len(extra_found)}")
assert len(extra_found) == 0, "Found legacy extra images in phone cases!"

# 3. Verify Navbar links in HTML files
nav_about_contact = []
for html_file in glob.glob('*.html'):
    with open(html_file, encoding='utf-8') as f:
        content = f.read()
    
    # Look for about.html or contact.html in nav or mobile-nav
    # Check mobile links (strict class name match, excluding footer-nav-link)
    m_about = re.findall(r'<a[^>]*class=[\'"][^\'"]*(?<![\w-])mobile-link(?![\w-])[^\'"]*[\'"][^>]*href=[\'"]about\.html[\'"]', content, re.IGNORECASE)
    m_contact = re.findall(r'<a[^>]*class=[\'"][^\'"]*(?<![\w-])mobile-link(?![\w-])[^\'"]*[\'"][^>]*href=[\'"]contact\.html[\'"]', content, re.IGNORECASE)
    # Check desktop header nav links (strict class name match, excluding footer-nav-link)
    d_about = re.findall(r'<a[^>]*class=[\'"][^\'"]*(?<![\w-])nav-link(?![\w-])[^\'"]*[\'"][^>]*href=[\'"]about\.html[\'"]', content, re.IGNORECASE)
    d_contact = re.findall(r'<a[^>]*class=[\'"][^\'"]*(?<![\w-])nav-link(?![\w-])[^\'"]*[\'"][^>]*href=[\'"]contact\.html[\'"]', content, re.IGNORECASE)
    
    total = len(m_about) + len(m_contact) + len(d_about) + len(d_contact)
    if total > 0:
        nav_about_contact.append((html_file, total))

print(f"HTML files with about/contact in navbar: {len(nav_about_contact)}")
assert len(nav_about_contact) == 0, f"Nav links still found in: {nav_about_contact}"

print("\n=== ALL VERIFICATIONS PASSED PERFECTLY (100% OK) ===")
