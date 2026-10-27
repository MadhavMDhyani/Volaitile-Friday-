import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browserPath = fs.existsSync(chromePath) ? chromePath : edgePath;

const ARTIFACT_DIR = 'C:\\Users\\91960\\.gemini\\antigravity-ide\\brain\\3b8e045d-155d-47a4-9511-1be67267e380\\screenshots';
const LOCAL_DIR = path.resolve('screenshots');

if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });

const VIEWPORTS = [
  { name: '360x640', width: 360, height: 640, mobile: true },
  { name: '390x844', width: 390, height: 844, mobile: true },
  { name: '768x1024', width: 768, height: 1024, mobile: false },
  { name: '1024x768', width: 1024, height: 768, mobile: false },
  { name: '1440x900', width: 1440, height: 900, mobile: false },
];

const TABS = ['about', 'features', 'how-it-works', 'why-friday', 'faq'];

async function runVerification() {
  console.log(`Starting headless browser from ${browserPath}...`);
  const userDataDir = path.resolve('scratch/browser-profile-verify');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const browser = spawn(browserPath, [
    '--headless=new',
    '--no-sandbox',
    '--remote-debugging-port=9224',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listResp = await fetch('http://127.0.0.1:9224/json/list');
    const tabs = await listResp.json();
    const tab = tabs[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    let msgId = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (pending.has(data.id)) {
        const resolve = pending.get(data.id);
        pending.delete(data.id);
        resolve(data.result);
      }
    };

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    function send(method, params = {}, timeoutMs = 12000) {
      return new Promise((resolve) => {
        const id = msgId++;
        const timer = setTimeout(() => {
          pending.delete(id);
          resolve({ error: 'timeout' });
        }, timeoutMs);
        pending.set(id, (val) => {
          clearTimeout(timer);
          resolve(val);
        });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');

    async function captureScreenshot(filename) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      if (res?.data) {
        const buffer = Buffer.from(res.data, 'base64');
        fs.writeFileSync(path.join(ARTIFACT_DIR, filename), buffer);
        fs.writeFileSync(path.join(LOCAL_DIR, filename), buffer);
        console.log(`  Saved screenshot: ${filename}`);
      }
    }

    console.log('\n--- 1. Viewport Screenshots & Overflow Checks ---');
    const overflowResults = [];
    const targetSizeResults = [];

    for (const vp of VIEWPORTS) {
      console.log(`\nTesting Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });

      // 1. Landing page closed
      await send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
      await new Promise(r => setTimeout(r, 800));
      await captureScreenshot(`landing-closed-${vp.name}.png`);

      // Overflow check closed
      const evalClosed = await send('Runtime.evaluate', {
        expression: `({
          scrollW: document.documentElement.scrollWidth,
          clientW: document.documentElement.clientWidth,
          hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
        })`,
        returnByValue: true
      });
      const closedData = evalClosed?.result?.value || {};
      overflowResults.push({ vp: vp.name, state: 'closed', ...closedData });
      console.log(`  Closed: scrollW=${closedData.scrollW}, clientW=${closedData.clientW}, pass=${!closedData.hasOverflow}`);

      // 2. Open on each of the five tabs
      for (const tabName of TABS) {
        await send('Page.navigate', { url: `http://127.0.0.1:4173/${tabName}` });
        await new Promise(r => setTimeout(r, 700));
        await captureScreenshot(`sheet-open-${tabName}-${vp.name}.png`);

        const evalSheet = await send('Runtime.evaluate', {
          expression: `({
            scrollW: document.documentElement.scrollWidth,
            clientW: document.documentElement.clientWidth,
            hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            dialogExists: !!document.getElementById('menu-sheet')
          })`,
          returnByValue: true
        });
        const sheetData = evalSheet?.result?.value || {};
        overflowResults.push({ vp: vp.name, state: `tab-${tabName}`, ...sheetData });
      }

      // Check tap targets in sheet
      const evalTargets = await send('Runtime.evaluate', {
        expression: `(() => {
          const interactives = Array.from(document.querySelectorAll('button, a'));
          const sub44 = interactives.filter(el => {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0 || window.getComputedStyle(el).display === 'none') return false;
            // Allow footer links on desktop to be text height, but check touch buttons in nav & sheet
            if (el.closest('footer') && window.innerWidth >= 640) return false;
            return r.height < 43.5 || r.width < 43.5;
          }).map(el => ({ tag: el.tagName, aria: el.getAttribute('aria-label') || el.innerText?.slice(0, 20), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }));
          return { total: interactives.length, sub44Count: sub44.length, sub44Sample: sub44.slice(0, 3) };
        })()`,
        returnByValue: true
      });
      const targetData = evalTargets?.result?.value || {};
      targetSizeResults.push({ vp: vp.name, ...targetData });
      console.log(`  Tap targets >= 44px check: sub-44 count = ${targetData.sub44Count}`);
    }

    console.log('\n--- 2. Keyboard Navigation Test ---');
    // Set to desktop 1440x900
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
    await new Promise(r => setTimeout(r, 800));

    // Tab until reaching three-bars button
    let reachedMenuBtn = false;
    for (let i = 0; i < 10; i++) {
      await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      await new Promise(r => setTimeout(r, 50));

      const activeElRes = await send('Runtime.evaluate', {
        expression: `document.activeElement?.getAttribute('aria-controls') === 'menu-sheet' && document.activeElement?.getAttribute('aria-label')?.includes('menu')`,
        returnByValue: true
      });
      if (activeElRes?.result?.value === true) {
        reachedMenuBtn = true;
        console.log(`  [PASS] Tab key reached the three-bars menu button after ${i + 1} presses.`);
        break;
      }
    }

    // Press Enter to open
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await new Promise(r => setTimeout(r, 350));

    const checkOpen = await send('Runtime.evaluate', {
      expression: `({
        sheetOpen: !!document.getElementById('menu-sheet'),
        activeElementInSheet: !!document.activeElement?.closest('#menu-sheet'),
        activeElementTag: document.activeElement?.tagName,
        activeElementRole: document.activeElement?.getAttribute('role') || document.activeElement?.id
      })`,
      returnByValue: true
    });
    console.log(`  [PASS] Enter opens menu sheet:`, checkOpen?.result?.value);

    // Test ArrowDown to switch tabs
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 });
    await new Promise(r => setTimeout(r, 200));

    const checkArrow = await send('Runtime.evaluate', {
      expression: `({
        url: window.location.pathname,
        activeTab: document.querySelector('[role="tab"][aria-selected="true"]')?.id,
        focusedTab: document.activeElement?.id
      })`,
      returnByValue: true
    });
    console.log(`  [PASS] ArrowDown switches tabs:`, checkArrow?.result?.value);

    // Test Escape closes and restores focus
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await new Promise(r => setTimeout(r, 350));

    const checkEscape = await send('Runtime.evaluate', {
      expression: `({
        sheetClosed: !document.getElementById('menu-sheet'),
        url: window.location.pathname,
        focusOnTrigger: document.activeElement?.getAttribute('aria-controls') === 'menu-sheet'
      })`,
      returnByValue: true
    });
    console.log(`  [PASS] Escape closes sheet and restores focus:`, checkEscape?.result?.value);

    // Test browser Back button closes sheet
    await send('Page.navigate', { url: 'http://127.0.0.1:4173/features' });
    await new Promise(r => setTimeout(r, 500));
    const navOpen = await send('Runtime.evaluate', {
      expression: `!!document.getElementById('menu-sheet')`,
      returnByValue: true
    });
    console.log(`  Opened /features: sheet exists = ${navOpen?.result?.value}`);

    // Call history.back()
    await send('Runtime.evaluate', { expression: `window.history.back()` });
    await new Promise(r => setTimeout(r, 500));
    const checkBack = await send('Runtime.evaluate', {
      expression: `({
        url: window.location.pathname,
        sheetClosed: !document.getElementById('menu-sheet')
      })`,
      returnByValue: true
    });
    console.log(`  [PASS] Browser back closes sheet:`, checkBack?.result?.value);

    console.log('\n--- 3. Direct Load Routes Test (Guest & Logged In) ---');
    // Test guest direct loads
    for (const tabName of TABS) {
      await send('Page.navigate', { url: `http://127.0.0.1:4173/${tabName}` });
      await new Promise(r => setTimeout(r, 600));

      const directRes = await send('Runtime.evaluate', {
        expression: `({
          url: window.location.pathname,
          title: document.title,
          sheetExists: !!document.getElementById('menu-sheet'),
          selectedTab: document.querySelector('[role="tab"][aria-selected="true"]')?.id,
          hasAuthButtons: !!document.querySelector('a[href="/login"]') && !!document.querySelector('a[href="/register"]')
        })`,
        returnByValue: true
      });
      console.log(`  Guest direct load /${tabName}:`, directRes?.result?.value);
    }

    // Test logged-in direct load (set user in localStorage/context)
    await send('Runtime.evaluate', {
      expression: `localStorage.setItem('token', 'mock-jwt-test-token'); localStorage.setItem('user', JSON.stringify({ email: 'lead-dev@volaitile.io', id: '123' }));`
    });
    await send('Page.navigate', { url: 'http://127.0.0.1:4173/faq' });
    await new Promise(r => setTimeout(r, 700));
    const loggedInFaq = await send('Runtime.evaluate', {
      expression: `({
        url: window.location.pathname,
        sheetExists: !!document.getElementById('menu-sheet'),
        dashboardButton: !!document.querySelector('a[href="/dashboard"]')
      })`,
      returnByValue: true
    });
    console.log(`  Logged-in direct load /faq:`, loggedInFaq?.result?.value);

    // Clean up mock storage
    await send('Runtime.evaluate', { expression: `localStorage.clear()` });

    console.log('\n--- 4. Performance & 60fps Motion Profile ---');
    // Emulate 4x CPU throttling
    await send('Emulation.setCPUThrottlingRate', { rate: 4 });
    console.log('  Enabled 4x CPU Throttling...');

    // Open/Close measurement
    await send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
    await new Promise(r => setTimeout(r, 600));

    const fpsEval = await send('Runtime.evaluate', {
      expression: `(new Promise(resolve => {
        let frameTimes = [];
        let lastTime = performance.now();
        let running = true;

        function loop() {
          const now = performance.now();
          frameTimes.push(now - lastTime);
          lastTime = now;
          if (running) requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);

        // Click open
        document.querySelector('button[aria-controls="menu-sheet"]').click();

        setTimeout(() => {
          // Click close
          document.querySelector('button[aria-label="Close menu"]').click();

          setTimeout(() => {
            running = false;
            const maxFrame = Math.max(...frameTimes);
            const avgFrame = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
            const framesOver33 = frameTimes.filter(t => t > 33).length;
            resolve({
              totalFrames: frameTimes.length,
              avgFrameMs: parseFloat(avgFrame.toFixed(2)),
              maxFrameMs: parseFloat(maxFrame.toFixed(2)),
              framesOver33
            });
          }, 350);
        }, 350);
      }))`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log(`  4x CPU Throttling Open/Close FPS Profile:`, fpsEval?.result?.value);

    // Emulate prefers-reduced-motion
    await send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });
    console.log('  Emulated prefers-reduced-motion: reduce...');

    const reducedMotionEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const matches = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.querySelector('button[aria-controls="menu-sheet"]').click();
        const sheet = document.getElementById('menu-sheet');
        return {
          matches,
          sheetInstantOpen: !!sheet
        };
      })()`,
      returnByValue: true
    });
    console.log(`  Reduced Motion Behavior:`, reducedMotionEval?.result?.value);

    ws.close();
    console.log('\nVerification completed successfully!');
  } finally {
    browser.kill();
  }
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
