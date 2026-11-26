import json
import os
import sys
import time
import urllib.request
from PIL import Image
import run_16_models_via_daemon as driver

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True)

QUEUE_FILE = os.path.join('scripts', 'fidelity_14_queue.json')
PROGRESS_FILE = os.path.join('scripts', 'fidelity_14_progress.json')


def load_prog():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def save_prog(prog):
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(prog, f, indent=2)


def save_output_img(img_src, item):
    tmp_dir = os.path.dirname(item['out_webp'])
    raw_tmp = os.path.join(tmp_dir, f"_temp_raw_{item['id']}.png")
    res = driver.post_action({'action': 'save_image_url', 'url': img_src, 'outPath': raw_tmp}, timeout=45)
    if not res.get('ok') or not os.path.exists(raw_tmp):
        return False, f"Fetch failed: {res}"
    im = Image.open(raw_tmp).convert('RGB')
    w, h = im.size
    if w != h:
        side = min(w, h)
        im = im.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
    sz = item['size']
    im_rs = im.resize((sz, sz), Image.Resampling.LANCZOS)
    im_rs.save(item['out_webp'], 'WEBP', quality=95)
    im_rs.save(item['out_png'], 'PNG')
    os.remove(raw_tmp)
    return True, f"Saved {sz}x{sz} -> {item['handle']}/{item['role']}.webp ({os.path.getsize(item['out_webp'])} B)"


def wait_for_daemon():
    print("[WAIT] Waiting for Chrome daemon connection (click Allow on Chrome popup if shown)...")
    while True:
        try:
            st = json.loads(urllib.request.urlopen('http://127.0.0.1:9333/status', timeout=2).read().decode())
            if st.get('connected'):
                print("[OK] Daemon connected to Chrome!")
                return
        except Exception:
            pass
        time.sleep(2)


def main():
    wait_for_daemon()
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 14
    with open(QUEUE_FILE, 'r', encoding='utf-8') as f:
        queue = json.load(f)
    prog = load_prog()

    done_now = 0
    for item in queue:
        key = item['id']
        if prog.get(key) == 'done':
            print(f"[SKIP] {item['index']:02d}. {key} already done.")
            continue
        if done_now >= limit:
            print(f"[STOP] Batch limit {limit} reached.")
            break

        print(f"\n=== [{item['index']:02d}/{len(queue)}] {item['handle']} :: {item['role']} ===")
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
        if st == 'LIMIT':
            print(f"  [RATE LIMIT] Cooldown needed: {info}. Sleeping 300s then retrying...")
            time.sleep(300)
            continue
        if st != 'OK' or not info or not info.get('src'):
            print(f"  [FAIL] Wait status: {st}")
            time.sleep(15)
            continue

        ok_sv, msg_sv = save_output_img(info['src'], item)
        if ok_sv:
            print(f"  [SAVED] {msg_sv}")
            prog[key] = 'done'
            save_prog(prog)
            done_now += 1
        else:
            print(f"  [FAIL] {msg_sv}")
        time.sleep(20)

    total_done = sum(1 for v in prog.values() if v == 'done')
    print(f"\nBatch finished. Newly generated: {done_now}. Total done: {total_done}/{len(queue)}")


if __name__ == '__main__':
    main()
