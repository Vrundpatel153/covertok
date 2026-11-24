import json
import os
import sys
import time
import urllib.request
from PIL import Image

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True)

DAEMON_URL = 'http://127.0.0.1:9333/action'
STATUS_URL = 'http://127.0.0.1:9333/status'
QUEUE_FILE = os.path.join('scripts', 'remaining_16_models.json')
PROGRESS_FILE = os.path.join('scripts', 'remaining_16_progress.json')


def post_action(payload, timeout=30):
    req = urllib.request.Request(
        DAEMON_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode('utf-8'))


def eval_js(fn_str, args=None):
    return post_action({'action': 'eval', 'fn': fn_str, 'args': args or []})


def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def save_progress(prog):
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(prog, f, indent=2)


def start_fresh_chat():
    post_action({'action': 'goto', 'url': 'https://chatgpt.com/'})
    # Wait up to 20s for clean #prompt-textarea and file input with 0 attachments
    for _ in range(20):
        time.sleep(1)
        res = eval_js('''() => {
            const box = document.querySelector('#prompt-textarea') || document.querySelector('div[contenteditable="true"]');
            const fin = document.querySelector('input[type="file"]');
            const formImgs = document.querySelectorAll('form img, [data-testid*="attachment"]');
            return { ready: !!(box && fin && formImgs.length === 0), url: location.href };
        }''')
        if res.get('ok') and res.get('result', {}).get('ready'):
            return True
    return False


def upload_and_wait(ref_jpg):
    res = post_action({'action': 'upload', 'filePath': ref_jpg})
    if not res.get('ok'):
        return False, f"upload call failed: {res}"

    # Wait up to 25s for upload thumbnail without spinner or error
    for _ in range(25):
        time.sleep(1)
        st = eval_js('''() => {
            const form = document.querySelector('form');
            if (!form) return { ok: false, reason: 'no form' };
            const txt = form.innerText || '';
            if (txt.includes('Upload failed')) return { ok: false, failed: true };
            const imgs = Array.from(form.querySelectorAll('img'));
            const spinners = Array.from(form.querySelectorAll('[role="progressbar"], .animate-spin, circle[stroke-dasharray]'));
            return {
                ok: imgs.length > 0 && spinners.length === 0,
                imgCount: imgs.length,
                spinners: spinners.length
            };
        }''')
        r = st.get('result', {})
        if r.get('failed'):
            return False, 'Upload failed in ChatGPT UI'
        if r.get('ok'):
            return True, 'Uploaded'
    return False, 'Upload wait timed out'


def submit_prompt(prompt_text):
    post_action({'action': 'type_and_send', 'text': prompt_text, 'submit': False})
    # Wait up to 15s for send button to appear and become enabled
    for _ in range(15):
        time.sleep(1)
        st = eval_js('''() => {
            const btn = document.querySelector('button[aria-label="Send"], button[data-testid="send-button"], button[data-testid="composer-send-button"], button[aria-label="Send prompt"], button[aria-label="Send message"]');
            if (!btn) return { ready: false };
            const dis = btn.disabled || btn.getAttribute('aria-disabled') === 'true';
            return { ready: !dis, testid: btn.getAttribute('data-testid'), aria: btn.getAttribute('aria-label') };
        }''')
        r = st.get('result', {})
        if r.get('ready'):
            break

    # Click send button AND press Enter fallback if needed
    eval_js('''() => {
        const btn = document.querySelector('button[aria-label="Send"], button[data-testid="send-button"], button[data-testid="composer-send-button"], button[aria-label="Send prompt"], button[aria-label="Send message"]');
        if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true') {
            btn.click();
            return true;
        }
        return false;
    }''')
    time.sleep(2)

    # Check if submission happened; if composer still full, press Enter
    chk = eval_js('''() => {
        const stop = document.querySelector('button[aria-label="Stop"], button[data-testid="stop-button"], button[aria-label="Stop streaming"]');
        const msgs = document.querySelectorAll('[data-message-author-role="user"]').length;
        const box = document.querySelector('#prompt-textarea') || document.querySelector('div[contenteditable="true"]');
        const len = box ? (box.innerText || box.value || '').trim().length : 0;
        const inThread = location.href.includes('/c/');
        return { stop: !!stop, userMsgs: msgs, composerLen: len, inThread };
    }''')
    r = chk.get('result', {})
    if not r.get('stop') and not r.get('inThread') and r.get('userMsgs', 0) == 0 and r.get('composerLen', 0) > 20:
        post_action({'action': 'press', 'key': 'Enter', 'focusSelector': '#prompt-textarea, div[contenteditable="true"]'})
        time.sleep(2.5)
        chk = eval_js('''() => {
            const stop = document.querySelector('button[aria-label="Stop"], button[data-testid="stop-button"], button[aria-label="Stop streaming"]');
            const msgs = document.querySelectorAll('[data-message-author-role="user"]').length;
            const inThread = location.href.includes('/c/');
            return { stop: !!stop, userMsgs: msgs, inThread };
        }''')
        r = chk.get('result', {})
    return r.get('stop') or r.get('inThread') or r.get('userMsgs', 0) > 0


