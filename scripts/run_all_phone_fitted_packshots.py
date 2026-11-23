import os
from PIL import Image
import numpy as np

PHONE_SRC_PATH = 'scripts/magsafe_clear_23.jpg'
TARGET_SIZE = (1254, 1254)

phone_src_im = Image.open(PHONE_SRC_PATH).convert('RGBA')

def process_case(handle, color_folder, is_opaque=False, scale_adj=0.98):
    base_dir = os.path.join('assets', 'products', handle, color_folder)
    packshot_webp = os.path.join(base_dir, '01_packshot.webp')
    packshot_png = os.path.join(base_dir, '01_packshot.png')
    bare_webp = os.path.join(base_dir, '02_packshot_bare.webp')
    bare_png = os.path.join(base_dir, '02_packshot_bare.png')
    
    if not os.path.exists(packshot_webp):
        print(f"[SKIP] {packshot_webp} not found")
        return
        
    empty_im = Image.open(packshot_webp).convert('RGBA')
    w_orig, h_orig = empty_im.size
    
    # 1. Save original bare packshot as 02_packshot_bare.webp and .png (1254x1254)
    bare_im = empty_im.resize(TARGET_SIZE, Image.Resampling.LANCZOS).convert('RGB')
    bare_im.save(bare_webp, quality=95)
    bare_im.save(bare_png)
    print(f"[BARE SAVED] {bare_webp}")
    
    empty_arr = np.array(empty_im)
    non_white = (empty_arr[:,:,0] < 240) | (empty_arr[:,:,1] < 240) | (empty_arr[:,:,2] < 240)
    y_all, x_all = np.where(non_white)
    case_w = x_all.max() - x_all.min()
    case_h = y_all.max() - y_all.min()
    case_cx = (x_all.min() + x_all.max()) // 2
    case_cy = (y_all.min() + y_all.max()) // 2
    
    # Measure phone source
    phone_arr = np.array(phone_src_im)
    p_non_white = (phone_arr[:,:,0] < 240) | (phone_arr[:,:,1] < 240) | (phone_arr[:,:,2] < 240)
    py, px = np.where(p_non_white)
    phone_w = px.max() - px.min()
    phone_h = py.max() - py.min()
    phone_cx = (px.min() + px.max()) // 2
    phone_cy = (py.min() + py.max()) // 2
    
    # Scale phone to match case
    scale = ((case_w / phone_w) + (case_h / phone_h)) / 2.0 * scale_adj
    sw = int(phone_src_im.size[0] * scale)
    sh = int(phone_src_im.size[1] * scale)
    scaled_phone = phone_src_im.resize((sw, sh), Image.Resampling.LANCZOS)
    
    new_phone_cx = int(phone_cx * scale)
    new_phone_cy = int(phone_cy * scale)
    off_x = case_cx - new_phone_cx
    off_y = case_cy - new_phone_cy
    
    aligned_phone = Image.new('RGBA', (w_orig, h_orig), (255, 255, 255, 255))
    aligned_phone.paste(scaled_phone, (off_x, off_y))
    aligned_arr = np.array(aligned_phone)
    
    if is_opaque:
        # For opaque cases: ONLY fill the camera cutout hole!
        # Camera cutout is typically in top-left region of the case:
        cam_region = np.zeros((h_orig, w_orig), dtype=bool)
        cam_ymin = max(0, int(case_cy - case_h * 0.45))
        cam_ymax = min(h_orig, int(case_cy - case_h * 0.15))
        cam_xmin = max(0, int(case_cx - case_w * 0.45))
        cam_xmax = min(w_orig, int(case_cx - case_w * 0.05))
        cam_region[cam_ymin:cam_ymax, cam_xmin:cam_xmax] = True
        
        # Hole is where empty_arr is near white (>230) inside the camera region
        is_hole = cam_region & (empty_arr[:,:,0] > 230) & (empty_arr[:,:,1] > 230) & (empty_arr[:,:,2] > 230)
        
        comp_arr = empty_arr.copy()
        comp_arr[is_hole] = aligned_arr[is_hole]
    else:
        # For transparent / frame / clear cases: phone sits underneath the case
        is_case_feature = (empty_arr[:,:,0] < 232) | (empty_arr[:,:,1] < 232) | (empty_arr[:,:,2] < 232)
        comp_arr = aligned_arr.copy()
        comp_arr[is_case_feature] = empty_arr[is_case_feature]
        
        # Preserve base contact drop shadow at bottom
        shadow_mask = (np.arange(h_orig)[:, None] > (y_all.max() - 40)) & (~is_case_feature) & (empty_arr[:,:,0] < 240)
        comp_arr[shadow_mask] = empty_arr[shadow_mask]
        
    # Solid pure white outside background
    bg_mask = (comp_arr[:,:,0] > 248) & (comp_arr[:,:,1] > 248) & (comp_arr[:,:,2] > 248)
    comp_arr[bg_mask] = [255, 255, 255, 255]
    
    comp_im = Image.fromarray(comp_arr).convert('RGB')
    comp_final = comp_im.resize(TARGET_SIZE, Image.Resampling.LANCZOS)
    comp_final.save(packshot_webp, quality=95)
    comp_final.save(packshot_png)
    print(f"[PACKSHOT UPDATED] {packshot_webp} ({TARGET_SIZE[0]}x{TARGET_SIZE[1]})")

# Process all 6 products:
tasks = [
    # 1. transparent-magnetic-wireless-charging-phone-case
    ('transparent-magnetic-wireless-charging-phone-case', 'cosmic-orange', False, 0.98),
    ('transparent-magnetic-wireless-charging-phone-case', 'dark-blue', False, 0.98),
    
    # 3. crystal-studded-luxe-case-orange
    ('crystal-studded-luxe-case-orange', 'cosmic-orange', False, 1.00),
    
    # 4. ultra-clear-sideless-anti-yellow-back-case
    ('ultra-clear-sideless-anti-yellow-back-case', 'crystal-clear', False, 0.95),
    
    # 8. luxury-steel-blue-heart-sparkle-phone-case-with-pearl-chain
    ('luxury-steel-blue-heart-sparkle-phone-case-with-pearl-chain', 'steel-blue', True, 0.98),
    
    # 18. silver-3d-love-heart-phone-case-copy
    ('silver-3d-love-heart-phone-case-copy', 'espresso-brown', True, 0.98),
    
    # 28. bumper-case (7 colors)
    ('bumper-case', 'black', False, 0.98),
    ('bumper-case', 'dark-blue', False, 0.98),
    ('bumper-case', 'natural-titanium', False, 0.98),
    ('bumper-case', 'desert-titanium', False, 0.98),
    ('bumper-case', 'dark-red', False, 0.98),
    ('bumper-case', 'sierra-blue', False, 0.98),
    ('bumper-case', 'cosmic-orange', False, 0.98),
]

for handle, color, is_op, sc in tasks:
    print(f"\nProcessing {handle} / {color}...")
    process_case(handle, color, is_opaque=is_op, scale_adj=sc)

print("\nAll 6 products / 13 variants updated successfully!")
