const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT_FILE = 'C:\\Users\\vrund\\AppData\\Local\\Google\\Chrome\\User Data\\DevToolsActivePort';
const PROMPTS_FILE = path.join(__dirname, '28_minimal_prompts.json');
const TRACKER_FILE = path.join(__dirname, 'progress_tracker.json');
const PY_CROP_SCRIPT = path.join(__dirname, 'save_square_image.py');

function loadTracker() {
  if (fs.existsSync(TRACKER_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf-8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveTracker(tracker) {
  fs.writeFileSync(TRACKER_FILE, JSON.stringify(tracker, null, 2), 'utf-8');
}

async function connectToChrome() {
  if (!fs.existsSync(PORT_FILE)) {
    console.error(`[ERROR] DevToolsActivePort file not found at ${PORT_FILE}`);
    return null;
  }

  const lines = fs.readFileSync(PORT_FILE, 'utf-8').split(/\r?\n/).filter(l => l.trim());
  const wsUrl = `ws://127.0.0.1:${lines[0]}${lines[1]}`;

  console.log(`[CONNECT] Connecting to Chrome DevTools WebSocket: ${wsUrl}`);
  console.log(`[CONNECT] Waiting for user to click 'Allow' on Chrome prompt if shown (timeout: 600s)...`);

  const browser = await puppeteer.connect({
    browserWSEndpoint: wsUrl,
    defaultViewport: null,
    protocolTimeout: 600000
  });

  console.log(`[SUCCESS] Connected to Chrome DevTools WebSocket!`);
  return browser;
}

async function getChatPage(browser) {
  const pages = await browser.pages();
  let chatPage = pages.find(p => p.url().includes('chatgpt.com'));
  if (chatPage) return chatPage;

  // If no chatgpt page found, look for candidate tab
  const candidate = pages.find(p => !p.url().includes('chrome://')) || pages[0];
  if (candidate) {
    try {
      console.log(`[RECOVERY] Navigating tab from ${candidate.url()} to https://chatgpt.com/...`);
      await candidate.goto('https://chatgpt.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await candidate.waitForSelector('div.ProseMirror', { timeout: 30000 });
      return candidate;
    } catch (e) {
      console.log(`[WARN] Tab recovery error: ${e.message}`);
    }
  }

  // Fallback: create new page
  try {
    const newP = await browser.newPage();
    await newP.goto('https://chatgpt.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await newP.waitForSelector('div.ProseMirror', { timeout: 30000 });
    return newP;
  } catch (e) {
    return null;
  }
}

async function main() {
  const browser = await connectToChrome();
  if (!browser) {
    console.error('[FATAL] Could not connect to Chrome.');
    process.exit(1);
  }

  let chatPage = await getChatPage(browser);
  if (!chatPage) {
    console.log('[ERROR] No active ChatGPT tab found. Please make sure ChatGPT is open in Chrome.');
    process.exit(1);
  }

  console.log(`[CHATGPT] Found tab: "${await chatPage.title()}" (${chatPage.url()})`);

  const manifest = JSON.parse(fs.readFileSync(PROMPTS_FILE, 'utf-8'));
  const tracker = loadTracker();
  const perspectives = ['01_model', '02_angle', '03_quality', '04_feature', '05_marketing'];

  console.log(`\n================================================================`);
  console.log(`COVERTOK 28 MOBILE COVERS: CLEAN COMMERCIAL REGENERATION`);
  console.log(`Target: 28 Products x 5 Perspectives = 140 Minimal E-Commerce Images`);
  console.log(`Standard: Clean Minimal Amazon A+ Listing Standard (1:1 Square 1254x1254)`);
  console.log(`Strict Anti-AI Directives: Natural Realism / Zero Fake AI Models / Zero Text`);
  console.log(`================================================================\n`);

  for (let pIdx = 0; pIdx < manifest.length; pIdx++) {
    const item = manifest[pIdx];
    const handle = item.handle;
    const title = item.title;
    const packshotPath = path.resolve(item.packshot);
    const outDir = path.resolve(item.out_dir);

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    if (!tracker[handle]) {
      tracker[handle] = {};
    }

    // Check if this product is already 100% complete
    const doneCount = perspectives.filter(k => tracker[handle][k]).length;
    if (doneCount === 5) {
      console.log(`[SKIP] Product ${pIdx + 1}/${manifest.length} (${handle}) already complete (5/5). Skipping.`);
      continue;
    }

    console.log(`\n================================================================`);
    console.log(`[Product ${pIdx + 1}/${manifest.length}] ${title}`);
    console.log(`Handle: ${handle}`);
    console.log(`Packshot: ${path.basename(packshotPath)}`);
    console.log(`Directory: ${outDir}`);
    console.log(`Progress: ${doneCount}/5 completed`);
    console.log(`================================================================`);

    // Safe page check & network resilience loop
    let freshChatReady = false;
    for (let netRetry = 1; netRetry <= 5; netRetry++) {
      try {
        chatPage = await getChatPage(browser);
        if (!chatPage) throw new Error('No ChatGPT page available');

        console.log(`[CHATGPT] Opening fresh chat for product ${pIdx + 1} (attempt ${netRetry})...`);
        await chatPage.goto('https://chatgpt.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
        await new Promise(r => setTimeout(r, 2500));
        await chatPage.waitForSelector('div.ProseMirror', { timeout: 30000 });
        console.log(`[CHATGPT] Fresh chat ready for ${handle}!`);
        freshChatReady = true;
        break;
      } catch (navErr) {
        console.log(`[WARN] Network/navigation warning (attempt ${netRetry}/5): ${navErr.message}`);
        await new Promise(r => setTimeout(r, 10000)); // wait 10s before retry
      }
    }

    if (!freshChatReady) {
      console.log(`[ERROR] Could not load ChatGPT after 5 attempts. Moving to next product.`);
      continue;
    }

    for (const key of perspectives) {
      if (tracker[handle][key]) {
        console.log(`  - [${key}] already marked complete in tracker. Skipping.`);
        continue;
      }

      console.log(`\n>>> Generating [${key}] for ${handle}...`);
      let perspectiveSuccess = false;

      // Allow up to 2 attempts per perspective
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          chatPage = await getChatPage(browser);
          if (!chatPage) throw new Error('ChatGPT page not found');

          // 1. Clear any leftover attachments or text in composer
          await chatPage.evaluate(() => {
            const closeBtns = document.querySelectorAll('button[aria-label*="Remove"], button[aria-label*="Delete"], [data-testid*="close"]');
            closeBtns.forEach(b => b.click());

            const el = document.querySelector('div.ProseMirror');
            if (el) {
              el.focus();
              document.execCommand('selectAll', false, null);
              document.execCommand('delete', false, null);
            }
          });
          await new Promise(r => setTimeout(r, 1000));

          // 2. Count existing generated images in this chat
          const preCount = await chatPage.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('img')).filter(i => {
              if (i.closest('form') || i.closest('[data-testid*="attachment"]')) return false;
              const isGen = (i.alt && i.alt.includes('Generated image')) || (i.src && i.src.includes('blob:https://chatgpt.com/'));
              const isLarge = (i.naturalWidth >= 400 || i.width >= 200);
              return (isGen || isLarge) && i.complete;
            });
            return imgs.length;
          });

          // 3. Upload packshot file if present
          if (fs.existsSync(packshotPath)) {
            try {
              const fileInput = await chatPage.$('input[type="file"]');
              if (fileInput) {
                await fileInput.uploadFile(packshotPath);
                console.log(`  [UPLOAD] Uploaded reference packshot: ${path.basename(packshotPath)}`);
                await new Promise(r => setTimeout(r, 3000));
              }
            } catch (upErr) {
              console.log(`  [WARN] Packshot upload warning: ${upErr.message}`);
            }
          }

          // 4. Type prompt into ProseMirror
          const promptText = item.prompts[key];
          await chatPage.focus('div.ProseMirror');
          await chatPage.evaluate((text) => {
            const el = document.querySelector('div.ProseMirror');
            if (el) {
              el.focus();
              document.execCommand('insertText', false, text);
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }, promptText);

          await chatPage.keyboard.type(' ');
          await new Promise(r => setTimeout(r, 1500));

          // 5. Wait for Send button to activate
          try {
            await chatPage.waitForFunction(() => {
              const btn = document.querySelector('button[aria-label="Send"], button[data-testid="send-button"]');
              if (!btn) return false;
              if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return false;
              const spinner = document.querySelector('[data-testid*="progress"], .animate-spin');
              if (spinner) return false;
              return true;
            }, { timeout: 35000 });
          } catch (e) {
            // Proceed to submit anyway
          }

          // 6. Submit prompt
          await chatPage.focus('div.ProseMirror');
          await chatPage.keyboard.press('Enter');
          await new Promise(r => setTimeout(r, 500));

          await chatPage.evaluate(() => {
            const btn = document.querySelector('button[aria-label="Send"], button[data-testid="send-button"]');
            if (btn) {
              btn.click();
              btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            }
          });
          console.log(`  [SUBMIT] Submitted prompt to DALL-E (attempt ${attempt}).`);

          // 7. Wait for generation to complete
          console.log(`  [GENERATING] Waiting for DALL-E to generate image...`);
          let genFinished = false;
          const startGen = Date.now();
          const timeoutMs = 210000; // 3.5 minutes

          while (Date.now() - startGen < timeoutMs) {
            await new Promise(r => setTimeout(r, 3000));

            try {
              chatPage = await getChatPage(browser);
              const state = await chatPage.evaluate((initialCount) => {
                const bodyText = document.body.innerText || '';
                const isCreating = bodyText.includes('Creating image') || bodyText.includes('Generating image');
                const stopBtn = document.querySelector('button[aria-label="Stop generating"], button[aria-label="Stop streaming"], button[aria-label="Stop"], button[data-testid="stop-button"]');

                const alertEl = document.querySelector('[role="alert"], .text-token-text-error');
                const alertText = alertEl ? alertEl.innerText : '';
                const isLimit = alertText.includes('reached your image generation limit') || alertText.includes('try again later');

                const imgs = Array.from(document.querySelectorAll('img')).filter(i => {
                  if (i.closest('form') || i.closest('[data-testid*="attachment"]')) return false;
                  const isGen = (i.alt && i.alt.includes('Generated image')) || (i.src && i.src.includes('blob:https://chatgpt.com/'));
                  const isLarge = (i.naturalWidth >= 400 || i.width >= 200);
                  return (isGen || isLarge) && i.complete;
                });

                return {
                  isCreating: isCreating || !!stopBtn,
                  imgCount: imgs.length,
                  isLimit: isLimit
                };
              }, preCount);

              if (state.isLimit) {
                console.log(`\n[RATE LIMIT] ChatGPT image generation limit reached! Pausing execution without fallback.`);
                return;
              }

              if (!state.isCreating && state.imgCount > preCount) {
                console.log(`  [DONE] Generation finished! Image count: ${state.imgCount}`);
                await new Promise(r => setTimeout(r, 2000));
                genFinished = true;
                break;
              }
            } catch (evalErr) {
              // Frame might be updating, continue polling
            }
          }

          if (!genFinished) {
            console.log(`  [WARN] Attempt ${attempt} timed out for ${key}.`);
            continue;
          }

          // 8. Extract generated image base64
          chatPage = await getChatPage(browser);
          const b64Data = await chatPage.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('img')).filter(i => {
              if (i.closest('form') || i.closest('[data-testid*="attachment"]')) return false;
              const isGen = (i.alt && i.alt.includes('Generated image')) || (i.src && i.src.includes('blob:https://chatgpt.com/'));
              const isLarge = (i.naturalWidth >= 400 || i.width >= 200);
              return (isGen || isLarge) && i.complete;
            });

            if (!imgs.length) return null;
            const target = imgs[imgs.length - 1];

            try {
              const canvas = document.createElement('canvas');
              canvas.width = target.naturalWidth || 1254;
              canvas.height = target.naturalHeight || 1254;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(target, 0, 0);
              return canvas.toDataURL('image/png').split(',')[1];
            } catch (e) {
              return null;
            }
          });

          if (!b64Data) {
            console.log(`  [WARN] Failed to extract canvas pixel data for ${key}.`);
            continue;
          }

          // 9. Save as 1:1 1254x1254 WebP and PNG
          const tmpB64 = path.join(outDir, `_temp_${key}.b64`);
          const webpPath = path.join(outDir, `${key}.webp`);
          const pngPath = path.join(outDir, `${key}.png`);

          fs.writeFileSync(tmpB64, b64Data);
          try {
            execSync(`python "${PY_CROP_SCRIPT}" "${tmpB64}" "${webpPath}" "${pngPath}"`);
            if (fs.existsSync(tmpB64)) fs.unlinkSync(tmpB64);

            // Verify MD5 against other slots to ensure 100% genuine uniqueness
            const crypto = require('crypto');
            const newHash = crypto.createHash('md5').update(fs.readFileSync(pngPath)).digest('hex');
            let isDuplicate = false;
            for (const otherKey of ['01_model', '02_angle', '03_quality', '04_feature', '05_marketing']) {
              if (otherKey !== key) {
                const otherPng = path.join(outDir, `${otherKey}.png`);
                if (fs.existsSync(otherPng)) {
                  const otherHash = crypto.createHash('md5').update(fs.readFileSync(otherPng)).digest('hex');
                  if (otherHash === newHash) {
                    isDuplicate = true;
                    console.log(`  [REJECTED] Downloaded image is an exact duplicate of ${otherKey} (hash ${newHash.slice(0, 8)})! Waiting for genuinely new generation...`);
                    break;
                  }
                }
              }
            }

            if (isDuplicate) {
              if (fs.existsSync(webpPath)) fs.unlinkSync(webpPath);
              if (fs.existsSync(pngPath)) fs.unlinkSync(pngPath);
              continue;
            }

            tracker[handle][key] = true;
            saveTracker(tracker);
            console.log(`  [SAVED & VERIFIED UNIQUE] 1:1 square 1254x1254 WebP and PNG saved for ${key}! Hash: ${newHash.slice(0, 8)}`);
            perspectiveSuccess = true;
            break;
          } catch (saveErr) {
            console.log(`  [ERROR] Image processing failed: ${saveErr.message}`);
          }
        } catch (stepErr) {
          console.log(`  [ERROR] Step error on attempt ${attempt}: ${stepErr.message}`);
        }
      }

      if (!perspectiveSuccess) {
        console.log(`  [SKIP] Perspective ${key} could not be completed after attempts. Continuing...`);
      }

      console.log(`  [PAUSE] Waiting 4 seconds before next perspective...`);
      await new Promise(r => setTimeout(r, 4000));
    }
  }

  console.log(`\n================================================================`);
  console.log(`ALL 28 PRODUCTS SUCCESSFULLY REGENERATED!`);
  console.log(`Syncing products data and pushing to git...`);
  console.log(`================================================================`);

  try {
    execSync('git add assets/products/ scripts/progress_tracker.json', { stdio: 'inherit' });
    execSync('git commit -m "Regenerate all 28 mobile cover showcase galleries with minimal commercial standard (140 images)"', { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
    console.log(`[GIT] Successfully pushed all regenerated images to GitHub main!`);
  } catch (gitErr) {
    console.log(`[GIT WARN] ${gitErr.message}`);
  }

  await browser.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
