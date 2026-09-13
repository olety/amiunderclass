import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/olety/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.dirname(new URL(import.meta.url).pathname);
const browser=await chromium.launch({channel:'chrome',headless:true});
// The current ticket backdrop caps at1440px. This real 16:9 viewport preserves
// the intended borderless room; encoding scales the actual capture to1080p.
const context=await browser.newContext({viewport:{width:1440,height:810},deviceScaleFactor:1,recordVideo:{dir:out,size:{width:1440,height:810}},permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage();
const video=page.video();
const origin='http://127.0.0.1:5173';
const start=Date.now(),events=[],clips=[];
const hold=ms=>page.waitForTimeout(ms);
const settle=async()=>{await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(x=>x.decode().catch(()=>{})));});await hold(1000);};
const mark=(name)=>{let seconds=(Date.now()-start)/1000;events.push({name,seconds});console.log(name,seconds);return seconds;};
const click=async selector=>{await page.locator(selector).first().click();await settle();};
const shot=async(name,duration,action)=>{const at=mark(name);if(action)await action();await hold(Math.max(0,duration*1000-(Date.now()-start-at*1000)));await page.screenshot({path:path.join(out,name+'.png')});clips.push({name,start:at,duration});};
let config;
try {
 await page.goto(origin+'/?room=arrival',{waitUntil:'networkidle'});await settle();
 config=await page.evaluate(()=>fetch('/api/config').then(r=>r.json()).catch(()=>({unavailable:true})));
 await shot('arrival',8.6);
 await click('.arrival-room [data-room="ticket"]');
 await shot('ticket',12.6,async()=>{await hold(1500);await click('#lift-ticket,#pickup-ticket');await page.locator('#field-name').pressSequentially('Citizen 041',{delay:120});await page.locator('#field-affiliation').pressSequentially('Independent developer',{delay:60});await page.locator('#field-affiliation').blur();});
 await page.keyboard.press('ArrowRight');await settle();
 await shot('waiting',7.6);
 await page.keyboard.press('ArrowLeft');await settle();await click('#recorded');
 await page.waitForSelector('.window-room');await settle();
 await shot('window',10.6);
 await click('#collect-papers');
 await shot('papers',12.6,async()=>{await hold(2200);await click('[data-lift-paper]');await hold(4000);await page.mouse.wheel(0,220);await settle();});
 await page.locator('button[data-room="outside"]').first().click();await settle();
 await page.locator('#copy-prompt').scrollIntoViewIfNeeded();await settle();
 await shot('outside',6.6,async()=>{await hold(2500);await click('#copy-prompt');});
} catch(error) {console.error(String(error));await page.screenshot({path:path.join(out,'capture-error.png')});throw error;}
finally {
 await context.close();await video.saveAs(path.join(out,'current-website.webm'));await browser.close();
 await fs.writeFile(path.join(out,'capture.json'),JSON.stringify({source:origin,capturedAt:new Date().toISOString(),viewport:{width:1440,height:810},output:{width:1920,height:1080,fps:30},identity:{name:'Citizen 041',affiliation:'Independent developer'},config:{liveEnabled:config?.liveEnabled,availability:config?.availability},notes:['Current local website. No CSS, DOM content, model data or counters altered.','No live run was submitted. Identity fields were typed but not sent.','Recorded-pilot shots retain the native visible provenance.','1440x810 native viewport scaled to1920x1080; this uses the current intended room layout without the obsolete navigation chrome.'],events,clips},null,2)+'\n');
}
const ffmpeg=args=>new Promise((resolve,reject)=>{const child=spawn('rtk',['proxy','/opt/homebrew/bin/ffmpeg','-hide_banner','-loglevel','error','-y',...args]);let err='';child.stderr.on('data',b=>err+=b);child.on('error',reject);child.on('exit',n=>n?reject(Error(err)):resolve());});
for(const clip of clips){await ffmpeg(['-ss',String(clip.start),'-i',path.join(out,'current-website.webm'),'-t',String(clip.duration),'-an','-vf','scale=1920:1080:flags=lanczos,fps=30,setsar=1','-c:v','libx264','-preset','fast','-crf','16','-g','30','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,clip.name+'.mp4')]);console.log('Encoded',clip.name);}
