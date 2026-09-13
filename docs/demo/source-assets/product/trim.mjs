import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
const out=path.dirname(new URL(import.meta.url).pathname);
const input=path.join(out,'product-recorded-pilot.webm');
const capture=JSON.parse(await fs.readFile(path.join(out,'events.json'),'utf8'));
const event=name=>{const value=capture.events.find(e=>e.name===name);if(!value)throw new Error('Missing event '+name);return value.seconds;};
const work=path.join(out,'.trimwork');await fs.mkdir(work,{recursive:true});
const run=args=>new Promise((resolve,reject)=>{const child=spawn('rtk',['proxy','/opt/homebrew/bin/ffmpeg','-hide_banner','-loglevel','error','-y',...args]);let error='';child.stderr.on('data',d=>error+=d);child.on('error',reject);child.on('exit',code=>code?reject(new Error(error||`FFmpeg exited ${code}`)):resolve());});
const clips=[
 {file:'arrival.mp4',duration:8,segments:[{start:event('arrival-start'),sourceDuration:8,duration:8}]},
 {file:'ticket.mp4',duration:12,segments:[
  {start:event('ticket-lifted-start')-1.4,sourceDuration:2,duration:2},
  {start:event('ticket-lifted-start')+1.8,sourceDuration:event('ticket-affiliation-done')-event('ticket-lifted-start')-1.7,duration:3,accelerated:true},
  {start:event('preview-start'),sourceDuration:4,duration:4},
  {start:event('consent-checked')-1,sourceDuration:3,duration:3}
 ]},
 {file:'waiting.mp4',duration:4,segments:[{start:event('frame:07-waiting-closed')+.1,sourceDuration:4,duration:4}],note:'Closed office board. No run or count animation represented.'},
 {file:'window.mp4',duration:10,segments:[{start:event('frame:08-window-recorded')+.1,sourceDuration:7.1,duration:10,freezeTail:true}],note:'Recorded pilot, no visitor. Last frame is held for 2.9 seconds so the actual result line can be read.'},
 {file:'papers.mp4',duration:12,segments:[
  {start:event('paper-lifted-start')-1.5,sourceDuration:3,duration:3},
  {start:event('frame:11-paper-metrics')+.1,sourceDuration:4,duration:4},
  {start:event('frame:15-transcripts-answers')+.1,sourceDuration:5,duration:5}
 ],note:'Historical v1 grades and confidence, then three actual recorded answers. Not v2 latitude or a visitor placement.'},
 {file:'outside.mp4',duration:5,segments:[
  {start:event('frame:12-outside')+.1,sourceDuration:2,duration:2},
  {start:event('copy-prompt-clicked')-1.2,sourceDuration:3,duration:3}
 ]}
];
for(const clip of clips){
 const parts=[];
 for(const [index,seg] of clip.segments.entries()){
  const target=path.join(work,`${clip.file}.${index}.mp4`);parts.push(target);
  const speed=seg.sourceDuration/seg.duration;const filters=[];
  if(seg.accelerated){filters.push(`setpts=PTS/${speed.toFixed(6)}`);}
  if(seg.freezeTail)filters.push(`tpad=stop_mode=clone:stop_duration=${(seg.duration-seg.sourceDuration).toFixed(3)}`);
  filters.push('setpts=PTS-STARTPTS','fps=30','tpad=stop_mode=clone:stop_duration=0.2','format=yuv420p');
  await run(['-ss',seg.start.toFixed(3),'-t',seg.sourceDuration.toFixed(3),'-i',input,'-an','-vf',filters.join(','),'-t',seg.duration.toFixed(3),'-c:v','libx264','-preset','fast','-crf','16','-threads','2','-movflags','+faststart',target]);
 }
 const listing=path.join(work,clip.file+'.txt');await fs.writeFile(listing,parts.map(p=>`file '${p.replaceAll("'","'\\''")}'`).join('\n')+'\n');
 await run(['-f','concat','-safe','0','-i',listing,'-c','copy','-an','-movflags','+faststart',path.join(out,clip.file)]);
 const badge=clip.file==='ticket.mp4'?{file:'accelerated-ui-label.png',x:1300,y:18,enable:'between(t,2,5)'}:clip.file==='papers.mp4'?{file:'recorded-pilot-label.png',x:0,y:0,enable:'gte(t,7)'}:clip.file==='outside.mp4'?{file:'recorded-pilot-label.png',x:0,y:0,enable:'gte(t,2)'}:null;
 if(badge){const final=path.join(out,clip.file);const labelled=path.join(work,clip.file+'.labelled.mp4');await run(['-i',final,'-loop','1','-i',path.join(out,badge.file),'-filter_complex',`[0:v][1:v]overlay=${badge.x}:${badge.y}:enable='${badge.enable}':shortest=1[v]`,'-map','[v]','-an','-t',String(clip.duration),'-c:v','libx264','-preset','fast','-crf','16','-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',labelled]);await fs.rename(labelled,final);clip.captureOverlay=badge;}
 console.log(`Created ${clip.file}: ${clip.duration}s`);
}
await fs.writeFile(path.join(out,'clip-edl.json'),JSON.stringify({source:path.basename(input),sourceUrl:capture.source,dimensions:capture.viewport,frameRate:30,clips,notes:['All clips have no audio.','Capture-only pointer, prompt blur and sticky native mode label.','Only typing is accelerated and that segment is labelled with its measured UI speed.','The window result hold uses a freeze tail. No measurements are changed.']},null,2));
