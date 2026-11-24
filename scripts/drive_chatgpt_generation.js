const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT_FILE = 'C:\\Users\\vrund\\AppData\\Local\\Google\\Chrome\\User Data\\DevToolsActivePort';
const PROMPTS_FILE = path.join(__dirname, '28_minimal_prompts.json');

// Products that are already completed:
const COMPLETED_HANDLES = new Set([
  'aluminium-frame-transparent-case',
  'crystal-studded-luxe-case-orange',
  'luxury-crossbody-wallet-phone-case',
  'luxury-steel-blue-heart-sparkle-phone-case-with-pearl-chain',
  'pastel-heart-print-soft-silicone-phone-case',
  'phone-cover-with-built-in-lip-balm-holder-copy-copy-6',
  'premium-bowknot-phone-case-with-detachable-pearl-bracelet',
  'premium-leather-finish-slim-case-with-metal-camera-ring',
  'silver-3d-love-heart-phone-case-copy',
  'transparent-magnetic-wireless-charging-phone-case',
  'ultra-clear-sideless-anti-yellow-back-case',
  'wavy-edge-transparent-shockproof-pastel-cover'
]);

async function connectToChrome() {
  console.log('[WATCHER] Waiting for Chrome remote debugging to be enabled...');
  let browser = null;
  let attempt = 0;

  while (!browser) {
    attempt++;
    if (!fs.existsSync(PORT_FILE)) {
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    try {
      const lines = fs.readFileSync(PORT_FILE, 'utf-8').split(/\r?\n/).filter(l => l.trim());
      const port = lines[0];
      const browserPath = lines[1];
      const wsUrl = `ws://127.0.0.1:${port}${browserPath}`;

      if (attempt % 5 === 1) {
        console.log(`[ATTEMPT ${attempt}] Trying to connect to: ${wsUrl}`);
        console.log(`>>> PLEASE CLICK 'ALLOW' ON THE CHROME PROMPT IF VISIBLE <<<`);
      }

      browser = await Promise.race([
        puppeteer.connect({ browserWSEndpoint: wsUrl, defaultViewport: null }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 4000))
      ]);

      console.log(`\n=============================================================`);
      console.log(`[SUCCESS] Connected to Chrome DevTools WebSocket!`);
      console.log(`=============================================================\n`);
      break;
    } catch (e) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  return browser;
}

async function run() {
  const browser = await connectToChrome();
  const pages = await browser.pages();
  let chatPage = pages.find(p => p.url().includes('chatgpt.com'));

  if (!chatPage) {
    console.log('[PUPPETEER] Navigating to ChatGPT conversation...');
    chatPage = await browser.newPage();
    await chatPage.goto('https://chatgpt.com/c/6b03a0cf-bbc4-83ee-a119-794fc2326d1b', { waitUntil: 'networkidle2' });
  }

  console.log(`[PUPPETEER] Active ChatGPT Tab: ${await chatPage.title()} (${chatPage.url()})`);

  const manifest = JSON.parse(fs.readFileSync(PROMPTS_FILE, 'utf-8'));
  const remaining = manifest.filter(item => !COMPLETED_HANDLES.has(item.handle));

  console.log(`[PIPELINE] Remaining lifestyle model photos to generate: ${remaining.length} of 28\n`);

  for (let i = 0; i < remaining.length; i++) {
    const item = remaining[i];
    const handle = item.handle;
    const title = item.title;
    const outDir = path.resolve(item.out_dir);
    const webpPath = path.join(outDir, '01_model.webp');
    const pngPath = path.join(outDir, '01_model.png');
    const packshotPath = path.resolve(item.packshot);

    console.log(`\n[${i + 1}/${remaining.length}] Generating Model for: ${title} (${handle})`);

    // 1. Upload packshot file if available
    try {
      const fileInput = await chatPage.$('input[type="file"]');
      if (fileInput && fs.existsSync(packshotPath)) {
        await fileInput.uploadFile(packshotPath);
        console.log(`[PUPPETEER] Uploaded reference packshot: ${path.basename(packshotPath)}`);
        await new Promise(r => setTimeout(r, 2500));
      }
    } catch (err) {
      console.log(`[WARN] File upload warning: ${err.message}`);
    }

    // 2. Count existing assistant images before generating
    const preCount = await chatPage.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('[data-message-author-role="assistant"] img, article img')).filter(i => {
        if (i.closest('form') || i.closest('[data-testid*="attachment"]')) return false;
        return (i.naturalWidth >= 200 || i.width >= 200);
      });
      return imgs.length;
    });

    // 3. Type model prompt into composer
    const promptText = item.prompts['01_model'];
    await chatPage.evaluate((text) => {
      const el = document.querySelector('#prompt-textarea') || document.querySelector('div[contenteditable="true"]');
      if (el) {
        el.focus();
        if (el.tagName === 'TEXTAREA') {
          el.value = text;
        } else {
          el.innerText = text;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, promptText);

    // 4. Wait for Send button
    console.log('[PUPPETEER] Waiting for send button...');
    try {
      await chatPage.waitForFunction(() => {
        const btn = document.querySelector('button[data-testid="send-button"], button[aria-label="Send prompt"]');
        if (!btn) return false;
        if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return false;
        return true;
      }, { timeout: 30000 });
    } catch (e) {
      console.log('[WARN] Send button wait timed out, continuing...');
    }

    // 5. Click Send
    await chatPage.evaluate(() => {
      const btn = document.querySelector('button[data-testid="send-button"], button[aria-label="Send prompt"]');
      if (btn) btn.click();
    });
    console.log('[PUPPETEER] Sent prompt to ChatGPT. Waiting for DALL-E generation...');

    // 6. Wait for image generation to complete
    let generated = false;
    const startGen = Date.now();
    const timeoutMs = 240000;

    while (Date.now() - startGen < timeoutMs) {
      await new Promise(r => setTimeout(r, 4000));

      const state = await chatPage.evaluate(() => {
        const stopBtn = document.querySelector('button[data-testid="stop-button"], button[aria-label="Stop streaming"]');
        const imgs = Array.from(document.querySelectorAll('[data-message-author-role="assistant"] img, article img')).filter(i => {
          if (i.closest('form') || i.closest('[data-testid*="attachment"]')) return false;
          return (i.naturalWidth >= 200 || i.width >= 200);
        });
        const alertEl = document.querySelector('[role="alert"], .text-token-text-error');
        const isLimit = alertEl && (alertEl.innerText.includes('limit') || alertEl.innerText.includes('try again'));
        return { generating: !!stopBtn, imgCount: imgs.length, isLimit };
      });

      if (state.isLimit) {
        console.log('[RATE LIMIT] ChatGPT image limit encountered.');
        return;
      }

      if (state.imgCount > preCount && !state.generating) {
        console.log(`[PUPPETEER] Generation complete! Image count: ${state.imgCount}`);
        await new Promise(r => setTimeout(r, 2000));
        generated = true;
        break;
      }
    }

    if (!generated) {
      console.log(`[WARN] Generation timed out for ${handle}`);
      continue;
    }

    // 7. Extract image canvas bytes
    const b64Data = await chatPage.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('[data-message-author-role="assistant"] img, article img')).filter(i => {
        if (i.closest('form') || i.closest('[data-testid*="attachment"]')) return false;
        return (i.naturalWidth >= 200 || i.width >= 200);
      });
      if (!imgs.length) return null;
      const target = imgs[imgs.length - 1];
      const canvas = document.createElement('canvas');
      canvas.width = target.naturalWidth || 1024;
      canvas.height = target.naturalHeight || 1024;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(target, 0, 0);
      return canvas.toDataURL('image/png').split(',')[1];
    });

    if (b64Data) {
      const tmpFile = path.join(outDir, `_temp_model.b64`);
      fs.writeFileSync(tmpFile, b64Data);
      try {
        const pyScript = path.join(__dirname, 'save_square_image.py');
        execSync(`python "${pyScript}" "${tmpFile}" "${webpPath}" "${pngPath}"`);
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        console.log(`[SUCCESS] Saved 1:1 1254x1254 model image for ${handle}!`);
        COMPLETED_HANDLES.add(handle);
      } catch (err) {
        console.log(`[ERROR] Processing failed: ${err.message}`);
      }
    }

    await new Promise(r => setTimeout(r, 5000));
  }

  console.log('\n[COMPLETE] All remaining models processed!');
}

run().catch(console.error);