def wait_for_image(timeout_sec=210):
    start = time.time()
    last_log = 0
    while time.time() - start < timeout_sec:
        time.sleep(5)
        st = eval_js('''() => {
            const stop = document.querySelector('button[aria-label="Stop"], button[data-testid="stop-button"], button[aria-label="Stop streaming"]');
            const imgs = Array.from(document.querySelectorAll('img[alt^="Generated image"], [data-message-author-role="assistant"] img, article img')).filter(i => {
                if (i.closest('form') || i.closest('[data-testid*="attachment"]')) return false;
                if (i.alt === 'User attachment' || (i.alt && i.alt.toLowerCase().includes('profile'))) return false;
                if ((i.src || '').includes('avatars')) return false;
                return (i.naturalWidth >= 400);
            });
            const bodyTxt = document.body.innerText || '';
            const alerts = Array.from(document.querySelectorAll('[role="alert"], .text-token-text-error')).map(a => a.innerText);
            const hasLimit = alerts.some(t => /limit|rate|try again|upgrade|plus|quota/i.test(t)) || /you've reached your image generation limit|try again later|rate limit/i.test(bodyTxt);
            const genDone = bodyTxt.includes('Generated successfully') || (!stop && imgs.length > 0);
            return {
                generating: !!stop,
                imgCount: imgs.length,
                lastSrc: imgs.length ? imgs[imgs.length - 1].src : null,
                lastW: imgs.length ? imgs[imgs.length - 1].naturalWidth : 0,
                lastH: imgs.length ? imgs[imgs.length - 1].naturalHeight : 0,
                hasLimit,
                genDone,
                alerts
            };
        }''')
        r = st.get('result', {})
        elapsed = int(time.time() - start)
        if elapsed - last_log >= 15:
            print(f"  [{elapsed}s] generating={r.get('generating')} imgs={r.get('imgCount')} size={r.get('lastW')}x{r.get('lastH')}")
            last_log = elapsed

        if r.get('hasLimit'):
            return 'LIMIT', r
        if r.get('imgCount', 0) > 0 and not r.get('generating'):
            time.sleep(3)
            st2 = eval_js('''() => {
                const imgs = Array.from(document.querySelectorAll('img[alt^="Generated image"], [data-message-author-role="assistant"] img, article img')).filter(i => {
                    if (i.closest('form') || i.closest('[data-testid*="attachment"]')) return false;
                    if (i.alt === 'User attachment' || (i.src || '').includes('avatars')) return false;
                    return (i.naturalWidth >= 400);
                });
                return imgs.length ? { src: imgs[imgs.length - 1].src, w: imgs[imgs.length - 1].naturalWidth, h: imgs[imgs.length - 1].naturalHeight } : null;
            }''')
            return 'OK', st2.get('result')
    return 'TIMEOUT', None


