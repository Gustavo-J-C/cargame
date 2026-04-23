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

// Signature now accepts camera position so the background tiles correctly
// in world space (ctx already has the camera transform applied by the caller).
export function renderTrack(
  ctx: CanvasRenderingContext2D,
  def: TrackDefinition,
  geo: TrackGeometry,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number,
): void {
  const margin = 250;
  const bx = camX - viewW / 2 - margin;
  const by = camY - viewH / 2 - margin;
  const bw = viewW + margin * 2;
  const bh = viewH + margin * 2;

  // --- Layer 1: Grass background (world-space rect covering the viewport) ---
  ctx.fillStyle = def.backgroundColor;
  ctx.fillRect(bx, by, bw, bh);

  // Darker diagonal stripes (world-fixed so they don't scroll with camera)
  ctx.fillStyle = TRACK_COLORS.grassDark;
  for (let x = bx - bh; x < bx + bw + bh; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x,        by);
    ctx.lineTo(x + 40,   by);
    ctx.lineTo(x + 40 + bh, by + bh);
    ctx.lineTo(x + bh,   by + bh);
    ctx.closePath();
    ctx.fill();
  }

  // --- Layer 1b: Trees (behind road, over grass) ---
  renderTrees(ctx, geo, camX, camY, viewW, viewH);

  // --- Layer 2: Road surface ---
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Run-off strip: sandy stroke just outside road edges (fill covers inner half)
  ctx.strokeStyle = TRACK_COLORS.runOff;
  ctx.lineWidth = 28;
  drawPolyline(ctx, geo.boundaryPolygon, true);
  ctx.stroke();

  ctx.fillStyle = def.roadColor;
  drawPolyline(ctx, geo.boundaryPolygon, true);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 6;
  drawPolyline(ctx, geo.leftEdge, false);
  ctx.stroke();
  drawPolyline(ctx, geo.rightEdge, false);
  ctx.stroke();

  ctx.restore();

  // --- Layer 3: Lane dividers + centre line ---
  ctx.save();

  // Two outer lane dividers (subtle, white)
  ctx.setLineDash([14, 24]);
  ctx.strokeStyle = 'rgba(255,255,255,0.30)';
  ctx.lineWidth = 2;
  drawPolyline(ctx, geo.laneDividerL, false);
  ctx.stroke();
  drawPolyline(ctx, geo.laneDividerR, false);
  ctx.stroke();

  // Centre dashed line (yellow, more prominent)
  ctx.setLineDash([18, 18]);
  ctx.strokeStyle = TRACK_COLORS.roadLine;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.55;
  drawPolyline(ctx, geo.centerline, false);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.restore();

  // --- Layer 4: Kerbs ---
  renderKerbs(ctx, geo);

  // --- Layer 5: Start/finish line ---
  renderStartLine(ctx, geo);
}

function renderKerbs(ctx: CanvasRenderingContext2D, geo: TrackGeometry): void {
  const n = geo.centerline.length;
  const kerbStep = 6;

  for (let i = 0; i < n; i += kerbStep) {
    const colorIndex = Math.floor(i / kerbStep) % 2;
    const kerbColor = colorIndex === 0 ? TRACK_COLORS.kerbRed : TRACK_COLORS.kerbWhite;

    drawKerbRect(ctx, geo.leftEdge,  geo.centerline, i, Math.min(i + kerbStep, n - 1), kerbColor, 8);
    drawKerbRect(ctx, geo.rightEdge, geo.centerline, i, Math.min(i + kerbStep, n - 1), kerbColor, 8);
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

function renderTrees(
  ctx: CanvasRenderingContext2D,
  geo: TrackGeometry,
  camX: number, camY: number, viewW: number, viewH: number,
): void {
  const cullX1 = camX - viewW / 2 - 60;
  const cullX2 = camX + viewW / 2 + 60;
  const cullY1 = camY - viewH / 2 - 60;
  const cullY2 = camY + viewH / 2 + 60;

  for (let i = 0; i < geo.treePositions.length; i++) {
    const tp = geo.treePositions[i];
    if (tp.x < cullX1 || tp.x > cullX2 || tp.y < cullY1 || tp.y > cullY2) continue;

    // Vary radius slightly per tree for a natural look
    const hash = Math.sin(i * 127.1 + tp.x * 0.03) * 0.5 + 0.5;
    const r = 16 + hash * 8; // 16–24 px

    // Shadow
    ctx.fillStyle = TRACK_COLORS.treeShadow;
    ctx.beginPath();
    ctx.ellipse(tp.x + 5, tp.y + 7, r * 0.9, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Canopy
    ctx.fillStyle = TRACK_COLORS.tree;
    ctx.beginPath();
    ctx.arc(tp.x, tp.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Highlight (smaller, offset up-left)
    ctx.fillStyle = TRACK_COLORS.treeHighlight;
    ctx.beginPath();
    ctx.arc(tp.x - r * 0.28, tp.y - r * 0.28, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderStartLine(ctx: CanvasRenderingContext2D, geo: TrackGeometry): void {
  const { left, right } = geo.startLine;
  const segments = 8;
  const dx = (right.x - left.x) / segments;
  const dy = (right.y - left.y) / segments;

  const len = Math.sqrt(dx * dx + dy * dy);
  const px = -dy / len * 10;
  const py =  dx / len * 10;

  for (let i = 0; i < segments; i++) {
    const x = left.x + dx * i;
    const y = left.y + dy * i;
    const color = (i % 2 === 0) ? '#fff' : '#111';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x,       y);
    ctx.lineTo(x + dx,  y + dy);
    ctx.lineTo(x + dx + px, y + dy + py);
    ctx.lineTo(x + px,  y + py);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = color === '#fff' ? '#111' : '#fff';
    ctx.beginPath();
    ctx.moveTo(x - px,       y - py);
    ctx.lineTo(x + dx - px,  y + dy - py);
    ctx.lineTo(x + dx,       y + dy);
    ctx.lineTo(x,            y);
    ctx.closePath();
    ctx.fill();
  }
}
