import { TrackDefinition, TrackGeometry } from './TrackData';
import { Vector2 } from '../utils/math';
import { TRACK_COLORS } from '../utils/colors';

function drawPolyline(ctx: CanvasRenderingContext2D, points: Vector2[], close = false): void {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  if (close) ctx.closePath();
}

export function renderTrack(
  ctx: CanvasRenderingContext2D,
  def: TrackDefinition,
  geo: TrackGeometry,
  width: number,
  height: number,
): void {
  // --- Layer 1: Grass background ---
  ctx.fillStyle = def.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Darker grass inner pattern (decorative diagonal stripes)
  ctx.fillStyle = TRACK_COLORS.grassDark;
  for (let x = -height; x < width + height; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 40, 0);
    ctx.lineTo(x + 40 + height, height);
    ctx.lineTo(x + height, height);
    ctx.closePath();
    ctx.fill();
  }

  // --- Layer 2: Road surface ---
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Draw road as a filled polygon (boundary polygon)
  ctx.fillStyle = def.roadColor;
  drawPolyline(ctx, geo.boundaryPolygon, true);
  ctx.fill();

  // Road edge shadow (outer glow effect)
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 6;
  drawPolyline(ctx, geo.leftEdge, false);
  ctx.stroke();
  drawPolyline(ctx, geo.rightEdge, false);
  ctx.stroke();

  ctx.restore();

  // --- Layer 3: Center dashed line ---
  ctx.save();
  ctx.setLineDash([18, 18]);
  ctx.strokeStyle = TRACK_COLORS.roadLine;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.5;
  drawPolyline(ctx, geo.centerline, false);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.restore();

  // --- Layer 4: Kerbs (alternating red/white) ---
  renderKerbs(ctx, geo);

  // --- Layer 5: Start/finish line ---
  renderStartLine(ctx, geo);
}

function renderKerbs(ctx: CanvasRenderingContext2D, geo: TrackGeometry): void {
  const n = geo.centerline.length;
  const kerbStep = 6; // every N samples draw a kerb block
  const kerbLength = kerbStep;

  for (let i = 0; i < n; i += kerbStep) {
    const colorIndex = Math.floor(i / kerbStep) % 2;
    const kerbColor = colorIndex === 0 ? TRACK_COLORS.kerbRed : TRACK_COLORS.kerbWhite;

    // Left kerb
    drawKerbRect(ctx, geo.leftEdge, geo.centerline, i, Math.min(i + kerbLength, n - 1), kerbColor, 8);
    // Right kerb
    drawKerbRect(ctx, geo.rightEdge, geo.centerline, i, Math.min(i + kerbLength, n - 1), kerbColor, 8);
  }
}

function drawKerbRect(
  ctx: CanvasRenderingContext2D,
  edge: Vector2[],
  center: Vector2[],
  from: number,
  to: number,
  color: string,
  depth: number,
): void {
  const n = edge.length;
  if (from >= n || to >= n) return;
  const a = edge[from];
  const b = edge[to];
  const ca = center[from];
  const cb = center[to];

  // Inset point toward center
  const insetA = a.add(ca.sub(a).normalize().scale(depth));
  const insetB = b.add(cb.sub(b).normalize().scale(depth));

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(insetB.x, insetB.y);
  ctx.lineTo(insetA.x, insetA.y);
  ctx.closePath();
  ctx.fill();
}

function renderStartLine(ctx: CanvasRenderingContext2D, geo: TrackGeometry): void {
  const { left, right } = geo.startLine;
  const segments = 8;
  const dx = (right.x - left.x) / segments;
  const dy = (right.y - left.y) / segments;

  // Perpendicular direction for width of each checker
  const len = Math.sqrt(dx * dx + dy * dy);
  const px = -dy / len * 10;
  const py = dx / len * 10;

  for (let i = 0; i < segments; i++) {
    const x = left.x + dx * i;
    const y = left.y + dy * i;
    const color = (i % 2 === 0) ? '#fff' : '#111';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.lineTo(x + dx + px, y + dy + py);
    ctx.lineTo(x + px, y + py);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = color === '#fff' ? '#111' : '#fff';
    ctx.beginPath();
    ctx.moveTo(x - px, y - py);
    ctx.lineTo(x + dx - px, y + dy - py);
    ctx.lineTo(x + dx, y + dy);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
  }
}
