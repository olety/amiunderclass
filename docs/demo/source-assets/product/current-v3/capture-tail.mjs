import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/olety/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.dirname(new URL(import.meta.url).pathname);
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:810},deviceScaleFactor:1,recordVideo:{dir:out,size:{width:1440,height:810}},permissions:['clipboard-read','clipboard-write']});
// Freeze development hot reload for this recording session only.
await context.routeWebSocket('**',ws=>ws.close());
const page=await context.newPage();const video=page.video();const start=Date.now();const clips=[];
const hold=ms=>page.waitForTimeout(ms);
const settle=async()=>{await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(x=>x.decode().catch(()=>{})));});await hold(1000);};
const shot=async(name,duration,action)=>{const at=(Date.now()-start)/1000;console.log(name,at);if(action)await action();await hold(Math.max(0,duration*1000-(Date.now()-start-at*1000)));await page.screenshot({path:path.join(out,name+'.png')});clips.push({name,start:at,duration});};
await page.goto('http://127.0.0.1:5173/?room=ticket',{waitUntil:'networkidle'});await settle();
await page.locator('#lift-ticket,#pickup-ticket').first().click();await settle();
await page.locator('#recorded').click();await page.waitForSelector('.mode-strip');await page.waitForSelector('#collect-papers');await settle();
await shot('window',10.6);
await page.locator('#collect-papers').click();await settle();
await page.keyboard.press('ArrowRight');await page.waitForSelector('#copy-prompt');await page.locator('#copy-prompt').scrollIntoViewIfNeeded();await settle();
await shot('outside',6.6,async()=>{await hold(2500);await page.locator('#copy-prompt').click();await settle();});
await context.close();await video.saveAs(path.join(out,'current-website-tail.webm'));await browser.close();
await fs.writeFile(path.join(out,'capture-tail.json'),JSON.stringify({source:'http://127.0.0.1:5173',capturedAt:new Date().toISOString(),notes:['No UI styles, text, data or counters changed.','Vite HMR websocket blocked in this browser session to preserve the recorded-pilot state while other agents edit the live source.','Historical recorded pilot loaded from actual /api/example. No paid call.','The film replaces papers with an editorial card; no papers clip requested.'],clips},null,2)+'\n');
const ffmpeg=args=>new Promise((resolve,reject)=>{const child=spawn('rtk',['proxy','/opt/homebrew/bin/ffmpeg','-hide_banner','-loglevel','error','-y',...args]);let err='';child.stderr.on('data',b=>err+=b);child.on('error',reject);child.on('exit',n=>n?reject(Error(err)):resolve());});
const first=JSON.parse(await fs.readFile(path.join(out,'capture.json'),'utf8')).clips.filter(x=>['arrival','ticket','waiting'].includes(x.name));
for(const [group,file] of [[first,'current-website.webm'],[clips,'current-website-tail.webm']])for(const clip of group){await ffmpeg(['-ss',String(clip.start),'-i',path.join(out,file),'-t',String(clip.duration),'-an','-vf','scale=1920:1080:flags=lanczos,fps=30,setsar=1','-c:v','libx264','-preset','fast','-crf','16','-g','30','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,clip.name+'.mp4')]);console.log('Encoded',clip.name);}
