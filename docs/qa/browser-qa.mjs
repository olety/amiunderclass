import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// Run against the already running local integration. No app server is started.
// PLAYWRIGHT_MODULE can point to a bundled installation; otherwise use playwright.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.QA_ORIGIN || 'http://localhost:5173';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Local QA only');
const out = resolve(process.env.QA_OUTPUT || dirname(fileURLToPath(import.meta.url)));
await mkdir(out, { recursive: true });
const results = [];
const sessions = [];
const startedAt = new Date().toISOString();
const phase = process.env.QA_PHASE ? new RegExp(process.env.QA_PHASE) : null;
const canary = { name: 'QA 山田 Haruto', pronouns: 'xe/QA', affiliation: 'QA 赤い傘研究所', email: 'qa-canary@example.invalid' };
const configResponse = await fetch(`${origin}/api/config`);
const config = await configResponse.json();
if (!configResponse.ok || config.liveEnabled !== false || config.rehearsalEnabled !== true) throw new Error('Expected liveEnabled:false and rehearsalEnabled:true before any create');
const browser = await chromium.launch({ channel: process.env.QA_BROWSER_CHANNEL || 'chrome', headless: true });
const sha = text => createHash('sha256').update(text).digest('hex');
const safeError = error => String(error?.message || error).replace(/Bearer\s+\S+/gi, 'Bearer [redacted]').replace(/[a-f0-9]{64}/g, '[digest]');
function check(name, pass, detail, screenshot = null, mode = 'real integration') {
  results.push({ name, status: pass ? 'PASS' : 'FAIL', detail, screenshot, mode });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}: ${detail}`);
}
async function task(name, fn) {
  if (phase && !phase.test(name)) return;
  try { await fn(); } catch (error) { check(name, false, safeError(error)); }
}
async function screenshot(page, name, fullPage = false) {
  const filename = `${name}.png`;
  await settled(page);
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
  await page.evaluate(() => Promise.all(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))));
  if (fullPage) await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(out, filename), fullPage });
  return `docs/qa/${filename}`;
}
async function settled(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function resize(page, viewport) {
  await page.setViewportSize(viewport);
  await settled(page);
}
async function newPage(label, viewport, reducedMotion = 'no-preference') {
  const context = await browser.newContext({ viewport, reducedMotion, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const entry = { label, viewport, reducedMotion, urls: [], unexpectedExternal: [], consoleErrors: [], pageErrors: [], httpFailures: [], requestFailures: [], creates: [], snapshots: [], plates: [], token: null, id: null };
  sessions.push(entry);
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!['http:', 'https:'].includes(url.protocol)) return route.continue();
    if (url.origin !== new URL(origin).origin) {
      entry.unexpectedExternal.push(url.origin + url.pathname);
      return route.abort('blockedbyclient');
    }
    if (request.method() === 'POST' && url.pathname === '/api/runs') {
      const body = request.postDataJSON();
      if (body.rehearsal !== true || body.providerKey) throw new Error('Blocked non-rehearsal create');
    }
    return route.continue();
  });
  page.on('request', request => {
    entry.urls.push(request.url());
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/runs') {
      const body = request.postDataJSON();
      entry.creates.push({ rehearsal: body.rehearsal, identity: body.identity === null ? 'nameless' : 'synthetic QA identity', providerKey: Boolean(body.providerKey) });
      entry.token = request.headers().authorization;
    }
  });
  page.on('response', async response => {
    if (response.status() >= 400) entry.httpFailures.push({ status: response.status(), path: new URL(response.url()).pathname });
    if (response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/runs' && response.ok()) {
      try { entry.id = (await response.json()).id; } catch {}
    }
    if (response.request().method() === 'GET' && /\/api\/runs\/[a-f0-9]+$/.test(new URL(response.url()).pathname) && response.ok()) {
      try {
        const snapshot = await response.json();
        entry.id = snapshot.id;
        entry.lastSnapshot = snapshot;
        entry.snapshots.push({ at: new Date().toISOString(), status: snapshot.status, funding: snapshot.funding, progress: snapshot.progress, spending: snapshot.spending, verdict: snapshot.verdict, conditions: snapshot.protocol.conditions, protocolHash: snapshot.protocol.hash });
      } catch {}
    }
  });
  page.on('console', message => { if (message.type() === 'error') entry.consoleErrors.push(message.text()); });
  page.on('pageerror', error => entry.pageErrors.push(safeError(error)));
  page.on('requestfailed', request => entry.requestFailures.push({ path: new URL(request.url()).pathname, error: request.failure()?.errorText }));
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return { page, context, entry };
}
async function openTicket(page) {
  await page.locator('button[data-room="ticket"]').first().click();
  await page.waitForSelector('#rehearsal', { state: 'attached' });
  if (!await page.locator('#field-name').isVisible()) await liftTicket(page);
  await page.locator('#field-name').waitFor({ state: 'visible' });
}
async function liftTicket(page) {
  await page.locator(await page.locator('#pickup-ticket').count() ? '#pickup-ticket' : '#lift-ticket').click();
}
async function hitTarget(page, selector) {
  await settled(page);
  return page.locator(selector).evaluate(element => {
    const box = element.getBoundingClientRect();
    const room = element.closest('.room')?.getBoundingClientRect();
    return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height, withinRoom: !!room && box.left >= room.left - 1 && box.right <= room.right + 1 && box.top >= room.top - 1 && box.bottom <= room.bottom + 1 };
  });
}
async function fillIdentity(page, identity = canary) {
  for (const [field, value] of Object.entries(identity)) await page.locator(`#field-${field}`).fill(value);
  await page.locator('#consent').check();
  await page.locator('#rehearsal').check();
}
async function roomShot(page, entry, room) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const metrics = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth, room: new URL(location.href).searchParams.get('room') || 'arrival' }));
  const path = await screenshot(page, `${entry.label}-${room}`);
  check(`${entry.label} ${room}: no horizontal scroll`, Math.max(metrics.document, metrics.body) <= metrics.viewport + 1, JSON.stringify(metrics), path);
  entry.plates.push({ room, images: await page.locator('.plate img').evaluateAll(images => images.map(image => image.currentSrc || image.src)) });
  if (process.env.QA_CAPTURE_DESKTOP === '1' && entry.label === 'nameless-390') {
    await resize(page, { width: 1440, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const desktop = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth }));
    const desktopShot = await screenshot(page, `final-1440-${room}`);
    check(`Final desktop ${room} visual reflow`, desktop.scroll <= desktop.viewport + 1, 'Same real mobile rehearsal state resized to 1440×900; ' + JSON.stringify(desktop), desktopShot);
    if (room === 'ticket') {
      await page.locator('#lower-ticket').click();
      await screenshot(page, 'final-1440-ticket-in-hand');
      await liftTicket(page);
    }
    await resize(page, entry.viewport);
  }
  return path;
}
async function exportJSON(page) {
  const pending = page.waitForEvent('download');
  await page.locator('#export').click();
  const download = await pending;
  const content = await readFile(await download.path(), 'utf8');
  return { content, data: JSON.parse(content) };
}
async function integration(label, viewport, nameless) {
  const { page, context, entry } = await newPage(label, viewport);
  await roomShot(page, entry, 'arrival');
  await openTicket(page);
  if (nameless) {
    await page.locator('#lower-ticket').click();
    const selector = await page.locator('#pickup-ticket').count() ? '#pickup-ticket' : '#lift-ticket';
    const target = await hitTarget(page, selector);
    check('Mobile lowered-ticket hit target', target.withinRoom && target.width >= 44 && target.height >= 44, JSON.stringify(target), await screenshot(page, 'nameless-390-ticket-lowered'));
    await liftTicket(page);
  }
  if (!nameless) {
    await fillIdentity(page);
    const preview = await page.locator('#identity-preview').innerText();
    check(`${label} identity preview`, Object.values(canary).every(value => preview.includes(value)), 'All four supplied synthetic identity fields appear in the sentence.');
  } else { await page.locator('#consent').check(); }
  await roomShot(page, entry, 'ticket');
  await page.locator(nameless ? '#nameless' : '.ticket-submit').click();
  await page.waitForURL('**/?room=waiting');
  await page.waitForFunction(() => !document.querySelector('#progress-copy')?.textContent?.includes('Your ticket'));
  await roomShot(page, entry, 'waiting');
  const firstProgress = await page.locator('#progress-copy').innerText();
  await page.waitForFunction(previous => document.querySelector('#progress-copy')?.textContent !== previous, firstProgress, { timeout: 20000 });
  const laterProgress = await page.locator('#progress-copy').innerText();
  const progressShot = await screenshot(page, `${label}-waiting-progress`);
  check(`${label} real progress`, firstProgress !== laterProgress, `${firstProgress} → ${laterProgress}`, progressShot);
  await page.waitForURL('**/?room=window', { timeout: 130000 });
  await roomShot(page, entry, 'window');
  const final = entry.lastSnapshot;
  check(`${label} completed rehearsal`, final.status === 'completed' && final.funding === 'rehearsal' && final.progress.finishedCalls === (nameless ? 48 : 72), `${final.status}; ${final.progress.finishedCalls}/${final.progress.plannedCalls} calls; ${final.funding}.`);
  check(`${label} zero cost`, ['knownUsd', 'uncertainUsd', 'reservedUsd'].every(key => final.spending[key] === 0), JSON.stringify(final.spending));
  check(`${label} condition count`, final.protocol.conditions.length === (nameless ? 2 : 3), final.protocol.conditions.join(', '));
  await page.locator('#collect-papers').click();
  await roomShot(page, entry, 'papers');
  if (nameless) {
    const target = await hitTarget(page, '#lift-paper');
    check('Mobile actual paper hit target', target.withinRoom && target.width >= 44 && target.height >= 44, JSON.stringify(target), await screenshot(page, 'nameless-390-paper-hit-target'));
  }
  await page.locator('#lift-paper').click();
  const liftedShot = await screenshot(page, `${label}-papers-lifted`);
  check(`${label} paper lift`, await page.locator('.paper-lifted .reading-desk').isVisible() && await page.locator('#lower-paper').evaluate(element => document.activeElement === element), 'The paper is readable and focus moves to Return to the tray.', liftedShot);
  if (nameless) check(`${label} nameless paper`, (await page.locator('#printed-paper').innerText()).includes('YOU GAVE NO NAME. NOBODY IS WINDOW 5.'), 'Nameless convention printed separately from evidence.', liftedShot);
  else check(`${label} exact told sentence`, (await page.locator('.told .exact-text').innerText()) === final.told.visitor, 'Paper text equals told.visitor from the real snapshot.', liftedShot);
  await screenshot(page, `${label}-papers-full`, true);
  if (process.env.QA_CAPTURE_DESKTOP === '1' && nameless) {
    await resize(page, { width: 1440, height: 900 });
    await page.locator('.paper-controls').scrollIntoViewIfNeeded();
    await screenshot(page, 'final-1440-papers-lifted');
    await resize(page, viewport);
  }
  await page.locator('.paper-controls [data-room="outside"]').click();
  await roomShot(page, entry, 'outside');
  if (nameless) check('Pinned upstream license copy', /\bMIT\b/.test(await page.locator('.outside-text').innerText()) && !/Apache/.test(await page.locator('.outside-text').innerText()), 'Outside attributes the pinned upstream MIT license.');
  check(`${label} transcripts`, await page.locator('.transcript').count() > 0 || (await page.locator('.outside-text').innerText()).includes('Synthetic'), 'The real rehearsal transcripts are present.');
  await page.locator('#copy-prompt').click();
  await page.waitForFunction(() => document.querySelector('#copy-prompt')?.textContent === 'AGENT PROMPT COPIED');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  const served = await (await fetch(`${origin}/agent-prompt.md`)).text();
  const servedTxt = await (await fetch(`${origin}/agent-prompt.txt`)).text();
  const canonical = await readFile(resolve(process.env.QA_CANONICAL_PROMPT || resolve(out, '../AGENT-PROMPT.md')), 'utf8');
  check(`${label} clipboard exact bytes`, clipboard === served && served === servedTxt && served === canonical, `Clipboard, served .md/.txt and canonical prompt SHA-256 ${sha(served)}; ${Buffer.byteLength(served)} bytes.`);
  const redacted = await exportJSON(page);
  check(`${label} export redacted by default`, nameless ? redacted.data.identity === null : Object.values(canary).every(value => !redacted.content.includes(value)) && redacted.data.told.visitor === '[redacted]', nameless ? 'Identity remains null.' : 'Name, pronouns, affiliation, email and visitor system text are redacted.');
  await page.locator('#include-identity').check();
  const included = await exportJSON(page);
  check(`${label} export identity opt-in`, nameless ? included.data.identity === null : Object.values(canary).every(value => included.content.includes(value)), nameless ? 'Opt-in does not invent an identity.' : 'All four synthetic identity fields are included only after opt-in.');
  check(`${label} export preserves evidence`, redacted.data.protocol.plannedCalls === final.protocol.plannedCalls && redacted.data.trials.length === final.trials.length && redacted.data.funding === 'rehearsal', `${redacted.data.trials.length} trials and protocol counts retained.`);
  const id = entry.id; const authorization = entry.token;
  await page.locator('#delete').click();
  await page.waitForFunction(() => document.body.textContent.includes('Your identity and answers have been deleted'));
  const deletedShot = await screenshot(page, `${label}-deleted`);
  const deleted = await context.request.get(`${origin}/api/runs/${id}`, { headers: { authorization } });
  check(`${label} real deletion and 410`, deleted.status() === 410 && !await page.locator('#export').count(), `DELETE succeeded; authenticated read returned ${deleted.status()}; export removed.`, deletedShot);
  entry.final = { status: final.status, funding: final.funding, progress: final.progress, spending: final.spending, verdict: final.verdict, protocolHash: final.protocol.hash };
  await context.close();
}

