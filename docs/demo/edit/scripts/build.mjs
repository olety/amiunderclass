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
.printed .red{color:#ae4b36}.printed .small{display:block;font:500 27px Plex,monospace;letter-spacing:.08em;line-height:1.55}
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
 return `<div id="${id}" class="clip printed" data-start="${start}" data-duration="${duration}" data-track-index="2">${body}</div>`;
}
function scene(id,duration,body,script='') {
 const html=`<!doctype html><html><head><meta charset="UTF-8"></head><body><template><style>${css}</style><div id="root" data-composition-id="${id}" data-width="1920" data-height="1080" data-duration="${duration}"><div id="ground-${id}" class="clip ground" data-start="0" data-duration="${duration}" data-track-index="0"></div>${body}</div><script>window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});${script}window.__timelines["${id}"]=tl;</script></template></body></html>`;
 fs.writeFileSync(path.join(frames,`${id}.html`),html);
}
// Generated atmosphere never supplies UI evidence. Admit reviewed clips only.
const welcomeGenerated=fs.existsSync(path.join(root,'assets/generated/welcome.mp4'));
const exitGenerated=fs.existsSync(path.join(root,'assets/generated/exit.mp4'));
const plateSource=path.resolve(root,'../../../apps/web/public/plates/K0.webp');
if(!fs.existsSync(path.join(root,'assets/welcome-office.webp'))) fs.copyFileSync(plateSource,path.join(root,'assets/welcome-office.webp'));
scene('01-montage',8,
 (welcomeGenerated ? video('welcome-cinema','assets/generated/welcome.mp4',0,5,{kind:'cinema'}) : still('welcome-hall','assets/welcome-office.webp',0,5))+
 video('welcome-smile','assets/archive/06-courteous-clerk.mp4',5,3,{kind:'archive'}),
 welcomeGenerated ? '' : `tl.fromTo('#welcome-hall-visual',{scale:1},{scale:1.025,duration:5,ease:'none'},0);`);
scene('02-arrival',4,video('arrival-footage','assets/product/arrival.mp4',0,4));
scene('02-premise',6,
 print('premise-future',0,3,`<span class="small print-top">PUBLIC OFFICE · EVERYONE IS HELPED</span><div class="print-center"><span class="line">A beautiful future.</span><span class="line red">For the right people.</span></div>`)+
 print('premise-question',3,3,`<span class="small print-top">AMANDA ASKELL HELPS SHAPE CLAUDE.</span><div class="print-center"><span class="question">Does it treat you<br>like an insider?</span></div><span class="small print-bottom">YOUR NAME. NO NAME. AMANDA ASKELL.<br>THE SAME REQUESTS TO CLAUDE.</span>`));
scene('03-ticket',6,video('ticket-footage','assets/product/ticket.mp4',0,6,{source:3}));
const archiveEDL=[
 {scene:'01-montage',name:'06-courteous-clerk',start:5,duration:3,source:0},
 {scene:'04-waiting',name:'05-waiting-room',start:0,duration:2.5,source:0},
 {scene:'04-waiting',name:'04-typing-hands',start:2.5,duration:1.5,source:0},
 {scene:'04-waiting',name:'02-paper-files',start:4,duration:1.5,source:.3},
 {scene:'04-waiting',name:'04-typing-hands',start:5.5,duration:2,source:0},
];
scene('04-waiting',11,
 archiveEDL.filter(a=>a.scene==='04-waiting').map((a,i)=>video(`waiting-archive-${i}`,`assets/archive/${a.name}.mp4`,a.start,a.duration,{source:a.source,kind:'archive'})).join('')+
 video('waiting-actual','assets/product/waiting.mp4',7.5,3.5));
scene('05-window',4,video('window-footage','assets/product/window.mp4',0,4,{source:6}));
scene('06-papers',8,video('papers-footage','assets/product/papers.mp4',0,8,{source:3}));
scene('07-outside',5,video('outside-footage','assets/product/outside.mp4',0,5));
let release;
if(exitGenerated) {
 release=video('release-exit','assets/generated/exit.mp4',0,3,{kind:'cinema'});
} else {
 const cuts=[['04-typing-hands',0,.5,0],['09-filing-cabinet',.5,.5,1],['06-courteous-clerk',1,.5,1],['02-paper-files',1.5,.5,1],['01-marching',2,.5,1],['09-filing-cabinet',2.5,.5,2]];
 release=cuts.map(([name,start,duration,source],i)=>{
  archiveEDL.push({scene:'07-release',name,start,duration,source});
  return video(`release-archive-${i}`,`assets/archive/${name}.mp4`,start,duration,{kind:'archive',source});
 }).join('');
}
scene('07-release',3,release);
const slots=[['01-montage',0,8],['01-board',0,2],['02-arrival',8,4],['02-premise',12,6],['03-ticket',18,6],['04-waiting',24,11],['05-window',35,4],['06-papers',39,8],['07-outside',47,5],['07-release',52,3],['07-endcard',55,5]];
const host=slots.map(([id,start,duration],i)=>`<div id="slot-${id}" class="clip" data-composition-id="${id}" data-composition-src="compositions/frames/${id}.html" data-start="${start}" data-duration="${duration}" data-track-index="${i===1?2:1}" data-width="1920" data-height="1080"></div>`).join('\n');
fs.writeFileSync(path.join(root,'index.html'),`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=1920,height=1080"><title>Underclass? Everyone is helped.</title><script src="assets/vendor/gsap.min.js"></script><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:1920px;height:1080px;overflow:hidden;background:#eee8dc}#root{position:relative;width:1920px;height:1080px;overflow:hidden}.clip{position:absolute;inset:0}</style></head><body><div id="root" data-composition-id="main" data-width="1920" data-height="1080" data-duration="60" data-fps="30">${host}${silentCheck ? '' : '<audio id="music-bed" src="assets/audio/underclass-score-60s.wav" data-start="0" data-duration="60" data-track-index="10" data-volume="1"></audio>'}</div><script>window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});window.__timelines.main=tl;</script></body></html>`);
fs.writeFileSync(path.join(root,'timeline.json'),JSON.stringify({duration:60,fps:30,slots,archiveEDL,generated:{welcome:welcomeGenerated,exit:exitGenerated},captureMode:live?'live':'recorded-pilot',captureNote:live?'Real deployed website and actual run.':'Real deployed website; explicitly labelled recorded v1 pilot. No waiting-count simulation and no visitor assignment.'},null,2)+'\n');
console.log('Built the 60-second welcome / identity / machinery / evidence / release master.');
