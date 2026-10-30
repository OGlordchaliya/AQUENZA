const { spawn } = require('child_process');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const VIEWPORTS = [320, 360, 375, 390, 414, 480, 768, 820, 1024, 1280, 1440, 1920];
const PAGES = [
  '/',
  '/catalogue.html',
  '/about.html',
  '/contact.html',
  '/how-it-works.html',
  '/services.html',
  '/qr-solutions.html',
  '/qr-company',
  '/qr/the-royal-bistro',
  '/admin/login.html'
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('--- STARTING COMPREHENSIVE VIEWPORT AUDIT ---');
  
  // Launch Chrome headless with generous bounds
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-debugging-port=9222',
    '--window-size=1920,1080',
    'about:blank'
  ]);

  chromeProcess.on('error', (err) => {
    console.error('Failed to launch Chrome:', err);
    process.exit(1);
  });

  // Wait for Chrome to open port
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      targets = await httpGetJson('http://127.0.0.1:9222/json');
      if (targets && targets.length > 0) break;
    } catch (e) {}
  }

  if (!targets || targets.length === 0) {
    console.error('Could not connect to Chrome DevTools port');
    chromeProcess.kill();
    process.exit(1);
  }

  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const wsUrl = pageTarget.webSocketDebuggerUrl;
  console.log(`Connected to CDP target: ${wsUrl}`);

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((resolve) => ws.onopen = resolve);

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');
  await sendCommand('DOM.enable');

  let totalTests = 0;
  let passedTests = 0;
  let failures = [];

  for (const width of VIEWPORTS) {
    const height = Math.round(width * 1.6);
    console.log(`\n==============================================`);
    console.log(`AUDITING VIEWPORT: ${width}px (Target Height: ${height}px)`);
    console.log(`==============================================`);

    // Override viewport
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: width,
      height: height,
      deviceScaleFactor: 1,
      mobile: width < 1024
    });

    for (const pagePath of PAGES) {
      totalTests++;
      const url = `http://localhost:3000${pagePath}`;
      await sendCommand('Page.navigate', { url });

      // Wait 700ms for layout & fonts
      await sleep(700);

      // Evaluate overflow, image validity, and visual integrity
      const evalResult = await sendCommand('Runtime.evaluate', {
        expression: `
          (() => {
            const innerWidth = window.innerWidth;
            const scrollWidth = document.documentElement.scrollWidth;
            const bodyScrollWidth = document.body ? document.body.scrollWidth : 0;
            const maxScrollWidth = Math.max(scrollWidth, bodyScrollWidth);
            const hasHorizontalScroll = maxScrollWidth > (innerWidth + 1);

            // Find elements extending past viewport that are NOT inside a scroll container
            const unclippedOverflows = [];
            const allElements = document.querySelectorAll('*');
            for (const el of allElements) {
              // Ignore html and body
              if (el === document.documentElement || el === document.body) continue;

              const rect = el.getBoundingClientRect();
              // Check elements wider than viewport by more than 2px
              if (rect.right > innerWidth + 2 && rect.width > 0 && rect.height > 0) {
                // Check if this element is inside an overflow container
                let p = el.parentElement;
                let insideScroll = false;
                while (p && p !== document.body && p !== document.documentElement) {
                  const cs = window.getComputedStyle(p);
                  if (cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowX === 'hidden') {
                    insideScroll = true;
                    break;
                  }
                  p = p.parentElement;
                }

                if (!insideScroll) {
                  const tag = el.tagName.toLowerCase();
                  const cls = el.className ? ('.' + String(el.className).split(' ').join('.')) : '';
                  const idStr = el.id ? ('#' + el.id) : '';
                  unclippedOverflows.push({
                    selector: tag + idStr + cls,
                    right: Math.round(rect.right),
                    excess: Math.round(rect.right - innerWidth)
                  });
                }
              }
            }

            // Check broken images
            const brokenImages = [];
            const imgs = document.querySelectorAll('img');
            for (const img of imgs) {
              // Ignore 0-sized hidden placeholders
              if (img.id === 'modalImage' && img.src.startsWith('data:image/svg+xml')) continue;
              if (img.src && !img.complete || (img.naturalWidth === 0 && img.naturalHeight === 0)) {
                brokenImages.push(img.src);
              }
            }

            // Check mobile nav button visibility on mobile vs desktop
            const mobileBtn = document.getElementById('mobileMenuBtn');
            const mobileBtnVisible = mobileBtn ? (window.getComputedStyle(mobileBtn).display !== 'none') : null;

            return {
              innerWidth,
              maxScrollWidth,
              hasHorizontalScroll,
              unclippedOverflowCount: unclippedOverflows.length,
              topOverflows: unclippedOverflows.slice(0, 3),
              brokenImagesCount: brokenImages.length,
              brokenImages,
              mobileBtnVisible
            };
          })()
        `,
        returnByValue: true
      });

      const res = evalResult.result.value;
      const isOk = !res.hasHorizontalScroll && res.unclippedOverflowCount === 0 && res.brokenImagesCount === 0;

      if (isOk) {
        passedTests++;
        console.log(`  [PASS] ${width}px | ${pagePath} (scroll: ${res.maxScrollWidth}px / ${res.innerWidth}px, brokenImgs: 0)`);
      } else {
        failures.push({
          width,
          pagePath,
          maxScrollWidth: res.maxScrollWidth,
          innerWidth: res.innerWidth,
          unclippedOverflowCount: res.unclippedOverflowCount,
          topOverflows: res.topOverflows,
          brokenImages: res.brokenImages
        });
        console.error(`  [FAIL] ${width}px | ${pagePath}`);
        if (res.hasHorizontalScroll || res.unclippedOverflowCount > 0) {
          console.error(`         Overflow: scrollWidth ${res.maxScrollWidth}px > innerWidth ${res.innerWidth}px, unclipped items: ${res.unclippedOverflowCount}`);
          if (res.topOverflows.length > 0) {
            console.error(`         Top unclipped overflowing:`, JSON.stringify(res.topOverflows));
          }
        }
        if (res.brokenImagesCount > 0) {
          console.error(`         Broken images:`, res.brokenImages);
        }
      }
    }
  }

  console.log(`\n==============================================`);
  console.log(`AUDIT FINISHED: ${passedTests} / ${totalTests} CHECKS PASSED`);
  if (failures.length > 0) {
    console.log(`FAILURES COUNT: ${failures.length}`);
  }
  console.log(`==============================================`);

  ws.close();
  chromeProcess.kill();
  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error during audit:', err);
  process.exit(1);
});