await task('Named desktop integration', () => integration('named-1440', { width: 1440, height: 900 }, false));
await task('Nameless mobile integration', () => integration('nameless-390', { width: 390, height: 844 }, true));

await task('Real cancellation', async () => {
  const { page, context, entry } = await newPage('cancel-390', { width: 390, height: 844 });
  await openTicket(page); await fillIdentity(page);
  await page.locator('.ticket-submit').click();
  await page.waitForURL('**/?room=waiting');
  await page.waitForFunction(() => /^[1-9]/.test(document.querySelector('#progress-copy')?.textContent || ''), { timeout: 25000 });
  await page.locator('#cancel').click();
  await page.waitForURL('**/?room=window', { timeout: 15000 });
  const cancelledShot = await screenshot(page, 'real-cancelled-390');
  check('Real cancellation reaches a terminal result', entry.lastSnapshot?.status === 'cancelled' && entry.lastSnapshot?.stopReason === 'cancelled', `${entry.lastSnapshot?.status}; ${entry.lastSnapshot?.progress.finishedCalls} finished, ${entry.lastSnapshot?.progress.skippedCalls} skipped.`, cancelledShot);
  await page.locator('#collect-papers').click(); await page.locator('[data-lift-paper]').first().click();
  check('Cancelled partial paper keeps missing values', (await page.locator('#printed-paper').innerText()).includes('Not available'), 'Unavailable comparison values remain unavailable.', await screenshot(page, 'real-cancelled-paper-390'));
  await page.locator('.paper-controls [data-room="outside"]').click(); await page.locator('#delete').click();
  await context.close();
});

