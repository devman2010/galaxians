// helper module not currently used elsewhere, provides bounds intersection helper
export function rectsIntersect(
  a: DOMRect | { x: number; y: number; width: number; height: number },
  b: DOMRect | { x: number; y: number; width: number; height: number }
) {
  const ax = a.x,
    ay = a.y,
    aw = a.width,
    ah = a.height;
  const bx = b.x,
    by = b.y,
    bw = b.width,
    bh = b.height;
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
