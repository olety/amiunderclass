import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frames = path.join(root, 'compositions/frames');
fs.mkdirSync(frames, {recursive:true});
const live = process.argv.includes('--live');
const silentCheck = process.argv.includes('--silent-check');
const css = `
@font-face{font-family:Archivo;src:url('assets/fonts/archivo-variable.woff2') format('woff2');font-weight:400 700;font-display:block}
@font-face{font-family:Plex;src:url('assets/fonts/IBMPlexMono-500.woff2') format('woff2');font-weight:500;font-display:block}
@font-face{font-family:Cormorant;src:url('assets/fonts/CormorantGaramond-400.woff2') format('woff2');font-weight:400;font-display:block}
*{box-sizing:border-box}#root{position:relative;width:1920px;height:1080px;overflow:hidden;color:#243b4b;font-family:Archivo,sans-serif}
.clip{position:absolute;inset:0}.ground{background:#eee8dc}.visual{position:absolute;inset:0;overflow:hidden}
video.archive,video.cinema,.plate{width:1920px;height:1080px;object-fit:cover;object-position:center}
video.cinema{object-position:center top}
video.ui{left:96px;top:0;width:1728px;height:1080px;object-fit:contain}
.printed{background:#eee8dc;padding:118px 140px;color:#243b4b}
.printed .line{display:block;font-family:Cormorant,serif;font-size:132px;font-weight:400;line-height:.98;letter-spacing:-.035em}
.printed .red{color:#94412f}.printed .small{display:block;font:500 27px Plex,monospace;letter-spacing:.08em;line-height:1.55}
.printed .question{display:block;max-width:1510px;font-size:112px;line-height:1.02;letter-spacing:-.055em;font-weight:600}
.print-top{position:absolute;left:140px;top:90px}.print-center{position:absolute;left:140px;top:326px}.print-bottom{position:absolute;left:140px;bottom:112px}
`;
function video(id,src,start,duration,{source=0,kind='ui'}={}) {
 return `<video id="${id}" class="clip ${kind}" src="${src}" data-start="${start}" data-duration="${duration}" data-media-start="${source}" data-hf-media-start-basis="local" data-track-index="1" muted playsinline></video>`;
}
function still(id,src,start,duration) {
 return `<div id="${id}-clip" class="clip" data-start="${start}" data-duration="${duration}" data-track-index="1"><div id="${id}-visual" class="visual"><img id="${id}-image" class="plate" src="${src}" /></div></div>`;
}
function print(id,start,duration,body) {
 return `<div id="${id}" class="clip printed" data-start="${start}" data-duration="${duration}" data-track-index="2"><div id="${id}-ink">${body}</div></div>`;
}
function scene(id,duration,body,script='') {
 const html=`<!doctype html><html><head><meta charset="UTF-8"></head><body><template><style>${css}</style><div id="root" data-composition-id="${id}" data-width="1920" data-height="1080" data-duration="${duration+.35}"><div id="ground-${id}" class="clip ground" data-start="0" data-duration="${duration+.35}" data-track-index="0"></div>${body}</div><script>window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});${script}window.__timelines["${id}"]=tl;</script></template></body></html>`;
 fs.writeFileSync(path.join(frames,`${id}.html`),html);
}
// Generated atmosphere never supplies UI evidence. Admit reviewed clips only.
const welcomeGenerated=fs.existsSync(path.join(root,'assets/generated/welcome.mp4'));
const exitGenerated=fs.existsSync(path.join(root,'assets/generated/exit.mp4'));
const plateSource=path.resolve(root,'../../../apps/web/public/plates/K0.webp');
if(!fs.existsSync(path.join(root,'assets/welcome-office.webp'))) fs.copyFileSync(plateSource,path.join(root,'assets/welcome-office.webp'));
scene('01-montage',8,
 video('welcome-cinema','assets/generated/welcome-slow.mp4',0,8.35,{kind:'cinema'}));
