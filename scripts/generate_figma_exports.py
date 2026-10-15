import re
from bs4 import BeautifulSoup

print('Generating clean, minimal Figma presentation exports...')

# 1. Generate mobile_scoped.css from styles.css
with open('styles.css', 'r', encoding='utf-8') as f:
    css_text = f.read()

def extract_mq_blocks(css):
    blocks = []
    pattern = re.compile(r'@media\s*\((max-width:\s*(?:768|640|680|480)px)\)\s*\{')
    pos = 0
    while True:
        m = pattern.search(css, pos)
        if not m:
            break
        start = m.end()
        brace_count = 1
        i = start
        while i < len(css) and brace_count > 0:
            if css[i] == '{':
                brace_count += 1
            elif css[i] == '}':
                brace_count -= 1
            i += 1
        inner_css = css[start:i-1]
        blocks.append((m.group(1), inner_css))
        pos = i
    return blocks

def prefix_css_rules(inner_css, prefix='.mobile-view'):
    output = []
    pos = 0
    while pos < len(inner_css):
        open_brace = inner_css.find('{', pos)
        if open_brace == -1:
            break
        selectors_str = inner_css[pos:open_brace].strip()
        close_brace = inner_css.find('}', open_brace)
        if close_brace == -1:
            break
        rule_body = inner_css[open_brace+1:close_brace].strip()
        
        if selectors_str.startswith('@') or not selectors_str:
            pos = close_brace + 1
            continue
            
        sel_list = [s.strip() for s in selectors_str.split(',') if s.strip()]
        prefixed_sels = []
        for s in sel_list:
            if any(s.startswith(x) for x in [':root', 'html', 'body']):
                prefixed_sels.append(prefix)
            else:
                prefixed_sels.append(f'{prefix} {s}')
        
        prefixed_header = ', '.join(prefixed_sels)
        output.append(f'{prefixed_header} {{\n  {rule_body}\n}}')
        pos = close_brace + 1
    return '\n'.join(output)

blocks = extract_mq_blocks(css_text)
all_mobile_css = []
for mq, b in blocks:
    all_mobile_css.append(prefix_css_rules(b))

mobile_css_combined = '\n\n'.join(all_mobile_css)
with open('mobile_scoped.css', 'w', encoding='utf-8') as f:
    f.write(mobile_css_combined)
print('mobile_scoped.css generated! Size:', len(mobile_css_combined))

# 2. Extract Homepage Body Content
with open('index.html', 'r', encoding='utf-8') as f:
    home_soup = BeautifulSoup(f.read(), 'html.parser')

home_body = home_soup.find('body')
for tag in home_body.find_all(['script']):
    tag.decompose()
for tag in home_body.find_all(class_=['mobile-nav-drawer', 'modal-overlay', 'cart-drawer-overlay', 'cart-drawer']):
    tag.decompose()

home_body_str = str(home_body)
home_body_content = home_body_str[home_body_str.find('>')+1:home_body_str.rfind('</body>')].strip()

# 3. Extract Product Page Body Content
with open('product.html', 'r', encoding='utf-8') as f:
    prod_soup = BeautifulSoup(f.read(), 'html.parser')

prod_body = prod_soup.find('body')
for tag in prod_body.find_all(['script']):
    tag.decompose()
for tag in prod_body.find_all(class_=['mobile-nav-drawer', 'cart-drawer-overlay', 'cart-drawer']):
    tag.decompose()

prod_body_str = str(prod_body)
prod_body_content = prod_body_str[prod_body_str.find('>')+1:prod_body_str.rfind('</body>')].strip()

# Common Canvas CSS (Simple, Minimal White, No Device Frames, No Cutoffs)
canvas_style = '''
    /* Simple & Minimal Pure White Canvas */
    html, body {
      background-color: #FFFFFF !important;
      margin: 0 !important;
      padding: 40px !important;
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif !important;
      overflow-x: auto !important;
      min-width: max-content !important;
    }

    /* Presentation Flex Row: Starts at left edge (0 cutoff) */
    .figma-presentation-canvas {
      display: flex !important;
      flex-direction: row !important;
      align-items: flex-start !important;
      justify-content: flex-start !important;
      gap: 60px !important;
      background-color: #FFFFFF !important;
      min-width: max-content !important;
    }

    .desktop-artboard {
      width: 1440px !important;
      min-width: 1440px !important;
      max-width: 1440px !important;
      flex-shrink: 0 !important;
      background: #FFFFFF !important;
      border: 1px solid #E2E8F0 !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05) !important;
      overflow: hidden !important;
      position: relative !important;
    }

    .mobile-artboard {
      width: 390px !important;
      min-width: 390px !important;
      max-width: 390px !important;
      flex-shrink: 0 !important;
      background: #FFFFFF !important;
      border: 1px solid #E2E8F0 !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05) !important;
      overflow: hidden !important;
      position: relative !important;
    }
'''

