export type Point = [number, number];
export interface Plate { key: string; src: string; srcSmall?: string; w: number; h: number; paper: [Point, Point, Point, Point] | null; board?: [Point, Point, Point, Point]; portrait?: Omit<Plate, 'key' | 'portrait'> }
const hall = '/reference-stills/hall.jpg';
const ticket: Plate = { key: 'K1', src: '/reference-stills/ticket.jpg', w: 1152, h: 768, paper: [[476,288],[812,281],[806,612],[486,616]] };
const fallbacks: Record<string, Plate> = Object.fromEntries(['K0','K2','K3','K6'].map(key => [key, {key,src:hall,w:1152,h:768,paper:null}]));
Object.assign(fallbacks, {K1:ticket,K5:{key:'K5',src:'/reference-stills/papers.jpg',w:1152,h:768,paper:[[413,628],[758,632],[862,938],[268,930]]}});
for (const key of ['K4-1','K4-3','K4-5']) fallbacks[key] = {key,src:'/reference-stills/window.jpg',w:1152,h:768,paper:null};
let plates = {...fallbacks};
export async function loadPlates() {
  try {
    const response = await fetch('/plates/plates.json');
    if (!response.ok) return;
    const data = await response.json();
    const rows: Plate[] = Array.isArray(data) ? data : Array.isArray(data.plates) ? data.plates : Object.values(data);
    for (const p of rows) if (p && p.key && p.src && p.w > 0 && p.h > 0) plates[p.key] = p;
  } catch { /* Approved reference stills are always available. */ }
}
export function plate(key: string): Plate { return plates[key] ?? fallbacks.K0; }
export function plateImage(key: string, alt: string) {
  const p = plate(key);
  const portrait = p.portrait ? `<source media="(max-width: 680px)" srcset="${p.portrait.srcSmall || p.portrait.src}">` : '';
  return `<picture class="plate">${portrait}<img src="${p.src}" ${p.srcSmall ? `srcset="${p.srcSmall} 768w, ${p.src} ${p.w}w" sizes="100vw"` : ''} alt="${alt}" fetchpriority="high"></picture>`;
}