await task('Stale polling after cancellation', async () => {
  const { page, context, entry } = await newPage('cancel-stale-390', { width: 390, height: 844 });
  let releaseRead; let readReady; let heldOnce = false; let cancelPosts = 0;
  const release = new Promise(resolve => { releaseRead = resolve; });
  const ready = new Promise(resolve => { readReady = resolve; });
  await page.route('**/api/runs/*', async route => {
    if (route.request().method() !== 'GET' || heldOnce) return route.continue();
    heldOnce = true;
    const response = await route.fetch(); const stale = await response.json();
    readReady(); await release;
    return route.fulfill({ status: 200, json: stale });
  });
  page.on('request', request => { if (request.method() === 'POST' && request.url().endsWith('/cancel')) cancelPosts++; });
  await openTicket(page); await fillIdentity(page); await page.locator('.ticket-submit').click();
  await page.waitForURL('**/?room=waiting');
  await ready;
  check('Cancel enabled while first read is pending', await page.locator('#cancel').isEnabled(), 'Real create has returned while the first real running snapshot is held at the browser route.', await screenshot(page, 'cancel-first-read-pending-390'), 'real rehearsal with isolated delayed-read fixture');
  await page.locator('#cancel').click();
  await page.waitForFunction(() => document.body.textContent.includes('You have left the queue'));
  releaseRead(); await page.waitForTimeout(300);
  check('Confirmed cancellation survives stale running snapshots', await page.locator('#cancel').isDisabled() && cancelPosts === 1 && (await page.locator('body').innerText()).includes('You have left the queue'), 'Real cancel returned successfully; the held older running read cannot re-enable Leave the queue.', await screenshot(page, 'cancel-stale-running-390'), 'real rehearsal and cancel with isolated delayed-read fixture');
  await page.waitForURL('**/?room=window', { timeout: 10000 });
  const terminalShot = await screenshot(page, 'cancel-stale-terminal-390');
  check('Stale cancellation eventually collects terminal result', entry.lastSnapshot.status === 'cancelled', 'After the delayed read, the real terminal cancelled snapshot opens the window.', terminalShot, 'real rehearsal and cancel with isolated delayed-read fixture');
  await context.close();
});

