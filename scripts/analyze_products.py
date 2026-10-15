import json

def main():
    with open('scripts/raw_products.json', encoding='utf-8') as f:
        products = json.load(f)

    with open('scripts/downloaded_images_map.json', encoding='utf-8') as f:
        img_map = json.load(f)

    print(f"Loaded {len(products)} products and {len(img_map)} image paths.")

    color_variants_found = 0
    single_color_products = 0

    for p in products:
        p_id = str(p['id'])
        # Find which option index is Color/Colour
        color_opt_index = None
        for i, opt in enumerate(p.get('options', [])):
            if opt['name'].lower() in ['color', 'colour']:
                color_opt_index = i + 1 # option1, option2, option3
                break

        colors = []
        if color_opt_index:
            opt_key = f"option{color_opt_index}"
            # Track colors seen and their associated image
            seen_colors = {}
            for v in p.get('variants', []):
                c_name = v.get(opt_key)
                if not c_name or c_name in seen_colors:
                    continue
                feat_img = v.get('featured_image')
                img_path = None
                if feat_img:
                    feat_id = str(feat_img.get('id'))
                    img_path = img_map.get(f"{p_id}_{feat_id}")
                # If variant has no featured_image, fall back to matching images or first image
                seen_colors[c_name] = {
                    'name': c_name,
                    'price': float(v.get('price', 0)),
                    'img_path': img_path,
                    'variant_id': v.get('id')
                }

            # If any color doesn't have an image, let's see how images correlate
            all_imgs = [img_map.get(f"{p_id}_{img['id']}") for img in p.get('images', [])]
            for idx, (c_name, c_data) in enumerate(seen_colors.items()):
                if not c_data['img_path']:
                    # Assign corresponding image if available by index or default
                    if idx < len(all_imgs) and all_imgs[idx]:
                        c_data['img_path'] = all_imgs[idx]
                    elif all_imgs:
                        c_data['img_path'] = all_imgs[0]
            colors = list(seen_colors.values())

        if len(colors) > 1:
            color_variants_found += 1
            print(f"[MULTI-COLOR] {p['title']} ({len(colors)} colors): {[c['name'] for c in colors]}")
        else:
            single_color_products += 1

    print(f"\nSummary:")
    print(f"Products with multiple colors: {color_variants_found}")
    print(f"Single color or single variant products: {single_color_products}")

if __name__ == '__main__':
    main()
