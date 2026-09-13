import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/olety/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.dirname(new URL(import.meta.url).pathname);
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,recordVideo:{dir:out,size:{width:1440,height:900}},permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage();
const video=page.video();
const started=Date.now();
const events=[];
const mark=(name,extra={})=>{const e={name,seconds:(Date.now()-started)/1000,...extra};events.push(e);console.log(JSON.stringify(e));};
const hold=ms=>page.waitForTimeout(ms);
const settle=async()=>{await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await hold(700);};
const move=async(x,y)=>{await page.mouse.move(x,y,{steps:24});};
const click=async(selector)=>{const loc=page.locator(selector).first();await loc.scrollIntoViewIfNeeded();await hold(200);const box=await loc.boundingBox();if(!box)throw Error('No box '+selector);await move(box.x+box.width/2,box.y+box.height/2);await hold(300);await page.mouse.down();await hold(100);await page.mouse.up();await settle();};
const frame=async name=>{await settle();await page.screenshot({path:path.join(out,name+'.png')});mark('frame:'+name);};
await page.addInitScript(()=>{
  addEventListener('DOMContentLoaded',()=>{
    const style=document.createElement('style');
    style.textContent='.mode-strip{position:sticky!important;top:0!important;z-index:9999!important}.transcript-prompt,.exact-text.request{filter:blur(9px)!important;user-select:none!important}#demo-cursor{position:fixed;top:0;left:0;width:23px;height:29px;z-index:2147483647;pointer-events:none;filter:drop-shadow(0 1px 2px #0008);transform:translate(1120px,790px)}#demo-cursor svg{display:block;width:100%;height:100%}';
    document.head.append(style);
    const cursor=document.createElement('div');cursor.id='demo-cursor';cursor.setAttribute('aria-hidden','true');cursor.innerHTML='<svg viewBox="0 0 24 30"><path d="M2 1v24l6-6 4 9 4-2-4-8h9L2 1Z" fill="#fffdf5" stroke="#26211a" stroke-width="1.6"/></svg>';document.body.append(cursor);
    addEventListener('mousemove',e=>{cursor.style.transform=`translate(${e.clientX}px,${e.clientY}px)`;});
    addEventListener('mousedown',()=>{cursor.style.filter='drop-shadow(0 0 7px #d98541)';});
    addEventListener('mouseup',()=>{cursor.style.filter='drop-shadow(0 1px 2px #0008)';});
  });
});
try {
  await page.goto('https://amiunderclass.com',{waitUntil:'networkidle'});await settle();await move(1160,800);
  const config=await page.evaluate(()=>fetch('/api/config').then(r=>r.json()));
  await fs.writeFile(path.join(out,'availability.json'),JSON.stringify({capturedAt:new Date().toISOString(),liveEnabled:config.liveEnabled,byokEnabled:config.byokEnabled,rehearsalEnabled:config.rehearsalEnabled,availability:config.availability},null,2));
  mark('arrival-start');await frame('01-arrival');await hold(6000);
  await click('.arrival-room [data-room="ticket"]');mark('ticket-hand-start');await frame('02-ticket-hand');await hold(2500);
  await click('#pickup-ticket, #lift-ticket');mark('ticket-lifted-start');await frame('03-ticket-blank');await hold(1200);
  await click('#field-name');await page.locator('#field-name').pressSequentially('Citizen 041',{delay:130});mark('ticket-name-done');await hold(800);
  await click('#field-affiliation');await page.locator('#field-affiliation').pressSequentially('Independent developer',{delay:85});mark('ticket-affiliation-done');await hold(1000);
  await frame('04-ticket-identity');
  await page.locator('#identity-preview').scrollIntoViewIfNeeded();await settle();mark('preview-start');await frame('05-ticket-preview');await hold(3500);
  await click('#consent');mark('consent-checked');await frame('06-ticket-consent');await hold(2200);
  await click('.room-nav [data-room="waiting"]');mark('waiting-closed-start');await move(1220,805);await frame('07-waiting-closed');await hold(7000);
  await click('.room-nav [data-room="ticket"]');await click('#recorded');mark('recorded-window-start');await move(1220,815);await frame('08-window-recorded');await hold(8000);
  await click('#collect-papers');mark('paper-tray-start');await move(1200,815);await frame('09-paper-tray');await hold(3500);
  await click('[data-lift-paper]');mark('paper-lifted-start');await move(1180,815);await frame('10-paper-lifted');await hold(5000);
  await page.mouse.wheel(0,390);await settle();mark('paper-lower-start');await frame('11-paper-metrics');await hold(5000);
  await click('.room-nav [data-room="outside"]');await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await settle();mark('outside-start');await move(1200,805);await frame('12-outside');await hold(5000);
  const transcripts=page.locator('.evidence-label');await transcripts.scrollIntoViewIfNeeded();await settle();mark('transcripts-intro');await frame('13-transcripts-intro');await hold(2000);
  await click('.transcript > summary');await page.locator('.transcript[open]').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await settle();await move(1260,780);mark('transcripts-open');await frame('14-transcripts-blurred');await hold(6000);
  await page.locator('.transcript[open] .transcript-grid').evaluate(el=>{const y=el.getBoundingClientRect().top+window.scrollY-110;window.scrollTo({top:y,behavior:'smooth'});});await hold(1000);await settle();mark('transcripts-answers');await frame('15-transcripts-answers');await hold(5000);
  await page.locator('#copy-prompt').scrollIntoViewIfNeeded();await settle();mark('copy-prompt-before');await frame('16-copy-prompt-before');await hold(2200);await click('#copy-prompt');mark('copy-prompt-clicked');await frame('17-copy-prompt-copied');await hold(5500);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'smooth'}));await hold(1400);mark('outside-end');await frame('18-outside-end');await hold(4000);
} catch(error) {mark('error',{message:String(error)});await page.screenshot({path:path.join(out,'capture-error.png')});process.exitCode=1;}
finally {mark('capture-end');await fs.writeFile(path.join(out,'events.json'),JSON.stringify({source:'https://amiunderclass.com',viewport:{width:1440,height:900},startedAt:new Date(started).toISOString(),notes:['Real deployed UI captured. No model data or labels altered.','Capture-only SVG cursor mirrors actual Playwright mouse movements.','Protected request paragraphs are blurred with capture-only CSS.','The site native RECORDED PILOT strip is made sticky during capture so its truthful mode label remains visible.','Live and BYOK runs were disabled; recorded pilot remains labelled.'],events},null,2));await context.close();await video.saveAs(path.join(out,'product-recorded-pilot.webm'));await browser.close();}