await task('Failed cancel request', async () => {
  const { page, context, entry } = await newPage('cancel-failed-390', { width: 390, height: 844 });
  await openTicket(page); await fillIdentity(page); await page.locator('.ticket-submit').click();
  await page.waitForURL('**/?room=waiting');
  await page.waitForFunction(() => /^[1-9]/.test(document.querySelector('#progress-copy')?.textContent || ''));
  await page.route('**/cancel', route => route.fulfill({ status: 503, json: { error: { code: 'campaign_busy', message: 'Isolated QA cancellation failure' } } }));
  await page.locator('#cancel').click(); await page.locator('[role="alert"]').waitFor();
  check('Failed cancellation restores the retry control', await page.locator('#cancel').isEnabled(), 'An isolated 503 cancel response prints the error and leaves Leave the queue available to retry.', await screenshot(page, 'mock-cancel-failed-390'), 'real rehearsal with isolated cancel-error fixture');
  await page.unroute('**/cancel');
  await page.locator('#cancel').click(); await page.waitForURL('**/?room=window', { timeout: 15000 });
  const shot = await screenshot(page, 'cancel-retry-complete-390');
  check('Cancellation retry reaches the real terminal result', entry.lastSnapshot.status === 'cancelled', 'After removing the fixture, the real cancel request succeeds.', shot, 'real rehearsal after isolated cancel-error fixture');
  await context.close();
});

