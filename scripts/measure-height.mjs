import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browserPath = fs.existsSync(chromePath) ? chromePath : edgePath;

async function measure() {
  const userDataDir = path.resolve('scratch/browser-profile-measure');
  const browser = spawn(browserPath, [
    '--headless=new',
    '--no-sandbox',
    '--remote-debugging-port=9223',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listResp = await fetch('http://127.0.0.1:9223/json/list');
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

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');

    const viewports = [
      { name: 'desktop-1440x900', width: 1440, height: 900, mobile: false },
      { name: 'mobile-390x844', width: 390, height: 844, mobile: true }
    ];

    for (const vp of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });

      await send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
      await new Promise(r => setTimeout(r, 1500));

      const evalRes = await send('Runtime.evaluate', {
        expression: `JSON.stringify({
          scrollHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
          heroBottom: document.querySelector('section')?.getBoundingClientRect().bottom + window.scrollY,
          footerBottom: document.querySelector('footer')?.getBoundingClientRect().bottom + window.scrollY,
          mockupHeight: document.querySelector('.glass-strong')?.getBoundingClientRect().height,
          ratio: (Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) / ${vp.height}).toFixed(2)
        })`,
        returnByValue: true
      });

      const res = JSON.parse(evalRes?.result?.value || '{}');
      console.log(`${vp.name}:`, res);
    }

    ws.close();
  } finally {
    browser.kill();
  }
}

measure().catch(console.error);
