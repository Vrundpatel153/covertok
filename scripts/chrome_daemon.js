const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const PORT_FILE = 'C:\\Users\\vrund\\AppData\\Local\\Google\\Chrome\\User Data\\DevToolsActivePort';
const HTTP_PORT = 9333;

let browser = null;
let connecting = false;
let lastError = null;

function readWsEndpoint() {
  if (!fs.existsSync(PORT_FILE)) return null;
  const lines = fs.readFileSync(PORT_FILE, 'utf-8').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  return `ws://127.0.0.1:${lines[0]}${lines[1]}`;
}

async function ensureConnected() {
  if (browser && browser.connected) return browser;
  if (connecting) return null;
  const wsUrl = readWsEndpoint();
  if (!wsUrl) {
    lastError = 'DevToolsActivePort missing';
    return null;
  }
  connecting = true;
  try {
    console.log(`[DAEMON] Connecting to ${wsUrl} ... (Click Allow on Chrome if prompted)`);
    browser = await puppeteer.connect({ browserWSEndpoint: wsUrl, defaultViewport: null });
    lastError = null;
    console.log('[DAEMON] CONNECTED to Chrome!');
    browser.on('disconnected', () => {
      console.log('[DAEMON] Chrome disconnected.');
      browser = null;
    });
    return browser;
  } catch (e) {
    lastError = e.message;
    console.log('[DAEMON] Connect attempt failed:', e.message);
    browser = null;
    return null;
  } finally {
    connecting = false;
  }
}

async function getChatPage() {
  if (!browser || !browser.connected) return null;
  const pages = await browser.pages();
  return pages.find(p => p.url().includes('chatgpt.com')) || pages[0] || null;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'GET' && req.url === '/status') {
    const connected = !!(browser && browser.connected);
    let tabs = [];
    if (connected) {
      try {
        const pages = await browser.pages();
        for (const p of pages) {
          tabs.push({ url: p.url(), title: await p.title().catch(() => '') });
        }
      } catch (e) {}
    }
    res.end(JSON.stringify({ connected, connecting, lastError, wsEndpoint: readWsEndpoint(), tabs }));
    return;
  }

  if (req.method === 'POST' && req.url === '/action') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        if (!browser || !browser.connected) {
          res.statusCode = 503;
          res.end(JSON.stringify({ ok: false, error: 'Not connected to Chrome yet' }));
          return;
        }
        const page = await getChatPage();
        if (!page) {
          res.statusCode = 404;
          res.end(JSON.stringify({ ok: false, error: 'No page found' }));
          return;
        }

        const { action } = payload;
        if (action === 'screenshot') {
          const outPath = payload.path || 'scripts/daemon_snap.png';
          await page.bringToFront();
          await page.screenshot({ path: outPath });
          res.end(JSON.stringify({ ok: true, path: outPath }));
        } else if (action === 'goto') {
          await page.bringToFront();
          await page.goto(payload.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          res.end(JSON.stringify({ ok: true, url: page.url() }));
        } else if (action === 'eval') {
          const fn = new Function('return (' + payload.fn + ')');
          const result = await page.evaluate(fn(), ...(payload.args || []));
          res.end(JSON.stringify({ ok: true, result }));
        } else if (action === 'upload') {
          await page.bringToFront();
          const fileInput = await page.$('input[type="file"]');
          if (!fileInput) {
            res.end(JSON.stringify({ ok: false, error: 'No input[type=file] found' }));
            return;
          }
          await fileInput.uploadFile(payload.filePath);
          res.end(JSON.stringify({ ok: true }));
        } else if (action === 'type_and_send') {
          await page.bringToFront();
          const selector = '#prompt-textarea, div[contenteditable="true"]';
          const el = await page.$(selector);
          if (!el) {
            res.end(JSON.stringify({ ok: false, error: 'Composer not found' }));
            return;
          }
          await el.click();
          // Select all & clear existing text cleanly
          await page.keyboard.down('Control');
          await page.keyboard.press('A');
          await page.keyboard.up('Control');
          await page.keyboard.press('Backspace');
          await new Promise(r => setTimeout(r, 200));
          // Insert text reliably into ProseMirror/contenteditable
          await page.evaluate((text) => {
            const box = document.querySelector('#prompt-textarea') || document.querySelector('div[contenteditable="true"]');
            if (box) {
              box.focus();
              document.execCommand('insertText', false, text);
            }
          }, payload.text);
          await new Promise(r => setTimeout(r, 500));
          if (payload.submit) {
            await page.keyboard.press('Enter');
          }
          res.end(JSON.stringify({ ok: true }));
        } else if (action === 'press') {
          await page.bringToFront();
          if (payload.focusSelector) {
            const el = await page.$(payload.focusSelector);
            if (el) await el.focus();
          }
          await page.keyboard.press(payload.key || 'Enter');
          res.end(JSON.stringify({ ok: true }));
        } else if (action === 'click_selector') {
          await page.bringToFront();
          const clicked = await page.evaluate((sel) => {
            const btn = document.querySelector(sel);
            if (!btn) return false;
            btn.click();
            return true;
          }, payload.selector);
          res.end(JSON.stringify({ ok: true, clicked }));
        } else if (action === 'save_image_url') {
          // Fetch image inside page context (using page cookies/auth!) and return base64 OR save directly
          const b64 = await page.evaluate(async (imgSrc) => {
            try {
              const resp = await fetch(imgSrc);
              const blob = await resp.blob();
              return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            } catch (e) {
              return { error: e.message };
            }
          }, payload.url);
          if (b64 && typeof b64 === 'string') {
            fs.writeFileSync(payload.outPath, Buffer.from(b64, 'base64'));
            res.end(JSON.stringify({ ok: true, bytes: fs.statSync(payload.outPath).size }));
          } else {
            res.end(JSON.stringify({ ok: false, error: b64 ? b64.error : 'Empty fetch' }));
          }
        } else {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: 'Unknown action: ' + action }));
        }
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ ok: false, error: 'Not found' }));
});

server.listen(HTTP_PORT, '127.0.0.1', () => {
  console.log(`[DAEMON] Control server listening on http://127.0.0.1:${HTTP_PORT}`);
  ensureConnected();
  setInterval(() => {
    if (!browser || !browser.connected) {
      ensureConnected();
    }
  }, 4000);
});
