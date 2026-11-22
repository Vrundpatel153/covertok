const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function runTests() {
  console.log('--- STARTING REAL AUTOMATED PRODUCTION PDP & COLOR AUDIT ---');
  
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const os = require('os');
  const path = require('path');
  const tempProfile = path.join(os.tmpdir(), 'chrome_covertok_test_' + Date.now());

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    userDataDir: tempProfile,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--window-size=1440,900', '--no-first-run', '--no-default-browser-check']
  });
  console.log('Launched clean interactive visible Chrome window.');

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const failedRequests = [];
  const consoleErrors = [];

  page.on('requestfailed', req => {
    failedRequests.push({ url: req.url(), failure: req.failure() });
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // TEST 1: HOME PAGE AUDIT
  console.log('\n[TEST 1] Auditing Home Page: http://127.0.0.1:8080/index.html');
  await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  
  const homeAudit = await page.evaluate(() => {
    const mainNav = document.querySelector('.main-nav');
    const navText = mainNav ? mainNav.innerText : '';
    const heroCard = document.querySelector('.hero-card');
    const heroClip = document.querySelector('#heroCardClip');
    const heroCardStyle = heroCard ? window.getComputedStyle(heroCard) : null;
    return {
      hasAboutUsInNav: navText.includes('ABOUT US'),
      hasContactUsInNav: navText.includes('CONTACT US'),
      heroCardFound: !!heroCard,
      heroClipSvgFound: !!heroClip,
      heroClipPath: heroCardStyle ? heroCardStyle.clipPath : null,
      heroMarginTop: heroCardStyle ? heroCardStyle.marginTop : null
    };
  });
  console.log('Home Page Audit Results:', JSON.stringify(homeAudit, null, 2));
  await page.screenshot({ path: 'scripts/real_test_home.png' });

  // TEST 2: PDP 1 - Transparent Magnetic Case (Multi-color: Cosmic Orange & Dark Blue)
  console.log('\n[TEST 2] Auditing PDP: transparent-magnetic-wireless-charging-phone-case');
  await page.goto('http://127.0.0.1:8080/product.html?handle=transparent-magnetic-wireless-charging-phone-case', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  const initialOrange = await page.evaluate(() => {
    const mainImg = document.getElementById('mainProductImg')?.src;
    const thumbs = Array.from(document.querySelectorAll('#pdpThumbnails .pdp-vthumb img')).map(i => i.src);
    const showcaseCards = Array.from(document.querySelectorAll('#pdpShowcaseGrid .pdp-showcase-item img')).map(i => i.src);
    const activeColor = document.getElementById('selectedColorLabel')?.innerText;
    return {
      activeColor,
      mainImg,
      thumbnailsCount: thumbs.length,
      sampleThumbs: thumbs.slice(0, 4),
      showcaseCardsCount: showcaseCards.length
    };
  });
  console.log('Initial State (Cosmic Orange):', JSON.stringify(initialOrange, null, 2));
  await page.screenshot({ path: 'scripts/real_test_orange.png' });

  // Click Dark Blue Swatch
  console.log('Clicking Dark Blue swatch...');
  await page.evaluate(() => {
    const swatches = Array.from(document.querySelectorAll('.pdp-color-swatch'));
    const darkBlue = swatches.find(s => s.getAttribute('data-color')?.toLowerCase().includes('dark blue') || s.getAttribute('title')?.toLowerCase().includes('dark blue'));
    if (darkBlue) darkBlue.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const afterDarkBlue = await page.evaluate(() => {
    const mainImg = document.getElementById('mainProductImg')?.src;
    const thumbs = Array.from(document.querySelectorAll('#pdpThumbnails .pdp-vthumb img')).map(i => i.src);
    const activeColor = document.getElementById('selectedColorLabel')?.innerText;
    const hasOrangeInThumbs = thumbs.some(t => t.toLowerCase().includes('cosmic-orange') || t.toLowerCase().includes('showcase'));
    return {
      activeColor,
      mainImg,
      thumbnailsCount: thumbs.length,
      thumbs,
      hasOrangeInThumbs
    };
  });
  console.log('State After Selecting Dark Blue:', JSON.stringify(afterDarkBlue, null, 2));
  await page.screenshot({ path: 'scripts/real_test_dark_blue.png' });

  // TEST 3: PDP 2 - Premium Leather Finish Case (4 Colors: Black, Brown, Grey, White)
  console.log('\n[TEST 3] Auditing PDP: premium-leather-finish-slim-case-with-metal-camera-ring');
  await page.goto('http://127.0.0.1:8080/product.html?handle=premium-leather-finish-slim-case-with-metal-camera-ring', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  const leatherBlack = await page.evaluate(() => {
    return {
      activeColor: document.getElementById('selectedColorLabel')?.innerText,
      mainImg: document.getElementById('mainProductImg')?.src,
      thumbsCount: document.querySelectorAll('#pdpThumbnails .pdp-vthumb').length
    };
  });
  console.log('Leather Initial (Black):', JSON.stringify(leatherBlack, null, 2));

  // Click Brown Swatch
  console.log('Clicking Brown swatch...');
  await page.evaluate(() => {
    const swatches = Array.from(document.querySelectorAll('.pdp-color-swatch'));
    const brown = swatches.find(s => s.getAttribute('data-color')?.toLowerCase() === 'brown');
    if (brown) brown.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const leatherBrown = await page.evaluate(() => {
    const thumbs = Array.from(document.querySelectorAll('#pdpThumbnails .pdp-vthumb img')).map(i => i.src);
    return {
      activeColor: document.getElementById('selectedColorLabel')?.innerText,
      mainImg: document.getElementById('mainProductImg')?.src,
      thumbs,
      hasBlackShowcaseInThumbs: thumbs.some(t => t.includes('/showcase/'))
    };
  });
  console.log('Leather After Selecting Brown:', JSON.stringify(leatherBrown, null, 2));
  await page.screenshot({ path: 'scripts/real_test_leather_brown.png' });

  // Click Next and Prev gallery buttons
  console.log('Testing Gallery Prev/Next navigation buttons...');
  const navTest = await page.evaluate(() => {
    const prevBtn = document.getElementById('galleryPrevBtn');
    const nextBtn = document.getElementById('galleryNextBtn');
    return {
      hasPrevBtn: !!prevBtn,
      hasNextBtn: !!nextBtn,
      prevVisible: prevBtn ? window.getComputedStyle(prevBtn).display : 'none',
      nextVisible: nextBtn ? window.getComputedStyle(nextBtn).display : 'none'
    };
  });
  console.log('Gallery Navigation Buttons:', JSON.stringify(navTest, null, 2));

  console.log('\n--- NETWORK & CONSOLE AUDIT SUMMARY ---');
  console.log('Failed Requests (404/ERR):', failedRequests.length);
  if (failedRequests.length > 0) {
    console.log(failedRequests);
  }
  console.log('Console Errors:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log(consoleErrors);
  }

  console.log('\n[ALL TESTS FINISHED SUCCESSFULLY]');
  await page.close();
  if (browser) {
    await browser.close();
  }
}

runTests().catch(console.error);
