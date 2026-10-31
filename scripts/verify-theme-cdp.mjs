import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browserPath = fs.existsSync(chromePath) ? chromePath : edgePath;

const BASE_URL = 'http://127.0.0.1:5173';
const SCREENSHOT_DIR = path.resolve('scratch/theme-verification');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verify() {
  console.log(`Starting headless browser from ${browserPath}...`);
  const userDataDir = path.resolve('scratch/test-browser-profile');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const browser = spawn(browserPath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9333',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listResp = await fetch('http://127.0.0.1:9333/json/list');
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

    function send(method, params = {}, timeoutMs = 10000) {
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
    await send('Runtime.enable');

    // Set desktop viewport
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    const routes = ['/', '/login', '/register'];

    for (const route of routes) {
      console.log(`\n========================================`);
      console.log(`Testing Route: ${route}`);
      console.log(`========================================`);

      await send('Page.navigate', { url: `${BASE_URL}${route}` });
      await new Promise(r => setTimeout(r, 1500));

      // Evaluate page CSS tokens, background canvas, and button styles
      const evalResp = await send('Runtime.evaluate', {
        expression: `(() => {
          const rootStyle = getComputedStyle(document.documentElement);
          const bodyStyle = getComputedStyle(document.body);
          const canvas = document.querySelector('canvas');
          const primaryBtn = document.querySelector('button.btn-primary, a.btn-primary');
          const secondaryBtn = document.querySelector('button.btn-secondary, a.btn-secondary');

          let canvasInfo = null;
          if (canvas) {
            const cs = getComputedStyle(canvas);
            const r = canvas.getBoundingClientRect();
            canvasInfo = {
              position: cs.position,
              zIndex: cs.zIndex,
              pointerEvents: cs.pointerEvents,
              width: r.width,
              height: r.height,
              hasWebGL: Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
            };
          }

          let btnInfo = null;
          if (primaryBtn) {
            const cs = getComputedStyle(primaryBtn);
            btnInfo = {
              backgroundColor: cs.backgroundColor,
              color: cs.color,
              borderRadius: cs.borderRadius
            };
          }

          return {
            title: document.title,
            palette: {
              bg: rootStyle.getPropertyValue('--bg').trim(),
              primary: rootStyle.getPropertyValue('--primary').trim(),
              accent: rootStyle.getPropertyValue('--accent').trim(),
              glow: rootStyle.getPropertyValue('--glow').trim(),
              text: rootStyle.getPropertyValue('--text').trim(),
              textMuted: rootStyle.getPropertyValue('--text-muted').trim(),
              glassBg: rootStyle.getPropertyValue('--glass-bg').trim(),
              glassBorder: rootStyle.getPropertyValue('--glass-border').trim(),
            },
            bodyBg: bodyStyle.backgroundColor,
            bodyFont: bodyStyle.fontFamily,
            canvas: canvasInfo,
            primaryButton: btnInfo
          };
        })()`,
        returnByValue: true
      });

      console.log('Result:', JSON.stringify(evalResp.result?.value, null, 2));

      // Capture screenshot
      const cleanName = route === '/' ? 'landing' : route.replace('/', '');
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      if (shot?.data) {
        const filePath = path.join(SCREENSHOT_DIR, `${cleanName}-1440x900.png`);
        fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
        console.log(`Saved screenshot to ${filePath}`);
      }
    }

    // Now test mobile viewport (<768px) on landing
    console.log(`\n========================================`);
    console.log(`Testing Mobile Viewport: 390x844 on /`);
    console.log(`========================================`);

    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.navigate', { url: `${BASE_URL}/` });
    await new Promise(r => setTimeout(r, 1500));

    const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
    if (shotMobile?.data) {
      const filePath = path.join(SCREENSHOT_DIR, `landing-mobile-390x844.png`);
      fs.writeFileSync(filePath, Buffer.from(shotMobile.data, 'base64'));
      console.log(`Saved screenshot to ${filePath}`);
    }

    ws.close();
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    browser.kill();
    console.log('Finished CDP verification.');
  }
}

verify();
