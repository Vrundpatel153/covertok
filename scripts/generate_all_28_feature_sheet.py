import glob, os
from PIL import Image

products = sorted(glob.glob('assets/products/*/showcase/04_feature.webp'))

# Let's create an overview contact sheet of ALL 28 04_feature images (4 rows of 7 columns)
cols = 7
rows = 4
w, h = 300, 300

sheet = Image.new('RGB', (w * cols, h * rows), (255, 255, 255))

for idx, p in enumerate(products):
    handle = os.path.basename(os.path.dirname(os.path.dirname(p)))
    im = Image.open(p).convert('RGB')
    thumb = im.resize((w, h), Image.Resampling.LANCZOS)
    col = idx % cols
    row = idx // cols
    sheet.paste(thumb, (col * w, row * h))

out_path = r'C:\Users\vrund\.gemini\antigravity\brain\bf9d02b0-6d62-46dd-8569-a82dd4dbb8ba\all_28_feature_sheet.jpg'
sheet.save(out_path, quality=85)
print('Saved all 28 feature sheet to:', out_path)
