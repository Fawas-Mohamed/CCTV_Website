import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(root, '.qa-results');
const devices = [
  [320, 568],
  [360, 740],
  [375, 667],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1180, 820],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
  [2560, 1440],
  [667, 375],
  [844, 390],
];
const selectedDevices = process.env.QA_VIEWPORTS
  ? process.env.QA_VIEWPORTS.split(',').map((size) => size.split('x').map(Number))
  : devices;
const phoneProfile = ([width, height]) =>
  width <= 430 || (width === 667 && height === 375) || (width === 844 && height === 390);
const mobileViewport = ([width, height]) => width <= 820 || (width === 667 && height === 375) || (width === 844 && height === 390);
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForNetworkIdle(page) {
  try {
    await page.waitForLoadState('networkidle', { timeout: 30000 });
  } catch (error) {
    if (error.name !== 'TimeoutError') throw error;
  }
}

async function measureScrollFps(page, top, range) {
  return page.evaluate(async ({ start, distance }) => {
    const intervals = [];
    let running = true;
    let previous = 0;
    const sample = (timestamp) => {
      if (previous) intervals.push(timestamp - previous);
      previous = timestamp;
      if (running) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
    for (let scrollY = start; scrollY <= start + distance; scrollY += 120) {
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    window.scrollTo({ top: start + distance, left: 0, behavior: 'instant' });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    running = false;
    const averageFrameMs = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
    return {
      average: averageFrameMs ? 1000 / averageFrameMs : 0,
      longest: intervals.length ? Math.max(...intervals) : 0,
    };
  }, { start: top, distance: range });
}

async function getFreePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitForServer(url, server) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Vite preview exited with code ${server.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await wait(100);
    }
  }
  throw new Error(`Vite preview did not start at ${url}`);
}

