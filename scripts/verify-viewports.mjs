import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browserPath = fs.existsSync(chromePath) ? chromePath : edgePath;

const VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 640, mobile: true },
  { name: 'mobile-390', width: 390, height: 844, mobile: true },
  { name: 'tablet-768', width: 768, height: 1024, mobile: false },
  { name: 'tablet-1024', width: 1024, height: 768, mobile: false },
  { name: 'desktop-1440', width: 1440, height: 900, mobile: false },
];

const ROUTES = [
  '/',
  '/features',
  '/how-it-works',
  '/why-friday',
  '/about',
  '/faq',
  '/login',
  '/register',
];

async function run() {
  console.log(`Starting headless browser from ${browserPath}...`);
  const userDataDir = path.resolve('scratch/browser-profile');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const browser = spawn(browserPath, [
    '--headless=new',
    '--no-sandbox',
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listResp = await fetch('http://127.0.0.1:9222/json/list');
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

    function send(method, params = {}, timeoutMs = 8000) {
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

    const results = [];

    for (const vp of VIEWPORTS) {
      console.log(`\n========================================`);
      console.log(`Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`========================================`);

      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });

      for (const route of ROUTES) {
        const url = `http://localhost:4173${route}`;
        await send('Page.navigate', { url });
        await new Promise(r => setTimeout(r, 800));

        // Evaluate layout metrics
        const evalExpr = `(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollW = docEl.scrollWidth;
          const clientW = docEl.clientWidth;
          const hasHorizontalOverflow = scrollW > clientW;

          // Find offending overflowing elements if any
          let offending = [];
          if (hasHorizontalOverflow) {
            document.querySelectorAll('*').forEach(el => {
              const r = el.getBoundingClientRect();
              if (r.right > clientW + 1) {
                offending.push({ tag: el.tagName, class: (el.className || '').toString().slice(0, 50), right: r.right });
              }
            });
          }

          // Check inputs font size (should be >= 16px on mobile to avoid iOS auto-zoom)
          const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
          const sub16Inputs = inputs.filter(inp => {
            const fs = parseFloat(window.getComputedStyle(inp).fontSize);
            return fs < 16 && inp.type !== 'hidden' && inp.type !== 'checkbox' && inp.type !== 'radio';
          }).map(inp => ({ id: inp.id, name: inp.name, placeholder: inp.placeholder, fontSize: window.getComputedStyle(inp).fontSize }));

          // Check touch targets (interactive buttons and links should be >= 44x44 or appropriately sized)
          const interactives = Array.from(document.querySelectorAll('button, a, input[type="submit"]'));
          const smallTargets = interactives.filter(el => {
            const r = el.getBoundingClientRect();
            // only check visible elements
            if (r.width === 0 || r.height === 0 || window.getComputedStyle(el).display === 'none') return false;
            return r.height < 32; // strict minimum
          }).length;

          return {
            title: document.title,
            scrollW,
            clientW,
            hasHorizontalOverflow,
            offending: offending.slice(0, 3),
            sub16InputsCount: sub16Inputs.length,
            smallTargetsCount: smallTargets
          };
        })()`;

        const evalRes = await send('Runtime.evaluate', {
          expression: evalExpr,
          returnByValue: true
        });

        const data = evalRes?.value || evalRes?.result?.value || {};
        const passedOverflow = !data.hasHorizontalOverflow;

        console.log(`  Route: ${route.padEnd(16)} | ScrollW: ${data.scrollW} <= ClientW: ${data.clientW} | Overflow: ${passedOverflow ? 'PASS' : 'FAIL'} | Sub-16px Inputs: ${data.sub16InputsCount} | Small Targets: ${data.smallTargetsCount}`);
        if (!passedOverflow && data.offending?.length) {
          console.log(`    ⚠️ Offending:`, JSON.stringify(data.offending));
        }

        results.push({
          viewport: vp.name,
          route,
          ...data
        });
      }
    }

    const failedOverflows = results.filter(r => r.hasHorizontalOverflow);
    console.log(`\n----------------------------------------`);
    console.log(`Total checks run: ${results.length}`);
    console.log(`Horizontal overflow failures: ${failedOverflows.length}`);
    console.log(`----------------------------------------`);

    ws.close();
    return failedOverflows.length === 0;
  } finally {
    try {
      browser.kill();
    } catch { }
  }
}

run().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
