const puppeteer = require('puppeteer-core');
const CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_EXE,
    headless: false,
    userDataDir: 'C:\\Users\\vrund\\AppData\\Local\\Google\\Chrome\\AutomationData',
    defaultViewport: { width: 390, height: 844 },
    args: ['--no-first-run', '--no-default-browser-check', '--disable-session-crashed-bubble']
  });

  const page = await browser.newPage();

  const failed404 = [];
  page.on('response', res => {
    if (res.status() >= 400 && !res.url().includes('favicon')) {
      failed404.push({ url: res.url(), status: res.status() });
    }
  });

  const urls = [
    'https://covertok.vercel.app/index.html',
    'https://covertok.vercel.app/collections.html',
    'https://covertok.vercel.app/collections.html?page=2',
    'https://covertok.vercel.app/collections.html?page=3',
    'https://covertok.vercel.app/collections.html?page=4',
    'https://covertok.vercel.app/collections.html?page=5',
    'https://covertok.vercel.app/collections.html?page=6',
    'https://covertok.vercel.app/collections.html?page=7',
    'https://covertok.vercel.app/combo.html',
    'https://covertok.vercel.app/search.html?q=case',
  ];

  let totalBrokenAll = 0;
  for (const u of urls) {
    await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate(async () => {
      for (let y = 0; y <= document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 100));
      }
      // Wait for all non-data imgs on page to finish loading (up to 10s)
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        const pending = Array.from(document.querySelectorAll('img')).filter(i => {
          const s = i.getAttribute('src') || '';
          return s && !s.startsWith('data:') && !i.complete;
        });
        if (pending.length === 0) break;
        await new Promise(r => setTimeout(r, 250));
      }
    });

    const report = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const broken = [];
      let loaded = 0;
      for (const img of imgs) {
        const src = img.getAttribute('src') || '';
        if (!src || src.startsWith('data:')) continue;
        if (!img.complete || img.naturalWidth === 0) {
          broken.push({ src, alt: img.alt || '', cls: img.className || '' });
        } else {
          loaded++;
        }
      }
      return { totalImgs: imgs.length, loaded, broken };
    });
    totalBrokenAll += report.broken.length;
    console.log(`URL: ${u} | imgs=${report.totalImgs} loaded=${report.loaded} broken=${report.broken.length}`);
    for (const b of report.broken.slice(0, 10)) {
      console.log('   BROKEN:', b.alt, '->', b.src);
    }

    if (u.endsWith('collections.html?page=5')) {
      await page.evaluate(() => window.scrollTo(0, 500));
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: 'scripts/live_audit_col_page5.png' });
    }
  }

  // Screenshot mobile index popular covers slider (around Steel Blue Heart)
  await page.goto('https://covertok.vercel.app/index.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  await page.evaluate(() => {
    const el = document.querySelector('.popular-row-covers');
    if (el) el.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'scripts/live_audit_home_popular.png' });

  console.log(`\nSUMMARY: totalBroken=${totalBrokenAll} | HTTP>=400=${failed404.length}`);
  for (const f of [...new Set(failed404.map(x => `${x.status} ${x.url}`))]) {
    console.log('  NET ERR:', f);
  }

  await browser.close();
})();
