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

  for (const u of urls) {
    await page.goto(u, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
    // Scroll down to trigger lazy images
    await page.evaluate(async () => {
      for (let y = 0; y <= document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 120));
      }
    });
    await new Promise(r => setTimeout(r, 1200));

    const report = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const broken = [];
      let loaded = 0;
      for (const img of imgs) {
        const src = img.getAttribute('src') || '';
        if (!src || src.startsWith('data:')) continue;
        // Skip hidden off-screen video fallback if hidden? No check all!
        if (!img.complete || img.naturalWidth === 0) {
          broken.push({
            src: src,
            alt: img.alt || '',
            cls: img.className || ''
          });
        } else {
          loaded++;
        }
      }
      return { totalImgs: imgs.length, loaded, broken };
    });
    console.log(`URL: ${u} | imgs=${report.totalImgs} loaded=${report.loaded} broken=${report.broken.length}`);
    for (const b of report.broken.slice(0, 20)) {
      console.log('   BROKEN IMG:', b.alt, '->', b.src);
    }
  }

  // Also test desktop 1440px homepage
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://covertok.vercel.app/index.html', { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 100));
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  const deskRep = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const broken = imgs.filter(i => i.getAttribute('src') && !i.getAttribute('src').startsWith('data:') && (!i.complete || i.naturalWidth === 0))
                       .map(i => ({ src: i.getAttribute('src'), alt: i.alt }));
    return { total: imgs.length, broken };
  });
  console.log(`DESKTOP index.html | imgs=${deskRep.total} broken=${deskRep.broken.length}`);
  for (const b of deskRep.broken) console.log('   DESK BROKEN:', b.alt, '->', b.src);

  console.log(`\nTotal >=400 network responses: ${failed404.length}`);
  for (const f of [...new Set(failed404.map(x => `${x.status} ${x.url}`))]) {
    console.log('  NET ERR:', f);
  }

  await browser.close();
})();
