export type Point = readonly [x: number, y: number];
export type Corners = readonly [Point, Point, Point, Point];

const EPSILON = 1e-12;

/**
 * Maps (0, 0), (w, 0), (w, h), (0, h) to the destination corners.
 * Apply the returned CSS transform with transform-origin: 0 0.
 * Throws RangeError for invalid dimensions or a non-convex or degenerate quad.
 */
export function matrix3dFromCorners(dst: Corners, w: number, h: number): string {
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    throw new RangeError("The source width and height must be finite and positive.");
  }

  if (
    !Array.isArray(dst) ||
    dst.length !== 4 ||
    dst.some(
      (point) =>
        !Array.isArray(point) ||
        point.length !== 2 ||
        !point.every(Number.isFinite),
    )
  ) {
    throw new RangeError("The destination must contain four finite coordinate pairs.");
  }

  const [p0, p1, p2, p3] = dst;
  const offsets = dst.map(([x, y]): Point => [x - p0[0], y - p0[1]]);
  const span = Math.max(...offsets.flatMap(([x, y]) => [Math.abs(x), Math.abs(y)]));

  if (!Number.isFinite(span) || span === 0) {
    throw new RangeError("The destination corners must span a finite, nonzero area.");
  }

  // Removing translation and scale makes the degeneracy tolerance relative to the quad.
  const normalized = offsets.map(([x, y]): Point => [x / span, y / span]);
  let winding = 0;
  for (let i = 0; i < 4; i += 1) {
    const a = normalized[i]!;
    const b = normalized[(i + 1) % 4]!;
    const c = normalized[(i + 2) % 4]!;
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(cross) <= EPSILON || (winding !== 0 && Math.sign(cross) !== winding)) {
      throw new RangeError("The destination corners must form a convex, non-degenerate quad.");
    }
    winding = Math.sign(cross);
  }

  const [, q1, q2, q3] = normalized as [Point, Point, Point, Point];
  const dx1 = q1[0] - q2[0];
  const dx2 = q3[0] - q2[0];
  const dy1 = q1[1] - q2[1];
  const dy2 = q3[1] - q2[1];
  const dx3 = q2[0] - q1[0] - q3[0];
  const dy3 = q2[1] - q1[1] - q3[1];
  const determinant = dx1 * dy2 - dx2 * dy1;

  // Perspective terms for a unit square. Convexity above keeps the determinant nonzero.
  const perspectiveX = (dx3 * dy2 - dx2 * dy3) / determinant;
  const perspectiveY = (dx1 * dy3 - dx3 * dy1) / determinant;
  const denominators = [1, 1 + perspectiveX, 1 + perspectiveX + perspectiveY, 1 + perspectiveY];
  const denominatorTolerance = EPSILON * Math.max(...denominators.map(Math.abs));
  if (denominators.some((value) => !Number.isFinite(value) || value <= denominatorTolerance)) {
    throw new RangeError("The destination cannot be projected without crossing infinity.");
  }

  // CSS matrix3d is column-major. Divide the unit-square columns by the source size.
  const matrix = [
    (p1[0] - p0[0] + perspectiveX * p1[0]) / w,
    (p1[1] - p0[1] + perspectiveX * p1[1]) / w,
    0,
    perspectiveX / w,
    (p3[0] - p0[0] + perspectiveY * p3[0]) / h,
    (p3[1] - p0[1] + perspectiveY * p3[1]) / h,
    0,
    perspectiveY / h,
    0,
    0,
    1,
    0,
    p0[0],
    p0[1],
    0,
    1,
  ];

  if (!matrix.every(Number.isFinite)) {
    throw new RangeError("The supplied coordinates exceed the transform's numeric range.");
  }

  return `matrix3d(${matrix.join(",")})`;
}