async function collectRun(browser, baseUrl, [width, height]) {
  const phone = phoneProfile([width, height]);
  const mobile = mobileViewport([width, height]);
  const context = await browser.newContext({
    viewport: { width, height },
    screen: { width, height },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  const cancelledRequests = [];
  const badResponses = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('requestfailed', (request) => {
    const failure = `${request.url()} (${request.failure()?.errorText || 'unknown error'})`;
    if (request.failure()?.errorText === 'net::ERR_ABORTED') cancelledRequests.push(failure);
    else failedRequests.push(failure);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.addInitScript(() => {
    performance.setResourceTimingBufferSize(2000);
    window.__qaVitals = { lcp: null, cls: 0, inputDelay: null };
    try {
      new PerformanceObserver((entries) => {
        for (const entry of entries.getEntries()) window.__qaVitals.lcp = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((entries) => {
        for (const entry of entries.getEntries()) {
          if (!entry.hadRecentInput) window.__qaVitals.cls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((entries) => {
        for (const entry of entries.getEntries()) {
          if (entry.entryType === 'first-input') {
            window.__qaVitals.inputDelay = entry.processingStart - entry.startTime;
          }
        }
      }).observe({ type: 'first-input', buffered: true });
    } catch {
      // Unsupported performance entry types remain null and are reported by the checks.
    }
  });

  if (phone) {
    const session = await context.newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await session.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 20,
      downloadThroughput: 4 * 1024 * 1024 / 8,
      uploadThroughput: 3 * 1024 * 1024 / 8,
      connectionType: 'cellular4g',
    });
  }

  const response = await page.goto(baseUrl, { waitUntil: 'load' });
  if (!response?.ok()) throw new Error(`Page load failed for ${width}x${height}`);

  const mode = width <= 820 && height > width ? 'm' : width <= 1280 ? 't' : 'd';
  await page.waitForFunction(
    (framePath) => performance.getEntriesByType('resource').some((entry) => entry.name.includes(framePath)),
    `/frames/${mode}/frame_0001.webp`,
    { timeout: 30000 },
  );
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await waitForNetworkIdle(page);
  await wait(250);

  const initial = await page.evaluate(() => {
    const entries = performance.getEntriesByType('resource');
    return {
      lcp: window.__qaVitals.lcp,
      cls: window.__qaVitals.cls,
      transferBytes: entries.reduce((sum, entry) => sum + entry.transferSize, 0),
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
  const initialHorizontalOverflow = initial.scrollWidth > initial.viewportWidth;
  const sizeName = `${width}x${height}`;
  const screenshot = async (name) =>
    page.screenshot({ path: path.join(outputDirectory, `${sizeName}-${name}.png`) });
  await screenshot('cover');

  const geometry = await page.evaluate(() => {
    const track = document.querySelector('.hero-track');
    const stage = document.querySelector('.hero-stage');
    const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    const top = track.getBoundingClientRect().top + window.scrollY;
    return { top, range: Math.max(1, track.offsetHeight - stage.clientHeight), headerHeight };
  });
  const fps = await measureScrollFps(page, geometry.top, geometry.range);
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  await wait(250);

  const screenshotTargets = [
    { y: geometry.top, name: 'hero-0', frame: 1 },
    { y: geometry.top + geometry.range * 0.3, name: 'hero-30', frame: Math.round(0.3 * 191) + 1 },
    { y: geometry.top + geometry.range * 0.6, name: 'hero-60', frame: Math.round(0.6 * 191) + 1 },
    { y: geometry.top + geometry.range, name: 'hero-100', frame: 192 },
  ];
  const sectionTargets = await page.evaluate((headerHeight) =>
    [...document.querySelectorAll('main > section, main > footer')].map((section, index) => {
      const label = section.id || section.tagName.toLowerCase() + '-' + index;
      return {
        y: Math.max(0, section.getBoundingClientRect().top + window.scrollY - headerHeight),
        name: `section-${label}`,
      };
    }), geometry.headerHeight);

  const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  sectionTargets.forEach((target) => {
    target.y = Math.min(maxScroll, target.y);
  });
  const targets = [
    ...screenshotTargets.map((target) => ({ ...target, kind: 'hero' })),
    ...sectionTargets.map((target) => ({ ...target, kind: 'section' })),
  ].sort((a, b) => a.y - b.y);
  const screenshotResults = [];
  const blankCanvasFrames = [];
  const captured = new Set();
  const rotationY = mobile ? Math.round((geometry.top + geometry.range * 0.6) / 120) * 120 : null;
  let rotationDelta = null;
  let rotationChecked = false;
  const scrollPositions = new Set([maxScroll, ...targets.map((target) => Math.min(maxScroll, target.y))]);
  for (let y = 0; y < maxScroll; y += 120) scrollPositions.add(y);
  if (rotationY !== null) scrollPositions.add(Math.min(maxScroll, rotationY));

  for (const y of [...scrollPositions].sort((a, b) => a - b)) {
    await page.evaluate((scrollY) => window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' }), y);
    await wait(40);

    for (const target of targets) {
      if (captured.has(target.name) || Math.abs(target.y - y) > 1) continue;
      if (target.kind === 'hero') {
        const framePath = `/frames/${mode}/frame_${String(target.frame).padStart(4, '0')}.webp`;
        try {
          await page.waitForFunction(
            ({ path, frame, set }) =>
              performance.getEntriesByType('resource').some((entry) => entry.name.includes(path))
              && document.querySelector('canvas.hero-canvas')?.__drawnFrameIndex === frame - 1
              && document.querySelector('canvas.hero-canvas')?.__drawnFrameSet === set,
            { path: framePath, frame: target.frame, set: mode },
            { timeout: 30000 },
          );
        } catch (error) {
          const state = await page.evaluate(() => {
            const track = document.querySelector('.hero-track');
            const stage = document.querySelector('.hero-stage');
            return {
              scrollY: Math.round(window.scrollY),
              heroTop: Math.round(track.getBoundingClientRect().top + window.scrollY),
              heroRange: track.offsetHeight - stage.clientHeight,
              maxScroll: document.documentElement.scrollHeight - window.innerHeight,
              drawnFrame: document.querySelector('canvas.hero-canvas')?.__drawnFrameIndex + 1,
              drawnSet: document.querySelector('canvas.hero-canvas')?.__drawnFrameSet,
              frames: performance.getEntriesByType('resource')
              .filter((entry) => /\/frames\/[mtd]\/frame_\d+\.webp/.test(entry.name))
              .slice(-8)
                .map((entry) => entry.name.split('/').slice(-2).join('/')),
            };
          });
          throw new Error(`Timed out waiting for ${target.name} (${framePath}, y=${Math.round(target.y)}, max=${Math.round(maxScroll)}) at ${JSON.stringify(state)}`, { cause: error });
        }
        const blank = await page.locator('canvas.hero-canvas').evaluate((canvas) => {
          const context = canvas.getContext('2d', { willReadFrequently: true });
          for (const y of [0.1, 0.3, 0.5, 0.7, 0.9]) {
            for (const x of [0.1, 0.3, 0.5, 0.7, 0.9]) {
              const pixel = context.getImageData(
                Math.floor(canvas.width * x),
                Math.floor(canvas.height * y),
                1,
                1,
              ).data;
              if (pixel[0] + pixel[1] + pixel[2] > 3) return false;
            }
          }
          return true;
        });
        if (blank) blankCanvasFrames.push(target.name);
      }
      await screenshot(target.name);
      captured.add(target.name);
      screenshotResults.push(target.name);
    }

    if (rotationY !== null && !rotationChecked && y >= rotationY) {
      const readHeroProgress = () => page.evaluate(() => {
        const track = document.querySelector('.hero-track');
        const stage = document.querySelector('.hero-stage');
        const top = track.getBoundingClientRect().top + window.scrollY;
        const range = Math.max(1, track.offsetHeight - stage.clientHeight);
        return Math.max(0, Math.min(1, (window.scrollY - top) / range));
      });
      const beforeProgress = await readHeroProgress();
      await page.setViewportSize({ width: height, height: width });
      await wait(250);
      const rotatedProgress = await readHeroProgress();
      const rotatedFrame = Math.round(rotatedProgress * 191) + 1;
      const rotatedWidth = height;
      const rotatedHeight = width;
      const rotatedMode = rotatedWidth <= 820 && rotatedHeight > rotatedWidth
        ? 'm'
        : rotatedWidth <= 1280 ? 't' : 'd';
      await page.waitForFunction(
        ({ path, frame, set }) =>
          performance.getEntriesByType('resource').some((entry) => entry.name.includes(path))
          && document.querySelector('canvas.hero-canvas')?.__drawnFrameIndex === frame - 1
          && document.querySelector('canvas.hero-canvas')?.__drawnFrameSet === set,
        {
          path: `/frames/${rotatedMode}/frame_${String(rotatedFrame).padStart(4, '0')}.webp`,
          frame: rotatedFrame,
          set: rotatedMode,
        },
        { timeout: 30000 },
      );
      await page.setViewportSize({ width, height });
      await wait(250);
      const restoredProgress = await readHeroProgress();
      const restoredFrame = Math.round(restoredProgress * 191) + 1;
      await page.waitForFunction(
        ({ path, frame, set }) =>
          performance.getEntriesByType('resource').some((entry) => entry.name.includes(path))
          && document.querySelector('canvas.hero-canvas')?.__drawnFrameIndex === frame - 1
          && document.querySelector('canvas.hero-canvas')?.__drawnFrameSet === set,
        {
          path: `/frames/${mode}/frame_${String(restoredFrame).padStart(4, '0')}.webp`,
          frame: restoredFrame,
          set: mode,
        },
        { timeout: 30000 },
      );
      rotationDelta = Math.max(
        Math.abs(rotatedProgress - beforeProgress),
        Math.abs(restoredProgress - beforeProgress),
      ) * 191;
      rotationChecked = true;
    }
  }

  await waitForNetworkIdle(page);
  await wait(250);

  await page.locator('.cart-button').click();
  await wait(100);
  const final = await page.evaluate(() => {
    const entries = performance.getEntriesByType('resource');
    const frameEntries = entries.filter((entry) => /\/frames\/[mtd]\/frame_\d+\.webp/.test(entry.name));
    const heroFrameBytes = frameEntries.reduce((sum, entry) => sum + entry.transferSize, 0);
    const phoneFrameBytes = entries
      .filter((entry) => /\/frames\/m\/frame_\d+\.webp/.test(entry.name))
      .reduce((sum, entry) => sum + entry.transferSize, 0);
    return {
      lcp: window.__qaVitals.lcp,
      cls: window.__qaVitals.cls,
      inputDelay: window.__qaVitals.inputDelay,
      finalScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      heroFrameBytes,
      phoneFrameBytes,
    };
  });

  await context.close();
  return {
    size: sizeName,
    phone,
    mode,
    lcpMs: initial.lcp,
    cls: initial.cls,
    inputDelayMs: final.inputDelay,
    initialBytes: initial.transferBytes,
    heroFrameBytes: final.heroFrameBytes,
    phoneFrameBytes: final.phoneFrameBytes,
    averageFps: fps.average,
    longestFrameMs: fps.longest,
    horizontalOverflow: initialHorizontalOverflow || final.finalScrollWidth > final.viewportWidth,
    blankCanvasFrames,
    rotationDelta,
    consoleErrors,
    failedRequests: [...badResponses, ...failedRequests],
    cancelledRequests: cancelledRequests.length,
    screenshots: screenshotResults.length + 1,
    expectedScreenshots: targets.length + 1,
    missingScreenshots: targets.filter((target) => !captured.has(target.name)).map((target) => target.name),
  };
}

const checksFor = (result) => {
  const failures = [];
  if (result.phone && (result.lcpMs === null || result.lcpMs > 2500)) failures.push('LCP');
  if (result.cls > 0.05) failures.push('CLS');
  if (result.inputDelayMs === null || result.inputDelayMs > 200) failures.push('input delay');
  if (result.averageFps < (result.phone ? 50 : Number(result.size.split('x')[0]) >= 1024 ? 55 : 0)) failures.push('FPS');
  if (result.longestFrameMs > 100) failures.push('long frame');
  if (result.phone && result.mode === 'm' && result.phoneFrameBytes > 12 * 1024 * 1024) failures.push('phone hero bytes');
  if (result.phone && result.initialBytes > 2.5 * 1024 * 1024) failures.push('initial bytes');
  if (result.horizontalOverflow) failures.push('horizontal overflow');
  if (result.blankCanvasFrames.length) failures.push('blank hero canvas');
  if (result.missingScreenshots.length) failures.push('missing screenshots');
  if (result.consoleErrors.length || result.failedRequests.length) failures.push('console/network errors');
  if (result.rotationDelta !== null && result.rotationDelta > 1) failures.push('rotation scroll position');
  return failures;
};

await mkdir(outputDirectory, { recursive: true });
const port = await getFreePort();
const baseUrl = `http://127.0.0.1:${port}/`;
const preview = spawn(process.execPath, [
  path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
  'preview',
  '--host',
  '127.0.0.1',
  '--port',
  String(port),
  '--strictPort',
], { cwd: root, stdio: 'ignore' });

let browser;
try {
  await waitForServer(baseUrl, preview);
  browser = await chromium.launch({ headless: true });
  const results = [];
  for (const device of selectedDevices) results.push(await collectRun(browser, baseUrl, device));
  const rows = results.map((result) => ({
    Viewport: result.size,
    LCP: result.lcpMs === null ? 'n/a' : `${Math.round(result.lcpMs)} ms`,
    CLS: result.cls.toFixed(3),
    'Input delay': result.inputDelayMs === null ? 'n/a' : `${Math.round(result.inputDelayMs)} ms`,
    'Before scroll': `${(result.initialBytes / 1024 / 1024).toFixed(2)} MB`,
    'Hero frames': `${(result.heroFrameBytes / 1024 / 1024).toFixed(2)} MB`,
    'Portrait set (m)': result.mode === 'm' ? `${(result.phoneFrameBytes / 1024 / 1024).toFixed(2)} MB` : '-',
    'Average FPS': result.averageFps.toFixed(1),
    'Worst FPS': result.longestFrameMs ? (1000 / result.longestFrameMs).toFixed(1) : 'n/a',
    'Longest frame': `${result.longestFrameMs.toFixed(1)} ms`,
    Overflow: result.horizontalOverflow ? 'yes' : 'no',
    'Blank canvas': result.blankCanvasFrames.join(', ') || 'no',
    'Console / network errors': result.consoleErrors.length + result.failedRequests.length,
    'Rotation delta': result.rotationDelta === null ? '-' : `${result.rotationDelta.toFixed(1)} frames`,
  }));
  console.table(rows);
  await import('node:fs/promises').then(({ writeFile }) =>
    writeFile(path.join(outputDirectory, 'results.json'), JSON.stringify(results, null, 2)));
  const failures = results.flatMap((result) => checksFor(result).map((check) => `${result.size}: ${check}`));
  if (failures.length) {
    console.error('QA targets failed:', failures.join('; '));
    process.exitCode = 1;
  } else {
    console.log(`All responsive QA targets passed. Screenshots: ${outputDirectory}`);
  }
} finally {
  if (browser) await browser.close();
  preview.kill();
}
