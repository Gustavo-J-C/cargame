export class Vector2 {
  constructor(public x: number, public y: number) {}

  add(v: Vector2): Vector2 { return new Vector2(this.x + v.x, this.y + v.y); }
  sub(v: Vector2): Vector2 { return new Vector2(this.x - v.x, this.y - v.y); }
  scale(s: number): Vector2 { return new Vector2(this.x * s, this.y * s); }
  dot(v: Vector2): number { return this.x * v.x + this.y * v.y; }
  length(): number { return Math.sqrt(this.x * this.x + this.y * this.y); }
  lengthSq(): number { return this.x * this.x + this.y * this.y; }
  normalize(): Vector2 {
    const len = this.length();
    return len > 0.0001 ? this.scale(1 / len) : new Vector2(0, 0);
  }
  perp(): Vector2 { return new Vector2(-this.y, this.x); }
  clone(): Vector2 { return new Vector2(this.x, this.y); }
  distTo(v: Vector2): number { return this.sub(v).length(); }
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function pointInPolygon(p: Vector2, poly: Vector2[]): boolean {
  let inside = false;
  const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function catmullRom(
  p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2, t: number
): Vector2 {
  const t2 = t * t;
  const t3 = t2 * t;
  return new Vector2(
    0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  );
}

export function nearestPointOnSegment(p: Vector2, a: Vector2, b: Vector2): { point: Vector2; t: number } {
  const ab = b.sub(a);
  const lenSq = ab.lengthSq();
  if (lenSq < 0.0001) return { point: a.clone(), t: 0 };
  const t = clamp(p.sub(a).dot(ab) / lenSq, 0, 1);
  return { point: a.add(ab.scale(t)), t };
}
