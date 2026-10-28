import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '..', 'screenshots');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
console.log(`Target screenshots directory: ${outDir}`);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browserPath = fs.existsSync(chromePath) ? chromePath : edgePath;

const VIEWPORTS = [
  { name: '1440px', width: 1440, height: 900, mobile: false },
  { name: '390px', width: 390, height: 844, mobile: true },
];

const TARGETS = [
  { route: '/', label: 'landing' },
  { route: '/login', label: 'login' },
  { route: '/register', label: 'register' },
  { route: '/dashboard', label: 'dashboard', auth: true },
  { route: '/project/demo-workspace', label: 'project', auth: true },
];

async function capture() {
  console.log(`Starting headless browser from ${browserPath}...`);
  const userDataDir = path.resolve(__dirname, '..', 'scratch', 'browser-evidence-profile');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const browser = spawn(browserPath, [
    '--headless=new',
    '--no-sandbox',
    '--remote-debugging-port=9225',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const listResp = await fetch('http://127.0.0.1:9225/json/list');
    const tabs = await listResp.json();
    const tab = tabs[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    let msgId = 1;
    const pending = new Map();

    function send(method, params = {}, timeoutMs = 12000) {
      return new Promise((resolve) => {
        const id = msgId++;
        const timer = setTimeout(() => {
          pending.delete(id);
          console.warn(`CDP method ${method} timed out.`);
          resolve({ error: 'timeout' });
        }, timeoutMs);
        pending.set(id, (val) => {
          clearTimeout(timer);
          resolve(val);
        });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        const resolve = pending.get(data.id);
        pending.delete(data.id);
        resolve(data.result);
      }

      if (data.method === 'Fetch.requestPaused') {
        const { requestId, request } = data.params;
        let body = '{}';
        if (request.url.includes('/users/profile')) {
          body = JSON.stringify({ user: { _id: 'u1', email: 'alex@volaitile.io', name: 'Alex Quantus' } });
        } else if (request.url.includes('/projects/all')) {
          body = JSON.stringify({
            projects: [
              { _id: 'demo-workspace', name: 'Alpha Core Engine', users: ['u1', 'u2'], updatedAt: new Date().toISOString() },
              { _id: 'neural-sync', name: 'Neural Sync Pipeline', users: ['u1'], updatedAt: new Date().toISOString() }
            ]
          });
        } else if (request.url.includes('/projects/get-project/')) {
          body = JSON.stringify({
            project: {
              _id: 'demo-workspace',
              name: 'Alpha Core Engine',
              users: [{ _id: 'u1', email: 'alex@volaitile.io' }],
              fileTree: {
                'quantus.config.js': { content: 'export default {\n  theme: "Quantus Palette 2025",\n  accent: "#834DFB",\n  highlight: "#F0E100",\n  bg: "#18102B"\n};\n' }
              }
            }
          });
        }

        const base64Body = Buffer.from(body).toString('base64');
        send('Fetch.fulfillRequest', {
          requestId,
          responseCode: 200,
          responseHeaders: [
            { name: 'Content-Type', value: 'application/json' },
            { name: 'Access-Control-Allow-Origin', value: '*' }
          ],
          body: base64Body
        });
      }
    };

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    await send('Page.enable');
    await send('DOM.enable');
    await send('Fetch.enable', {
      patterns: [{ urlPattern: '*/users/profile*' }, { urlPattern: '*/projects/all*' }, { urlPattern: '*/projects/get-project/*' }]
    });

    const screenshotFiles = [];

    for (const vp of VIEWPORTS) {
      console.log(`\n========================================`);
      console.log(`Capturing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`========================================`);

      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });

      for (const target of TARGETS) {
        if (target.auth) {
          await send('Page.navigate', { url: 'http://localhost:5173/' });
          await new Promise(r => setTimeout(r, 400));
          await send('Runtime.evaluate', {
            expression: `localStorage.setItem('token', 'mock-jwt-token-quantus-2025');`
          });
        } else {
          await send('Runtime.evaluate', {
            expression: `localStorage.removeItem('token');`
          });
        }

        const url = `http://localhost:5173${target.route}`;
        console.log(`Navigating to ${url}...`);
        await send('Page.navigate', { url });
        await new Promise(r => setTimeout(r, 1800));

        const evalRes = await send('Runtime.evaluate', {
          expression: `(() => {
            const canvas = document.querySelector('canvas');
            const bgEl = document.querySelector('body');
            const bodyBg = window.getComputedStyle(bgEl).backgroundColor;
            return { hasCanvas: !!canvas, title: document.title, bodyBg };
          })()`,
          returnByValue: true
        });

        console.log(`  State:`, evalRes?.value || evalRes?.result?.value);

        const ss = await send('Page.captureScreenshot', { format: 'png' });
        if (ss && ss.data) {
          const fileName = `${target.label}-${vp.name}.png`;
          const filePath = path.join(outDir, fileName);
          fs.writeFileSync(filePath, Buffer.from(ss.data, 'base64'));
          const sz = fs.statSync(filePath).size;
          console.log(`  ✓ Saved screenshot (${sz} bytes): ${fileName}`);
          screenshotFiles.push(fileName);
        } else {
          console.error(`  ✗ Failed to capture screenshot for ${target.label} ${vp.name}:`, ss);
        }
      }
    }

    // Reduced Motion Test
    console.log(`\n========================================`);
    console.log(`Testing Reduced Motion Fallback on /`);
    console.log(`========================================`);

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });

    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise(r => setTimeout(r, 1200));

    const rmCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const canvas = document.querySelector('canvas');
        return { hasCanvas: !!canvas };
      })()`,
      returnByValue: true
    });
    console.log(`  Reduced-motion check: hasCanvas = ${rmCheck?.result?.value?.hasCanvas} (Expected: false)`);

    const rmSs = await send('Page.captureScreenshot', { format: 'png' });
    if (rmSs && rmSs.data) {
      const fileName = 'landing-reduced-motion-1440px.png';
      const filePath = path.join(outDir, fileName);
      fs.writeFileSync(filePath, Buffer.from(rmSs.data, 'base64'));
      const sz = fs.statSync(filePath).size;
      console.log(`  ✓ Saved screenshot (${sz} bytes): ${fileName}`);
      screenshotFiles.push(fileName);
    }

    console.log(`\nAll screenshots successfully saved to ${outDir}:`, screenshotFiles);
    ws.close();
    return true;
  } finally {
    try {
      browser.kill();
    } catch {}
  }
}

capture().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