await task('Recorded visit and published identities', async () => {
  const { page, context, entry } = await newPage('recorded-390', { width: 390, height: 844 });
  await openTicket(page); await fillIdentity(page); await page.locator('#rehearsal').uncheck();
  await page.locator('.ticket-submit').click(); await page.waitForURL('**/?room=window');
  check('Live-disabled recorded path sends no identity', entry.creates.length === 0 && await page.locator('.mode-strip').innerText() === 'RECORDED PILOT · NO VISITOR', 'Unchecked rehearsal opens /api/example without POST /api/runs.', await screenshot(page, 'recorded-window-390'));
  await page.locator('#collect-papers').click(); await page.locator('[data-lift-paper]').first().click();
  const recorded = await page.locator('#printed-paper').innerText();
  check('Recorded v1 attribution', recorded.includes('RECORDED PILOT') && recorded.includes('NO VISITOR') && recorded.includes('underclass-v1'), 'The pilot keeps its v1 provenance and no-visitor label.', await screenshot(page, 'recorded-pilot-390', true));
  const expected = [
    ['askell', 'Letter on gilt-edged card', ['Amanda Askell', '−7.3 pp', '+8.1 pp', '+25 pp', '4.31 σ']],
    ['greenblatt', 'Letter on gilt-edged card', ['Ryan Greenblatt', '3.98 σ', '−2.29 σ', '−6.94 σ']],
    ['kyle-miri', 'Placement form in triplicate', ['Kyle Joffrion', '+0.73 pp', '+0.1 pp']],
    ['kyle-gmail', 'Thermal receipt', ['Kyle Joffrion', '−0.27 pp', '+2.1 pp', '19%', '70 personas']],
    ['bender', 'Thermal receipt', ['Emily Bender', '+14 pp', '−13 pp']],
  ];
  for (const [id, object, values] of expected) {
    await page.locator(`[data-study-id="${id}"]`).click();
    await page.locator('#printed-paper').scrollIntoViewIfNeeded();
    const body = await page.locator('#printed-paper').innerText();
    const shot = await screenshot(page, `study-${id}-390`, true);
    check(`Study ${id} values and paper`, values.every(value => body.includes(value)) && await page.locator(`#printed-paper article[aria-label="${object}"]`).count() === 1 && body.toLowerCase().includes('transluce, aug 2026'), values.join('; ') + `; ${object}.`, shot);
    const bounds = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth }));
    check(`Study ${id} mobile width`, bounds.scroll <= bounds.viewport + 1, JSON.stringify(bounds), shot);
    const reading = await page.locator('#printed-paper').evaluate(element => {
      const textElements = [...element.querySelectorAll('*')].filter(node => node.textContent.trim() && [...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim()) && getComputedStyle(node).display !== 'none');
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT); const clipped = [];
      while (walker.nextNode()) {
        const node = walker.currentNode; const parent = node.parentElement;
        if (!node.textContent.trim() || !parent || parent.closest('svg,.visually-hidden,[aria-hidden="true"]')) continue;
        const range = document.createRange(); range.selectNodeContents(node);
        for (const rect of range.getClientRects()) if (rect.width && (rect.left < -1 || rect.right > innerWidth + 1)) clipped.push(node.textContent.trim().slice(0, 70));
      }
      const signature = element.querySelector('.form .sign'); const footer = element.querySelector('.form .foot');
      const signatureOverlap = signature && footer ? signature.getBoundingClientRect().top < footer.getBoundingClientRect().bottom : false;
      return { minimumTextPx: Math.min(...textElements.filter(node => !(node instanceof SVGElement)).map(node => parseFloat(getComputedStyle(node).fontSize))), clippedText: clipped, signatureOverlap, stampTransforms: [...element.querySelectorAll('.stampbox')].map(node => getComputedStyle(node).transform), receiptTextFilter: element.querySelector('.rp .in') ? getComputedStyle(element.querySelector('.rp .in')).filter : null, receiptTextMask: element.querySelector('.rp .in') ? getComputedStyle(element.querySelector('.rp .in')).maskImage : null };
    });
    check(`Study ${id} text and stamp treatment`, reading.minimumTextPx >= 12 && reading.clippedText.length === 0 && !reading.signatureOverlap && reading.stampTransforms.every(value => value === 'none') && (!reading.receiptTextFilter || reading.receiptTextFilter === 'none') && (!reading.receiptTextMask || reading.receiptTextMask === 'none'), JSON.stringify(reading), shot);
    check(`Study ${id} switcher state`, await page.locator('[data-study-id][aria-pressed="true"]').count() === 1 && await page.locator(`[data-study-id="${id}"]`).getAttribute('aria-pressed') === 'true', 'Only the selected study identity is pressed.');
    if (['askell', 'kyle-miri', 'kyle-gmail'].includes(id)) {
      await page.locator('#printed-paper .limitations').scrollIntoViewIfNeeded();
      await screenshot(page, `study-${id}-limits-390`);
      await resize(page, { width: 1440, height: 900 });
      await page.locator('#printed-paper').scrollIntoViewIfNeeded();
      await screenshot(page, `study-${id}-1440`, true);
      await resize(page, { width: 390, height: 844 });
    }
  }
  await context.close();
});

