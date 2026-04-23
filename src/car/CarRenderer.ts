import { CarState } from './CarPhysics';
import { KartPalette } from '../utils/colors';
import { CONFIG } from '../config';

export function drawCar(
  ctx: CanvasRenderingContext2D,
  car: CarState,
  palette: KartPalette,
  isPlayer = false,
): void {
  const { WIDTH: W, HEIGHT: H } = CONFIG.CAR;
  const { x, y } = car.position;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(car.angle);

  // Shadow
  ctx.save();
  ctx.translate(3, 4);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 0, W / 2 + 2, H / 2 + 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Wheels (four corners)
  ctx.fillStyle = palette.wheel;
  const wx = W * 0.38;
  const wy = H * 0.55;
  const ww = W * 0.18;
  const wh = H * 0.35;
  for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
    ctx.save();
    ctx.translate(sx * wx, sy * wy);
    // Front wheels steer slightly
    if (sx > 0) ctx.rotate(car.steer * 0.4);
    roundRect(ctx, -ww / 2, -wh / 2, ww, wh, 2);
    ctx.fill();
    ctx.restore();
  }

  // Body
  ctx.fillStyle = palette.body;
  roundRect(ctx, -W / 2, -H / 2, W, H, 4);
  ctx.fill();

  // Stripe
  ctx.fillStyle = palette.stripe;
  ctx.fillRect(-W * 0.1, -H / 2, W * 0.2, H);

  // Cockpit
  ctx.fillStyle = palette.cockpit;
  roundRect(ctx, -W * 0.15, -H * 0.32, W * 0.3, H * 0.64, 3);
  ctx.fill();

  // Player indicator (small star above)
  if (isPlayer) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▲', 0, -H / 2 - 6);
  }

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