def download_and_save(img_src, out_dir):
    raw_tmp = os.path.join(out_dir, '_temp_raw_dl.png')
    res = post_action({'action': 'save_image_url', 'url': img_src, 'outPath': raw_tmp}, timeout=45)
    if not res.get('ok') or not os.path.exists(raw_tmp):
        # Fallback: canvas extraction inside page
        c_res = eval_js('''() => {
            const imgs = Array.from(document.querySelectorAll('img[alt^="Generated image"], [data-message-author-role="assistant"] img, article img')).filter(i => {
                if (i.closest('form') || i.closest('[data-testid*="attachment"]')) return false;
                if (i.alt === 'User attachment' || (i.src || '').includes('avatars')) return false;
                return (i.naturalWidth >= 400);
            });
            if (!imgs.length) return null;
            const t = imgs[imgs.length - 1];
            const c = document.createElement('canvas');
            c.width = t.naturalWidth || 1024;
            c.height = t.naturalHeight || 1024;
            c.getContext('2d').drawImage(t, 0, 0);
            return c.toDataURL('image/png').split(',')[1];
        }''')
        b64 = c_res.get('result')
        if not b64:
            return False, f"Fetch failed: {res}"
        import base64
        with open(raw_tmp, 'wb') as f:
            f.write(base64.b64decode(b64))

    im = Image.open(raw_tmp).convert('RGB')
    w, h = im.size
    if w != h:
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        im = im.crop((left, top, left + side, top + side))
    im_1254 = im.resize((1254, 1254), Image.Resampling.LANCZOS)
    webp_path = os.path.join(out_dir, '01_model.webp')
    png_path = os.path.join(out_dir, '01_model.png')
    im_1254.save(webp_path, 'WEBP', quality=95)
    im_1254.save(png_path, 'PNG')
    os.remove(raw_tmp)
    return True, f"Saved 1254x1254 webp ({os.path.getsize(webp_path)} B)"


def main():
    limit_count = int(sys.argv[1]) if len(sys.argv) > 1 else 16
    with open(QUEUE_FILE, 'r', encoding='utf-8') as f:
        queue = json.load(f)
    prog = load_progress()

    done_now = 0
    for item in queue:
        h = item['handle']
        if prog.get(h) == 'done':
            print(f"[SKIP] {item['index']:02d}. {h} already done.")
            continue
        if done_now >= limit_count:
            print(f"[STOP] Reached batch limit ({limit_count}).")
            break

        print(f"\n=== [{item['index']:02d}/16] {item['title']} ({h}) ===")
        if not start_fresh_chat():
            print("  [ERROR] ChatGPT composer did not load on fresh chat.")
            break

        ok_up, msg_up = upload_and_wait(item['ref_jpg'])
        if not ok_up:
            print(f"  [WARN] {msg_up} - retrying once with fresh chat...")
            start_fresh_chat()
            ok_up, msg_up = upload_and_wait(item['ref_jpg'])
            if not ok_up:
                print(f"  [FAIL] Upload failed twice: {msg_up}")
                continue
        print(f"  [OK] Reference uploaded ({os.path.basename(item['ref_jpg'])})")

        if not submit_prompt(item['prompt']):
            print("  [FAIL] Prompt failed to submit cleanly.")
            continue
        print("  [OK] Prompt submitted! Waiting for ChatGPT image generation...")

        status, info = wait_for_image(timeout_sec=210)
        if status == 'LIMIT':
            print(f"  [RATE LIMIT] ChatGPT limit reached: {info}")
            break
        if status != 'OK' or not info or not info.get('src'):
            print(f"  [FAIL] Image generation did not complete: {status}")
            continue

        print(f"  [OK] Image generated ({info.get('w')}x{info.get('h')}) -> downloading...")
        ok_save, msg_save = download_and_save(info['src'], item['out_dir'])
        if ok_save:
            print(f"  [SAVED] {msg_save}")
            prog[h] = 'done'
            save_progress(prog)
            done_now += 1
        else:
            print(f"  [FAIL] Save failed: {msg_save}")

        time.sleep(3)

    print(f"\nBatch finished. Newly generated in this run: {done_now}. Total done in progress: {sum(1 for v in prog.values() if v=='done')}/16")


if __name__ == '__main__':
    main()