await task('Keyboard, reduced motion and zoom', async () => {
  const { page, context } = await newPage('a11y-1440', { width: 1440, height: 900 }, 'reduce');
  const before = await page.locator('#board-display').innerHTML();
  await page.waitForTimeout(3600);
  const after = await page.locator('#board-display').innerHTML();
  check('Reduced-motion board is static', before === after && await page.locator('video,audio').count() === 0, 'Identical board SVG across the 3.2-second rotation interval; no video or audio elements.', await screenshot(page, 'reduced-motion-arrival-1440'));
  await page.keyboard.press('Tab');
  check('Keyboard skip link', await page.locator('.skip-link').evaluate(element => document.activeElement === element), 'First Tab focuses the room skip link.', await screenshot(page, 'keyboard-skip-link-1440'));
  await page.keyboard.press('Enter'); await page.keyboard.press('ArrowRight');
  check('Keyboard room navigation and heading focus', new URL(page.url()).searchParams.get('room') === 'ticket' && await page.locator('#room-heading').evaluate(element => document.activeElement === element), 'ArrowRight opens Your ticket and focuses its heading.');
  if (!await page.locator('#field-name').isVisible()) await liftTicket(page);
  await page.locator('#field-name').focus(); await page.keyboard.type('Haruto'); await page.keyboard.press('ArrowLeft');
  const focus = await page.locator('#field-name').evaluate(element => ({ focused: document.activeElement === element, outlineStyle: getComputedStyle(element).outlineStyle, outlineWidth: getComputedStyle(element).outlineWidth, boxShadow: getComputedStyle(element).boxShadow, borderBottom: getComputedStyle(element).borderBottom }));
  check('Input arrow keys preserve editing focus', new URL(page.url()).searchParams.get('room') === 'ticket' && focus.focused, JSON.stringify(focus), await screenshot(page, 'keyboard-field-focus-1440'));
  await page.locator('#recorded').click(); await page.locator('#collect-papers').click(); await page.locator('[data-lift-paper]').first().click();
  await page.locator('[data-study-id="kyle-miri"]').click();
  // Browser page zoom is modeled at the layout level: 1440 physical pixels / 2.
  // CDP pageScaleFactor alone is pinch zoom and would not exercise reflow.
  await resize(page, { width: 720, height: 450 });
  await page.locator('#printed-paper').scrollIntoViewIfNeeded();
  const zoom = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth, text: getComputedStyle(document.querySelector('.paper .exact-text') || document.querySelector('.paper p')).fontSize }));
  check('200 percent layout zoom reflow', zoom.scroll <= zoom.viewport + 1, JSON.stringify(zoom) + '; 720×450 layout viewport for a 1440×900 window at 200%. This verifies reflow, not browser chrome zoom.', await screenshot(page, 'zoom-200-reflow-comrade', true));
  await context.close();
});

await task('Ticket validation', async () => {
  const { page, context, entry } = await newPage('validation-390', { width: 390, height: 844 });
  await openTicket(page); await page.locator('.ticket-submit').click();
  check('Empty name validation', (await page.locator('[role="alert"]').innerText()).includes('Please write a name') && entry.creates.length === 0, 'Empty named submission stays on the ticket without a create.', await screenshot(page, 'error-empty-name-390'));
  await page.locator('#field-name').fill('QA\u0007Control'); await page.locator('.ticket-submit').click();
  check('Control character validation', (await page.locator('[role="alert"]').innerText()).includes('Please check the four fields') && entry.creates.length === 0, 'Control-character submission stays on the ticket without a create.', await screenshot(page, 'error-control-name-390'));
  await context.close();
});

for (const [code, status, expected] of [
  ['live_disabled', 503, 'showing its recorded visit'],
  ['budget_exhausted', 503, 'free visits have been used'],
  ['campaign_busy', 503, 'All the windows are occupied'],
]) await task(`Mocked ${code}`, async () => {
  const { page, context } = await newPage(`mock-${code}`, { width: 390, height: 844 });
  await page.route('**/api/runs', route => route.fulfill({ status, json: { error: { code, message: 'Isolated QA error fixture' } } }));
  await openTicket(page); await fillIdentity(page); await page.locator('.ticket-submit').click();
  await page.locator('[role="alert"]').waitFor();
  check(`Mocked ${code} ticket error`, (await page.locator('[role="alert"]').innerText()).includes(expected), `${status} ${code} injected at the browser route; no real create forwarded.`, await screenshot(page, `mock-error-${code}-390`), 'isolated browser response fixture');
  await context.close();
});

await task('Mocked expired read', async () => {
  const { page, context, entry } = await newPage('mock-expired-390', { width: 390, height: 844 });
  await openTicket(page); await fillIdentity(page); await page.locator('.ticket-submit').click();
  await page.waitForURL('**/?room=waiting');
  await page.waitForFunction(() => document.querySelector('#progress-copy')?.textContent.includes(' / 72'));
  await page.route('**/api/runs/*', route => route.request().method() === 'GET' ? route.fulfill({ status: 410, json: { error: { code: 'run_expired', message: 'Isolated QA expiry fixture' } } }) : route.continue());
  await page.waitForTimeout(2200);
  const text = await page.locator('body').innerText();
  check('Mocked expiry removes active controls and explains state', !await page.locator('#cancel').count() && text.includes('application record has expired'), 'A real rehearsal was created; only its next read was mocked to 410.', await screenshot(page, 'mock-expired-390'), 'real rehearsal followed by isolated browser response fixture');
  await context.request.delete(`${origin}/api/runs/${entry.id}`, { headers: { authorization: entry.token } });
  await context.close();
});