# 4. Generate figma_home.html
home_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Covertok Homepage - Desktop (1440px) & Mobile (390px)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="mobile_scoped.css">
  <style>
{canvas_style}
  </style>
</head>
<body>

  <div class="figma-presentation-canvas">
    
    <!-- DESKTOP VIEW (1440px) - ALL SECTIONS TILL FOOTER -->
    <div class="desktop-artboard">
      {home_body_content}
    </div>

    <!-- MOBILE VIEW (390px) - ALL SECTIONS TILL FOOTER -->
    <div class="mobile-artboard mobile-view">
      {home_body_content}
    </div>

  </div>

</body>
</html>'''

with open('figma_home.html', 'w', encoding='utf-8') as f:
    f.write(home_html)
print('Generated figma_home.html successfully!')

# 5. Generate figma_product.html
prod_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Covertok Product Page - Desktop (1440px) & Mobile (390px)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="mobile_scoped.css">
  <style>
{canvas_style}
  </style>
</head>
<body>

  <div class="figma-presentation-canvas">
    
    <!-- PRODUCT DESKTOP VIEW (1440px) - ALL SECTIONS TILL FOOTER -->
    <div class="desktop-artboard">
      {prod_body_content}
    </div>

    <!-- PRODUCT MOBILE VIEW (390px) - ALL SECTIONS TILL FOOTER -->
    <div class="mobile-artboard mobile-view">
      {prod_body_content}
    </div>

  </div>

</body>
</html>'''

with open('figma_product.html', 'w', encoding='utf-8') as f:
    f.write(prod_html)
print('Generated figma_product.html successfully!')

# 6. Generate Master figma_export.html (With clean top switcher & all 4 frames option)
master_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Covertok - Clean Figma Presentation Layout</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="mobile_scoped.css">
  <style>
{canvas_style}

    /* Minimal View Switcher Bar */
    .top-switch-bar {{
      position: sticky;
      top: 0;
      z-index: 9999;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      padding: 12px 0 20px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid #E2E8F0;
    }}
    .switch-tab-btn {{
      padding: 8px 18px;
      border-radius: 999px;
      border: 1px solid #CBD5E1;
      background: #FFFFFF;
      color: #0F172A;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
    }}
    .switch-tab-btn.active, .switch-tab-btn:hover {{
      background: #0F172A;
      color: #FFFFFF;
      border-color: #0F172A;
    }}
  </style>
</head>
<body>

  <!-- Minimal Switcher -->
  <div class="top-switch-bar">
    <button class="switch-tab-btn active" onclick="showView('home')">Homepage (PC & Mobile)</button>
    <button class="switch-tab-btn" onclick="showView('product')">Product Page (PC & Mobile)</button>
    <button class="switch-tab-btn" onclick="showView('all')">Show All 4 Frames</button>
  </div>

  <!-- HOMEPAGE SECTION -->
  <div class="figma-presentation-canvas" id="homeCanvasView">
    <div class="desktop-artboard">
      {home_body_content}
    </div>
    <div class="mobile-artboard mobile-view">
      {home_body_content}
    </div>
  </div>

  <!-- PRODUCT PAGE SECTION -->
  <div class="figma-presentation-canvas" id="productCanvasView" style="display: none; margin-top: 40px;">
    <div class="desktop-artboard">
      {prod_body_content}
    </div>
    <div class="mobile-artboard mobile-view">
      {prod_body_content}
    </div>
  </div>

  <script>
    function showView(view) {{
      const homeView = document.getElementById('homeCanvasView');
      const prodView = document.getElementById('productCanvasView');
      const btns = document.querySelectorAll('.switch-tab-btn');
      btns.forEach(b => b.classList.remove('active'));

      if (view === 'home') {{
        homeView.style.display = 'flex';
        prodView.style.display = 'none';
        btns[0].classList.add('active');
      }} else if (view === 'product') {{
        homeView.style.display = 'none';
        prodView.style.display = 'flex';
        btns[1].classList.add('active');
      }} else {{
        homeView.style.display = 'flex';
        prodView.style.display = 'flex';
        btns[2].classList.add('active');
      }}
    }}
  </script>

</body>
</html>'''

with open('figma_export.html', 'w', encoding='utf-8') as f:
    f.write(master_html)
print('Generated figma_export.html successfully!')
