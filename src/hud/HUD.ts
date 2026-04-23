import { CarState } from '../car/CarPhysics';
import { RaceManager } from '../race/RaceManager';
import { CONFIG } from '../config';

export function renderHUD(
  ctx: CanvasRenderingContext2D,
  player: CarState,
  race: RaceManager,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);

  const lap = Math.min(player.lapCount + 1, CONFIG.TOTAL_LAPS);
  const rank = race.playerRank;
  const speed = Math.round(player.speed * 0.36); // px/s → km/h-ish

  // Background panel (bottom-right)
  const panelW = 180, panelH = 90;
  const px = width - panelW - 16;
  const py = height - panelH - 16;
  ctx.fillStyle = 'rgba(10,10,20,0.72)';
  roundRect(ctx, px, py, panelW, panelH, 12);
  ctx.fill();

  // Lap
  ctx.fillStyle = '#aaa';
  ctx.font = '13px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('VOLTA', px + 14, py + 26);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px monospace';
  ctx.fillText(`${lap} / ${CONFIG.TOTAL_LAPS}`, px + 60, py + 30);

  // Speed
  ctx.fillStyle = '#aaa';
  ctx.font = '13px monospace';
  ctx.fillText('KM/H', px + 14, py + 58);
  ctx.fillStyle = '#f9e79f';
  ctx.font = 'bold 26px monospace';
  ctx.fillText(`${speed}`, px + 68, py + 62);

  // Position
  ctx.fillStyle = '#aaa';
  ctx.font = '13px monospace';
  ctx.fillText('POS', px + 130, py + 26);
  ctx.fillStyle = '#7dcea0';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(ordinal(rank), px + 130, py + 50);

  // Countdown overlay (also stays visible briefly after GO to show VÁ!)
  if (race.phase === 'countdown') {
    renderCountdown(ctx, race.countdownDisplay, width, height);
  } else if (race.goDisplayTime > 0) {
    renderCountdown(ctx, 'VÁ!', width, height);
  }

  // Finished overlay
  if (race.phase === 'finished' && player.finished) {
    renderFinished(ctx, race, player, width, height);
  }

  // Race time (top-left)
  if (race.phase !== 'countdown') {
    ctx.fillStyle = 'rgba(10,10,20,0.6)';
    roundRect(ctx, 12, 12, 130, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#ccc';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(formatTime(race.raceTime), 22, 34);
  }
}

function renderCountdown(ctx: CanvasRenderingContext2D, text: string, w: number, h: number): void {
  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = text === 'VÁ!' ? '#2ecc71' : '#e74c3c';
  ctx.font = `bold ${text === 'VÁ!' ? 100 : 130}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);
  ctx.restore();
}

function renderFinished(
  ctx: CanvasRenderingContext2D,
  race: RaceManager,
  player: CarState,
  w: number, h: number,
): void {
  ctx.save();
  ctx.fillStyle = 'rgba(10,10,20,0.75)';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#f9e79f';
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CHEGADA!', w / 2, h / 2 - 50);

  ctx.fillStyle = '#fff';
  ctx.font = '32px monospace';
  ctx.fillText(`Tempo: ${formatTime(player.finishTime)}`, w / 2, h / 2 + 20);

  ctx.fillStyle = '#7dcea0';
  ctx.font = '28px monospace';
  ctx.fillText(`Posição: ${ordinal(race.playerRank)}`, w / 2, h / 2 + 65);

  ctx.restore();
}

function ordinal(n: number): string {
  return `${n}º`;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(2);
  return `${m}:${sec.padStart(5, '0')}`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
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
