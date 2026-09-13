export const officeSymbols = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <filter id="rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="ledglow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="felt" x="-10%" y="-40%" width="120%" height="180%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6"/></filter>
    <symbol id="sunmark" viewBox="-70 -70 140 140"><g id="ray"><path d="M -5,-30 C -1,-44 -10,-50 -4,-62 C -1,-68 3,-70 3,-70 C 6,-64 9,-58 3,-50 C 0,-44 7,-38 5,-30 Z"/></g><use href="#ray" transform="rotate(30)"/><use href="#ray" transform="rotate(60)"/><use href="#ray" transform="rotate(90)"/><use href="#ray" transform="rotate(120)"/><use href="#ray" transform="rotate(150)"/><use href="#ray" transform="rotate(180)"/><use href="#ray" transform="rotate(210)"/><use href="#ray" transform="rotate(240)"/><use href="#ray" transform="rotate(270)"/><use href="#ray" transform="rotate(300)"/><use href="#ray" transform="rotate(330)"/><circle r="26"/></symbol>
  </defs>
</svg>`;
export const sun = (size = 22) => `<svg width="${size}" height="${size}" aria-hidden="true" fill="currentColor"><use href="#sunmark" width="${size}" height="${size}"/></svg>`;