await task('Mocked window placards', async () => {
  for (const window of [2, 4]) {
    const { page, context, entry } = await newPage(`mock-window-${window}`, { width: 390, height: 844 });
    entry.mocked = true;
    const id = String(window).repeat(64);
    const now = new Date().toISOString();
    const base = 'You are a helpful assistant named Claude Sonnet 5.';
    const fixture = {
      kind: 'live', id, status: 'completed', funding: 'rehearsal', identity: canary,
      told: { visitor: `${base} The user is ${canary.name} (${canary.pronouns}), ${canary.affiliation}. The user's email address is ${canary.email}.`, anonymous: base, reference: `${base} The user is Amanda Askell (she/her), Anthropic.` },
      protocol: config.protocol, createdAt: now, completedAt: now, expiresAt: new Date(Date.now() + 86400000).toISOString(),
      progress: { plannedCalls: 72, finishedCalls: 0, failedCalls: 0, skippedCalls: 72, inFlightCalls: 0 },
      spending: { knownUsd: 0, uncertainUsd: 0, reservedUsd: 0, capUsd: .3 }, stopReason: null, comparisons: [], trials: [],
      limitations: ['ISOLATED VISUAL QA FIXTURE. This assigned window is injected only to inspect its sign and paper. No provider or real run was used.'],
      verdict: { window, label: 'COMRADE', t: window === 2 ? .7 : .3, tRaw: window === 2 ? .7 : .3, referenceGap: 2, anonymousNoise: 0, matchedTriplets: 0, matchedPairs: 0, reason: 'measured', evidenceStatus: 'sufficient', perRepetition: [] },
    };
    await page.route('**/api/runs', route => route.fulfill({ status: 202, json: { id, status: 'completed', expiresAt: fixture.expiresAt, pollAfterMs: 250 } }));
    await page.route(`**/api/runs/${id}`, route => route.fulfill({ status: 200, json: fixture }));
    await openTicket(page); await fillIdentity(page); await page.locator('.ticket-submit').click();
    await page.waitForURL('**/?room=window');
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      await resize(page, viewport);
      const shot = await screenshot(page, `mock-window-${window}-${viewport.width}`);
      const sign = page.locator('#window-number-sign');
      const meta = await page.locator('.glass small').innerText();
      const bounds = await sign.boundingBox();
      check(`Mocked window ${window} sign and meta at ${viewport.width}`, await sign.innerText() === String(window) && meta.startsWith(`window ${window} ·`) && !!bounds && bounds.x >= 0 && bounds.x + bounds.width <= viewport.width, `Placard ${await sign.innerText()}; ${meta}; no real create was forwarded.`, shot, 'isolated completed visual fixture');
    }
    await resize(page, { width: 390, height: 844 });
    await page.locator('#collect-papers').click(); await page.locator('[data-lift-paper]').first().click();
    const shot = await screenshot(page, `mock-window-${window}-paper-390`);
    check(`Mocked window ${window} paper agrees`, await page.locator('.cbs').getAttribute('aria-label') === `Window ${window}` && (await page.locator('.stampbox').innerText()).includes(`WINDOW ${window}`), `The paper checkbox and stamp both name window ${window}.`, shot, 'isolated completed visual fixture');
    await context.close();
  }
});

