import { spawn } from 'child_process';
import fs from 'fs';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browserPath = fs.existsSync(chromePath) ? chromePath : edgePath;

async function run() {
  const browser = spawn(browserPath, [
    '--headless=new',
    '--no-sandbox',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\91960\\AppData\\Local\\Temp\\cdp_test',
    'about:blank'
  ]);

  // wait 1.5s for CDP to start
  await new Promise(r => setTimeout(r, 1500));

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

    await new Promise(r => ws.onopen = r);

    function send(method, params = {}) {
      return new Promise(resolve => {
        const id = msgId++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Page.navigate', { url: 'http://localhost:4173/' });
    await new Promise(r => setTimeout(r, 2000));

    // Measure 1440x900
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 500));
    const res1440 = await send('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight' });
    const height1440 = res1440.result.value;

    // Measure 390x844
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await new Promise(r => setTimeout(r, 500));
    const res390 = await send('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight' });
    const height390 = res390.result.value;

    console.log(JSON.stringify({ height1440, height390 }));
    ws.close();
  } finally {
    browser.kill();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
