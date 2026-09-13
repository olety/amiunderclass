#!/usr/bin/env python3
"""Download exact completed Flora runs and make a five-frame temporal review."""
import json, pathlib, subprocess, hashlib
P=pathlib.Path(__file__).resolve().parent
status=json.loads((P/'flora-status.json').read_text())
runs=[]
for c in status.get('data',{}).get('content',[]):
 if c.get('type')=='text':
  try: runs.extend(json.loads(c['text']).get('runs',[]))
  except json.JSONDecodeError: pass
ledger=json.loads((P/'generated-ledger.json').read_text())
for clip in ledger['clips']:
 run=next(x for x in runs if x['run_id']==clip['run_id'])
 if run['status']!='completed': raise RuntimeError(run)
 out=next(x for x in run['outputs'] if x.get('type')=='videoUrl')
 path=P/clip['file']
 if not path.exists(): subprocess.run(['curl','--fail','--location','--silent','--show-error',out['url'],'-o',str(path)],check=True)
 meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,r_frame_rate','-of','json',str(path)]))
 clip.update(status='completed',output_url=out['url'],asset_id=out['asset_id'],metadata=meta,sha256=hashlib.sha256(path.read_bytes()).hexdigest())
 subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(path),'-vf','fps=1,scale=640:-1,tile=3x2','-frames:v','1',str(P/(path.stem+'-contact.jpg'))],check=True)
 print(clip['file'],meta)
(P/'generated-ledger.json').write_text(json.dumps(ledger,indent=2)+'\n')
