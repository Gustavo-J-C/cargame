import { CarState } from '../car/CarPhysics';
import { RaceManager } from '../race/RaceManager';
import { TrackGeometry } from '../track/TrackData';
import { CONFIG } from '../config';

export interface RankingEntry {
  rank: number;
  name: string;
  time: number;
  date: string;
}

export function renderHUD(
  ctx: CanvasRenderingContext2D,
  player: CarState,
  race: RaceManager,
  geo: TrackGeometry,
  allCars: CarState[],
  rank: number,
  width: number,
  height: number,
  rankingData?: RankingEntry[],
): void {
  ctx.clearRect(0, 0, width, height);

  const lap   = Math.min(player.lapCount + 1, CONFIG.TOTAL_LAPS);
  const speed = Math.round(player.speed * 0.36);

  // ── Info panel (bottom-right) ──────────────────────────────────────────
  const panelW = 180, panelH = 90;
  const px = width - panelW - 16;
  const py = height - panelH - 16;
  ctx.fillStyle = 'rgba(10,10,20,0.72)';
  roundRect(ctx, px, py, panelW, panelH, 12);
  ctx.fill();

  ctx.fillStyle = '#aaa';
  ctx.font = '13px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('VOLTA', px + 14, py + 26);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px monospace';
  ctx.fillText(`${lap} / ${CONFIG.TOTAL_LAPS}`, px + 60, py + 30);

  ctx.fillStyle = '#aaa';
  ctx.font = '13px monospace';
  ctx.fillText('KM/H', px + 14, py + 58);
  ctx.fillStyle = '#f9e79f';
  ctx.font = 'bold 26px monospace';
  ctx.fillText(`${speed}`, px + 68, py + 62);

  ctx.fillStyle = '#aaa';
  ctx.font = '13px monospace';
  ctx.fillText('POS', px + 130, py + 26);
  ctx.fillStyle = '#7dcea0';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(ordinal(rank), px + 130, py + 50);

  // ── Countdown / GO overlay ─────────────────────────────────────────────
  if (race.phase === 'countdown') {
    renderCountdown(ctx, race.countdownDisplay, width, height);
  } else if (race.goDisplayTime > 0) {
    renderCountdown(ctx, 'VÁ!', width, height);
  }

  // ── Finish screen ──────────────────────────────────────────────────────
  if (race.phase === 'finished' && player.finished) {
    renderFinished(ctx, player, rank, width, height, rankingData);
  }

  // ── Race timer (top-left) ──────────────────────────────────────────────
  if (race.phase !== 'countdown') {
    ctx.fillStyle = 'rgba(10,10,20,0.6)';
    roundRect(ctx, 12, 12, 130, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#ccc';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(formatTime(race.raceTime), 22, 34);
  }

  // ── Minimap (bottom-left) ──────────────────────────────────────────────
  renderMinimap(ctx, geo, allCars, width, height);
}

// ── Helpers ───────────────────────────────────────────────────────────────

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
  player: CarState,
  rank: number,
  w: number,
  h: number,
  rankingData?: RankingEntry[],
): void {
  ctx.save();
  ctx.fillStyle = 'rgba(10,10,20,0.78)';
  ctx.fillRect(0, 0, w, h);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#f9e79f';
  ctx.font = 'bold 72px sans-serif';
  ctx.fillText('CHEGADA!', w / 2, h / 2 - 110);

  ctx.fillStyle = '#fff';
  ctx.font = '32px monospace';
  ctx.fillText(`Tempo: ${formatTime(player.finishTime)}`, w / 2, h / 2 - 52);

  ctx.fillStyle = '#7dcea0';
  ctx.font = '28px monospace';
  ctx.fillText(`Posição: ${ordinal(rank)}`, w / 2, h / 2 - 10);

  // Online ranking list
  if (rankingData && rankingData.length > 0) {
    ctx.fillStyle = '#aaa';
    ctx.font = '15px monospace';
    ctx.fillText('— RANKING ONLINE —', w / 2, h / 2 + 36);

    let y = h / 2 + 66;
    const show = rankingData.slice(0, 8);
    for (const e of show) {
      const isMe = Math.abs(e.time - player.finishTime) < 0.05;
      ctx.fillStyle = isMe ? '#f9e79f' : '#ccc';
      ctx.font = isMe ? 'bold 16px monospace' : '16px monospace';
      const name = e.name.length > 12 ? e.name.slice(0, 12) + '…' : e.name.padEnd(13, ' ');
      ctx.fillText(`${String(e.rank).padStart(2, ' ')}. ${name}  ${formatTime(e.time)}`, w / 2, y);
      y += 26;
    }
  } else if (rankingData === undefined) {
    // Still loading
    ctx.fillStyle = '#666';
    ctx.font = '14px monospace';
    ctx.fillText('Carregando ranking…', w / 2, h / 2 + 44);
  }

  ctx.restore();
}

function renderMinimap(
  ctx: CanvasRenderingContext2D,
  geo: TrackGeometry,
  allCars: CarState[],
  _width: number,
  height: number,
): void {
  const mw = 148, mh = 100;
  const mx = 16, my = height - mh - 16;

  const { minX, minY, maxX, maxY } = geo.bounds;
  const trackW = maxX - minX || 1;
  const trackH = maxY - minY || 1;
  const scale = Math.min(mw / trackW, mh / trackH) * 0.88;
  const offX = mx + mw / 2 - (minX + maxX) / 2 * scale;
  const offY = my + mh / 2 - (minY + maxY) / 2 * scale;

  // Panel background
  ctx.fillStyle = 'rgba(10,10,20,0.72)';
  roundRect(ctx, mx - 2, my - 2, mw + 4, mh + 4, 8);
  ctx.fill();

  // Track outline — draw every Nth centerline point to keep it fast
  const step = Math.max(1, Math.floor(geo.centerline.length / 120));
  ctx.save();
  ctx.strokeStyle = 'rgba(180,180,180,0.5)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < geo.centerline.length; i += step) {
    const p = geo.centerline[i];
    const x = offX + p.x * scale;
    const y = offY + p.y * scale;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Car dots
  const dotColors = ['#2ecc71', '#e74c3c', '#3498db', '#f39c12'];
  for (let i = 0; i < allCars.length; i++) {
    const car = allCars[i];
    const x = offX + car.position.x * scale;
    const y = offY + car.position.y * scale;
    ctx.fillStyle = dotColors[i % dotColors.length];
    ctx.beginPath();
    ctx.arc(x, y, i === 0 ? 4 : 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function ordinal(n: number): string { return `${n}º`; }

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
