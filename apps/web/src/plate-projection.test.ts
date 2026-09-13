import {expect,test} from 'bun:test';
import {plateProjection} from './plate-projection';

test('the top-anchored desktop window keeps its entire placard in view',()=>{
  const p=plateProjection({w:1536,h:1024},{width:1440,height:720},[.5,0]);
  expect(p.scaleX).toBe(1.25);
  expect(p.scaleY).toBe(1.25);
  expect(p.offsetX).toBeCloseTo(0);
  expect(p.offsetY).toBeCloseTo(0);
  expect(3*p.scaleY+p.offsetY).toBe(3.75);
  expect(114*p.scaleY+p.offsetY).toBe(142.5);
});
test('mobile landscape paper follows the same horizontal cover crop as the photograph',()=>{
  const p=plateProjection({w:1536,h:1024},{width:390,height:649});
  expect(p.offsetX).toBeCloseTo(-291.75);
  expect(p.offsetY).toBe(0);
  expect(432.75*p.scaleX+p.offsetX).toBeCloseTo(73.9462890625);
  expect(372.75*p.scaleY+p.offsetY).toBeCloseTo(314.9931640625);
});
test('portrait coordinates use separate normalized axes without stretching the image',()=>{
  const p=plateProjection({w:1024,h:1536},{width:390,height:649});
  expect(p.offsetX).toBeCloseTo(-21.3333333333);
  expect(p.scaleX*1152).toBeCloseTo(432.6666666667);
  expect(p.scaleY*768).toBe(649);
  expect(576*p.scaleX+p.offsetX).toBeCloseTo(195);
  expect(384*p.scaleY+p.offsetY).toBeCloseTo(324.5);
});