scene('02-arrival',4,video('arrival-footage','assets/product/arrival.mp4',0,4.35));
scene('02-premise',6,
 print('premise-future',0,3,`<div class="print-center"><span class="line">A beautiful future.</span><span class="line red">For the right people.</span></div>`)+
 print('premise-question',3,3.35,`<div class="print-center"><span class="question">Does Claude treat you<br>like an insider?</span></div>`), `tl.to('#premise-future-ink',{opacity:0,duration:.18,ease:'none'},2.82);tl.set('#premise-future-ink',{opacity:0},3);tl.fromTo('#premise-question-ink',{opacity:0},{opacity:1,duration:.22,ease:'none'},3);`);
scene('03-ticket',6,video('ticket-footage','assets/product/ticket.mp4',0,6.35,{source:3}));
const archiveEDL=[];
scene('04-waiting',11,
 video('waiting-room-atmosphere','assets/generated/welcome-slow.mp4',0,5.35,{kind:'cinema',source:2})+
 `<div id="waiting-new" class="visual">${video('waiting-actual','assets/product/waiting-hold.mp4',5,6.35)}</div>`,
 `tl.fromTo('#waiting-new',{opacity:0},{opacity:1,duration:.35,ease:'none'},5);`);
scene('05-window',4,video('window-footage','assets/product/window.mp4',0,4.35,{source:5.65}));
scene('06-papers',8,video('papers-footage','assets/product/papers.mp4',0,8.35,{source:3}));
scene('07-outside',5,video('outside-footage','assets/product/outside-hold.mp4',0,5.35));
scene('07-release',3,still('threshold-return','assets/generated/threshold-endframe.png',0,3.35),
 `tl.fromTo('#threshold-return-visual',{scale:1},{scale:1.03,duration:3.35,ease:'none'},0);`);
const slots=[['01-montage',0,8],['01-board',0,2],['02-arrival',8,4],['02-premise',12,6],['03-ticket',18,6],['04-waiting',24,11],['05-window',35,4],['06-papers',39,8],['07-outside',47,5],['07-release',52,3],['07-endcard',55,5]];
const host=slots.map(([id,start,duration],i)=>`<div id="stage-${id}" class="stage"><div id="slot-${id}" class="clip" data-composition-id="${id}" data-composition-src="compositions/frames/${id}.html" data-start="${start}" data-duration="${duration + (id==='07-endcard'||id==='01-board'?0:.35)}" data-track-index="${i===1?2:1}" data-width="1920" data-height="1080"></div></div>`).join('\n');
fs.writeFileSync(path.join(root,'index.html'),`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=1920,height=1080"><title>Underclass? Everyone is helped.</title><script src="assets/vendor/gsap.min.js"></script><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:1920px;height:1080px;overflow:hidden;background:#eee8dc}#root{position:relative;width:1920px;height:1080px;overflow:hidden}.clip,.stage{position:absolute;inset:0}</style></head><body><div id="root" data-composition-id="main" data-width="1920" data-height="1080" data-duration="60" data-fps="30">${host}${silentCheck ? '' : '<audio id="music-bed" src="assets/audio/underclass-score-60s.wav" data-start="0" data-duration="60" data-track-index="10" data-volume="1"></audio>'}</div><script>window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});${slots.filter(([id,start])=>start>0&&id!=='01-board').map(([id,start])=>`tl.fromTo('#stage-${id}',{opacity:0},{opacity:1,duration:.35,ease:'none'},${start});`).join('')}window.__timelines.main=tl;</script></body></html>`);
fs.writeFileSync(path.join(root,'timeline.json'),JSON.stringify({duration:60,fps:30,slots,archiveEDL,generated:{welcome:welcomeGenerated,exit:false,threshold:true},captureMode:live?'live':'recorded-pilot',captureNote:live?'Real deployed website and actual run.':'Real deployed website; explicitly labelled recorded v1 pilot. No waiting-count simulation and no visitor assignment.'},null,2)+'\n');
console.log('Built the 60-second welcome / identity / machinery / evidence / release master.');
