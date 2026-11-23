import os
from PIL import Image

p = 'assets/products/phone-cover-with-built-in-lip-balm-holder-copy-copy-6/showcase'

# 1. 01_model: In Hand with seamless branding
im_01 = Image.open(r'C:\Users\vrund\.gemini\antigravity\brain\bf9d02b0-6d62-46dd-8569-a82dd4dbb8ba\test_model_01_branded_clean.jpg').convert('RGB')
im_01.save(os.path.join(p, '01_model.webp'), 'WEBP', quality=95)
im_01.save(os.path.join(p, '01_model.png'), 'PNG')
print('Updated 01_model.webp & 01_model.png')

# 2. 02_angle: 45-degree angle authentic photo
im_02 = Image.open('assets/products/phone-cover-with-built-in-lip-balm-holder-copy-copy-6/raspberry/02_lifestyle.jpg').convert('RGB')
im_02_1254 = im_02.resize((1254, 1254), Image.Resampling.LANCZOS)
im_02_1254.save(os.path.join(p, '02_angle.webp'), 'WEBP', quality=95)
im_02_1254.save(os.path.join(p, '02_angle.png'), 'PNG')
print('Updated 02_angle.webp & 02_angle.png')

# 3. 03_quality: Macro close-up authentic photo
im_03 = Image.open('assets/products/phone-cover-with-built-in-lip-balm-holder-copy-copy-6/extra/03_extra.webp').convert('RGB')
im_03_1254 = im_03.resize((1254, 1254), Image.Resampling.LANCZOS)
im_03_1254.save(os.path.join(p, '03_quality.webp'), 'WEBP', quality=95)
im_03_1254.save(os.path.join(p, '03_quality.png'), 'PNG')
print('Updated 03_quality.webp & 03_quality.png')

# 4. 04_feature: Branded packshot + Amazon A+ informative overlay
im_04 = Image.open(r'C:\Users\vrund\.gemini\antigravity\brain\bf9d02b0-6d62-46dd-8569-a82dd4dbb8ba\test_rhode_04_branded.jpg').convert('RGB')
im_04.save(os.path.join(p, '04_feature.webp'), 'WEBP', quality=95)
im_04.save(os.path.join(p, '04_feature.png'), 'PNG')
print('Updated 04_feature.webp & 04_feature.png')

print('All 4 Rhode showcase images successfully updated with authentic branding!')