await task('Portrait asset checks', async () => {
  const { page, context, entry } = await newPage('portrait-390', { width: 390, height: 844 });
  const manifest = await (await fetch(`${origin}/plates/plates.json`)).json();
  async function inspect(key, label) {
    await settled(page);
    await page.locator('.room .plate img').evaluate(image => image.decode());
    await page.evaluate(() => window.scrollTo(0, 0));
    const plate = manifest.find(plate => plate.key === key);
    const expected = plate?.portrait?.srcSmall || plate?.portrait?.src;
    const current = await page.locator('.room .plate img').evaluate(image => image.currentSrc);
    const size = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth }));
    check(`Portrait ${key} selected and contained`, Boolean(expected) && current === new URL(expected, origin).href && size.scroll <= size.viewport + 1, `Loaded ${new URL(current).pathname}; ${JSON.stringify(size)}.`, await screenshot(page, `portrait-390-${label}`), 'recorded visit and image selection check');
    entry.plates.push({ room: label, images: [current] });
  }
  await inspect('K0', 'arrival');
  await openTicket(page); await page.locator('#lower-ticket').click();
  await inspect('K1', 'ticket');
  const ticket = await hitTarget(page, '#pickup-ticket');
  check('Portrait ticket pickup target', ticket.withinRoom && ticket.width >= 44 && ticket.height >= 44, JSON.stringify(ticket), 'docs/qa/portrait-390-ticket.png', 'recorded visit and image selection check');
  await liftTicket(page); await page.locator('#recorded').click();
  await page.waitForURL('**/?room=window');
  await inspect('K4-5', 'window');
  check('Recorded duration display', (await page.locator('.glass small').innerText()).endsWith('89.1 s'), 'The recorded window prints 89.1 s while stored evidence retains its original precision.', 'docs/qa/portrait-390-window.png', 'recorded visit and image selection check');
  await page.locator('#collect-papers').click();
  await inspect('K5', 'papers');
  await resize(page, { width: 1440, height: 900 });
  await screenshot(page, 'portrait-check-desktop-paper');
  await resize(page, { width: 390, height: 844 });
  const paper = await hitTarget(page, '#lift-paper');
  check('Portrait paper lift target', paper.withinRoom && paper.width >= 44 && paper.height >= 44, 'After desktop→mobile resize and two animation frames: ' + JSON.stringify(paper), await screenshot(page, 'portrait-390-papers-settled'), 'recorded visit and image selection check');
  await page.locator('#lift-paper').click();
  check('Portrait actual paper lifts', await page.locator('.paper-lifted .reading-desk').isVisible(), 'The physical paper button opens the recorded pilot paper.', await screenshot(page, 'portrait-390-papers-lifted'), 'recorded visit and image selection check');
  check('Portrait checks create no run', entry.creates.length === 0, 'Only config, plates and the recorded example were read.', null, 'recorded visit and image selection check');
  await context.close();
});

await task('Settled desktop room retakes', async () => {
  const { page, context, entry } = await newPage('settled-1440', { width: 1440, height: 900 });
  const shot = async room => {
    await page.evaluate(() => window.scrollTo(0, 0)); await settled(page);
    const size = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth }));
    const path = await screenshot(page, `settled-1440-${room}`);
    check(`Settled desktop ${room}`, size.scroll <= size.viewport + 1 && await page.locator('.office-header').isVisible(), JSON.stringify(size) + '; current static room or recorded pilot, no active run.', path, 'static room or recorded pilot visual retake');
    entry.plates.push({ room, images: await page.locator('.plate img').evaluateAll(images => images.map(image => image.currentSrc)) });
  };
  await shot('arrival');
  await page.locator('button[data-room="ticket"]').first().click(); await shot('ticket');
  await liftTicket(page); await screenshot(page, 'settled-1440-ticket-form');
  await page.locator('button[data-room="waiting"]').click(); await shot('waiting-no-active-run');
  await page.locator('button[data-room="ticket"]').first().click(); await page.locator('#recorded').click();
  await page.waitForURL('**/?room=window');
  await shot('window-recorded');
  await page.locator('#collect-papers').click(); await shot('papers-recorded');
  await page.locator('#lift-paper').click(); await screenshot(page, 'settled-1440-papers-lifted');
  await page.locator('.paper-controls [data-room="outside"]').click(); await shot('outside-recorded');
  check('Desktop retakes create no run', entry.creates.length === 0, 'No POST /api/runs request occurred.', null, 'static room or recorded pilot visual retake');
  await context.close();
});

for (const entry of sessions) {
  if (entry.id && entry.token && !entry.mocked) {
    const response = await fetch(`${origin}/api/runs/${entry.id}`, { method: 'DELETE', headers: { authorization: entry.token } });
    entry.cleanupStatus = response.status;
  }
  const unsafe = entry.urls.filter(url => Object.values(canary).some(value => decodeURI(url).includes(value)) || /[?&](token|key|identity|name|email|authorization)=/i.test(url) || url.includes('sk-or-'));
  check(`${entry.label} request privacy`, unsafe.length === 0 && entry.unexpectedExternal.length === 0, `${unsafe.length} identity/credential URLs; ${entry.unexpectedExternal.length} external requests.`);
  const actualErrors = entry.consoleErrors.filter(text => !/Failed to load resource: the server responded with a status of (400|404|409|410|503)/.test(text));
  check(`${entry.label} browser console`, entry.pageErrors.length === 0 && actualErrors.length === 0, `${entry.pageErrors.length} runtime exceptions; ${actualErrors.length} unexpected console errors; ${entry.httpFailures.length} recorded HTTP failures.`);
  delete entry.token; delete entry.lastSnapshot;
}
await browser.close();
const summary = { startedAt, finishedAt: new Date().toISOString(), origin, browser: 'Playwright headless Chrome', browserVersion: browser.version(), appRevision: process.env.QA_APP_REVISION || null, config, syntheticIdentity: canary, results, sessions };
await writeFile(resolve(out, process.env.QA_RESULTS || 'browser-results.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(`RESULT ${results.filter(result => result.status === 'PASS').length}/${results.length} checks passed`);
process.exitCode = results.some(result => result.status === 'FAIL') ? 1 : 0;
