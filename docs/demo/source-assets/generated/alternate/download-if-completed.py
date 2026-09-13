import pathlib,json,subprocess
P=pathlib.Path(__file__).resolve().parent
r=json.loads((P/'veo-status.json').read_text())
runs=[]
for c in r.get('data',{}).get('content',[]):
 if c.get('type')=='text':
  try:runs+=json.loads(c['text']).get('runs',[])
  except json.JSONDecodeError:pass
print(json.dumps(runs,indent=2))
if len(runs)!=1 or runs[0].get('status')!='completed':raise SystemExit(0)
u=next(o['url'] for o in runs[0]['outputs'] if o.get('type')=='videoUrl')
v=P/'return-through-doorway-raw.mp4'
if not v.exists():subprocess.run(['curl','-fLsS',u,'-o',str(v)],check=True)
meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,r_frame_rate','-of','json',str(v)]))
(P/'return-metadata.json').write_text(json.dumps(meta,indent=2)+'\n')
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(v),'-vf','fps=1,scale=640:-1,tile=3x3','-frames:v','1',str(P/'return-temporal-review.jpg')],check=True)
print(meta)
