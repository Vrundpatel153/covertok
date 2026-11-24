import json
import os
import sys
import time
from PIL import Image
import run_16_models_via_daemon as driver

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True)

QUEUE_FILE = os.path.join('scripts', 'remaining_5_marketing.json')


def save_marketing(img_src, out_dir):
    raw_tmp = os.path.join(out_dir, '_temp_raw_mkt.png')
    res = driver.post_action({'action': 'save_image_url', 'url': img_src, 'outPath': raw_tmp}, timeout=45)
    if not res.get('ok') or not os.path.exists(raw_tmp):
        return False, f"Fetch failed: {res}"
    im = Image.open(raw_tmp).convert('RGB')
    w, h = im.size
    if w != h:
        side = min(w, h)
        im = im.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
    im_1254 = im.resize((1254, 1254), Image.Resampling.LANCZOS)
    wp = os.path.join(out_dir, '05_marketing.webp')
    pp = os.path.join(out_dir, '05_marketing.png')
    im_1254.save(wp, 'WEBP', quality=95)
    im_1254.save(pp, 'PNG')
    os.remove(raw_tmp)
    return True, f"Saved 1254x1254 05_marketing.webp ({os.path.getsize(wp)} B)"


def main():
    with open(QUEUE_FILE, 'r', encoding='utf-8') as f:
        queue = json.load(f)

    done = 0
    for item in queue:
        h = item['handle']
        print(f"\n=== [{item['index']}/5] Marketing EDC cleanup: {item['title']} ({h}) ===")
        if not driver.start_fresh_chat():
            print("  [ERROR] Fresh chat failed")
            break
        ok_up, msg_up = driver.upload_and_wait(item['ref_jpg'])
        if not ok_up:
            print(f"  [WARN] {msg_up}, retrying once...")
            driver.start_fresh_chat()
            ok_up, msg_up = driver.upload_and_wait(item['ref_jpg'])
            if not ok_up:
                print(f"  [FAIL] {msg_up}")
                continue
        print(f"  [OK] Uploaded {os.path.basename(item['ref_jpg'])}")
        if not driver.submit_prompt(item['prompt']):
            print("  [FAIL] Submit failed")
            continue
        print("  [OK] Prompt submitted! Generating...")
        st, info = driver.wait_for_image(timeout_sec=210)
        if st != 'OK' or not info or not info.get('src'):
            print(f"  [FAIL] Wait status: {st}")
            continue
        ok_sv, msg_sv = save_marketing(info['src'], item['out_dir'])
        print(f"  [SAVED] {msg_sv}" if ok_sv else f"  [FAIL] {msg_sv}")
        if ok_sv:
            done += 1
        time.sleep(2)
    print(f"\nMarketing cleanup done: {done}/5")


if __name__ == '__main__':
    main()
