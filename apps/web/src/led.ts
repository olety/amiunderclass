import { glyphs } from './glyphs';
export function led(lines: string[], cols = 22): string {
  const rows = lines.length * 8 - 1, width = cols * 6 - 1;
  let circles = '<g fill="#3a2a12">';
  for (let y = 0; y < rows; y++) for (let x = 0; x < width; x++) if (x % 6 !== 5 && y % 8 !== 7) circles += `<circle cx="${x+.5}" cy="${y+.5}" r=".42"/>`;
  circles += '</g><g fill="#F0B44A">';
  lines.forEach((line,index) => {
    const text = line.toUpperCase().padEnd(cols).slice(0,cols);
    for(let c=0;c<cols;c++) {const glyph = glyphs[text[c]] ?? glyphs['?'];for(let r=0;r<7;r++)for(let x=0;x<5;x++)if(glyph[r][x]==='#')circles+=`<circle cx="${c*6+x+.5}" cy="${index*8+r+.5}" r=".46"/>`;}
  });
  return `<svg viewBox="0 0 ${width} ${rows}" aria-hidden="true" focusable="false">${circles}</g></svg>`;
}
export function progressDots(finished: number, failed: number, total: number): string {
  const safeTotal = Math.max(0, Math.floor(total));
  const good = Math.max(0, Math.min(safeTotal, finished - failed));
  return `<div class="progress-dots" aria-hidden="true">${Array.from({length:safeTotal},(_,i)=>`<i class="${i<good?'lit':''}"></i>`).join('')}</div>`;
}
