import { describe, expect, test } from "bun:test";
import { matrix3dFromCorners, type Corners, type Point } from "../src/homography";

function parseMatrix(css: string): number[] {
  expect(css).toMatch(/^matrix3d\([^()]+\)$/);
  const matrix = css.slice("matrix3d(".length, -1).split(",").map(Number);
  expect(matrix).toHaveLength(16);
  expect(matrix.every(Number.isFinite)).toBe(true);
  return matrix;
}

function project(matrix: number[], [x, y]: Point): Point {
  const divisor = matrix[3]! * x + matrix[7]! * y + matrix[15]!;
  return [
    (matrix[0]! * x + matrix[4]! * y + matrix[12]!) / divisor,
    (matrix[1]! * x + matrix[5]! * y + matrix[13]!) / divisor,
  ];
}

function expectCorners(dst: Corners, w: number, h: number): number[] {
  const matrix = parseMatrix(matrix3dFromCorners(dst, w, h));
  const src: Corners = [[0, 0], [w, 0], [w, h], [0, h]];
  const span = Math.max(...dst.flatMap(([x, y]) => [Math.abs(x - dst[0][0]), Math.abs(y - dst[0][1])]));
  const roundoff = 16 * Number.EPSILON * Math.max(...dst.flatMap(([x, y]) => [Math.abs(x), Math.abs(y)]));
  const tolerance = Math.max(span * 1e-10, roundoff);
  src.forEach((point, i) => {
    const actual = project(matrix, point);
    expect(Math.abs(actual[0] - dst[i]![0])).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(actual[1] - dst[i]![1])).toBeLessThanOrEqual(tolerance);
  });
  return matrix;
}

describe("matrix3dFromCorners", () => {
  test("maps the office ticket's four corners", () => {
    const matrix = expectCorners([[476, 288], [812, 281], [806, 612], [486, 616]], 340, 336);
    // office.html stores these coefficients rounded to six decimal places.
    const reference = [0.968028, -0.027581, 0, -0.000025, 0.101854, 1.067566, 0, 0.000148, 0, 0, 1, 0, 476, 288, 0, 1];
    matrix.forEach((value, i) => expect(value).toBeCloseTo(reference[i]!, 6));
  });

  test("maps the office A4 sheet's four corners", () => {
    const matrix = expectCorners([[413, 628], [758, 632], [862, 938], [268, 930]], 420, 594);
    const reference = [0.817598, 0.006330, 0, -0.000005, -0.433070, -0.147311, 0, -0.000705, 0, 0, 1, 0, 413, 628, 0, 1];
    matrix.forEach((value, i) => expect(value).toBeCloseTo(reference[i]!, 6));
  });

  test("preserves identity and affine interior points", () => {
    expect(matrix3dFromCorners([[0, 0], [340, 0], [340, 336], [0, 336]], 340, 336))
      .toBe("matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)");
    const matrix = expectCorners([[10, 20], [210, 60], [260, 160], [60, 120]], 100, 50);
    const center = project(matrix, [50, 25]);
    expect(center[0]).toBeCloseTo(135, 10);
    expect(center[1]).toBeCloseTo(90, 10);
    expect(matrix[3]).toBeCloseTo(0, 12);
    expect(matrix[7]).toBeCloseTo(0, 12);
  });

  test("applies perspective to interior points", () => {
    const matrix = expectCorners([[0, 0], [100, 0], [80, 100], [20, 100]], 100, 100);
    const center = project(matrix, [50, 50]);
    expect(center[0]).toBeCloseTo(50, 10);
    expect(center[1]).toBeCloseTo(62.5, 10);
  });

  test("accepts a reflected convex quad", () => {
    expectCorners([[100, 0], [0, 0], [0, 100], [100, 100]], 100, 100);
  });

  test("handles small quads and translated coordinates", () => {
    expectCorners([[0, 0], [1e-8, 0], [1e-8, 2e-8], [0, 2e-8]], 340, 336);
    expectCorners([[1e8, -1e8], [1e8 + 200, -1e8], [1e8 + 200, -1e8 + 100], [1e8, -1e8 + 100]], 340, 336);
  });

  test("rejects invalid source dimensions", () => {
    const square: Corners = [[0, 0], [100, 0], [100, 100], [0, 100]];
    for (const invalid of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => matrix3dFromCorners(square, invalid, 100)).toThrow(RangeError);
      expect(() => matrix3dFromCorners(square, 100, invalid)).toThrow(RangeError);
    }
  });

  test("rejects nonfinite and malformed destination coordinates", () => {
    for (const invalid of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(() => matrix3dFromCorners([[0, 0], [100, 0], [100, invalid], [0, 100]], 100, 100)).toThrow(RangeError);
    }
    for (const invalid of [[], [[0, 0]], [[0, 0], [100, 0], [100, 100], [0]], null]) {
      expect(() => matrix3dFromCorners(invalid as unknown as Corners, 100, 100)).toThrow(RangeError);
    }
  });

  test("rejects collapsed, collinear, crossed, and concave quads", () => {
    const invalidQuads: Corners[] = [
      [[1, 1], [1, 1], [1, 1], [1, 1]],
      [[0, 0], [100, 0], [100, 0], [0, 100]],
      [[0, 0], [100, 0], [200, 0], [0, 100]],
      [[0, 0], [100, 0], [200, 0], [300, 0]],
      [[0, 0], [100, 100], [100, 0], [0, 100]],
      [[0, 0], [100, 0], [25, 25], [0, 100]],
      [[0, 0], [100, 0], [100, 1e-12], [0, 1e-12]],
    ];
    for (const dst of invalidQuads) {
      expect(() => matrix3dFromCorners(dst, 100, 100)).toThrow(RangeError);
    }
  });

  test("rejects a transform whose coefficients overflow", () => {
    expect(() => matrix3dFromCorners([[0, 0], [100, 0], [100, 100], [0, 100]], Number.MIN_VALUE, 100))
      .toThrow(RangeError);
  });
});
