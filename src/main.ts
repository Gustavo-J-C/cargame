import { GameLoop } from './core/GameLoop';
import { InputManager } from './core/InputManager';
import { RaceScene } from './scenes/RaceScene';
import { CONFIG } from './config';

const { CANVAS_WIDTH: W, CANVAS_HEIGHT: H } = CONFIG;

function setupCanvas(id: string): HTMLCanvasElement {
  const el = document.getElementById(id) as HTMLCanvasElement;
  el.width = W;
  el.height = H;
  return el;
}

function bindTouchBtn(id: string, keyCode: string, input: InputManager): void {
  const el = document.getElementById(id);
  if (!el) return;
  const press = (e: Event): void => {
    e.preventDefault();
    input.setVirtual(keyCode, true);
    el.classList.add('pressed');
  };
  const release = (e: Event): void => {
    e.preventDefault();
    input.setVirtual(keyCode, false);
    el.classList.remove('pressed');
  };
  el.addEventListener('touchstart',  press,   { passive: false });
  el.addEventListener('touchend',    release, { passive: false });
  el.addEventListener('touchcancel', release, { passive: false });
}

// Request fullscreen on first user touch (requires gesture, silent fail on iOS)
function tryFullscreen(): void {
  const el = document.documentElement as any;
  try {
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } catch (_) { /* ignored — iOS Safari doesn't support it */ }
}

function main(): void {
  const container = document.getElementById('game-container')!;
  container.style.width  = `${W}px`;
  container.style.height = `${H}px`;

  const gameCanvas = setupCanvas('game-canvas');
  const hudCanvas  = setupCanvas('hud-canvas');

  const ctx    = gameCanvas.getContext('2d')!;
  const hudCtx = hudCanvas.getContext('2d')!;

  // Use visualViewport when available — more accurate on mobile (handles
  // browser chrome, on-screen keyboard, safe areas better than innerWidth/Height)
  function getViewport(): { w: number; h: number } {
    const vp = window.visualViewport;
    return vp
      ? { w: vp.width, h: vp.height }
      : { w: window.innerWidth, h: window.innerHeight };
  }

  function resize(): void {
    const { w: vw, h: vh } = getViewport();
    const scale = Math.min(vw / W, vh / H);
    // Integer offsets avoid sub-pixel blurring on most devices
    const ox = Math.floor((vw - W * scale) / 2);
    const oy = Math.floor((vh - H * scale) / 2);
    // translate positions the scaled canvas, transformOrigin 0 0 keeps math clean
    container.style.transform = `translate(${ox}px,${oy}px) scale(${scale})`;
  }

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 120));
  window.visualViewport?.addEventListener('resize', resize);
  resize();

  const input = new InputManager();

  bindTouchBtn('btn-left',  'ArrowLeft',  input);
  bindTouchBtn('btn-right', 'ArrowRight', input);
  bindTouchBtn('btn-gas',   'ArrowUp',    input);
  bindTouchBtn('btn-brake', 'ArrowDown',  input);

  // Fullscreen on first touch (must be triggered by user gesture)
  document.addEventListener('touchstart', tryFullscreen, { once: true, passive: true });

  const scene = new RaceScene(input);

  const restartBtn = document.getElementById('btn-restart')!;
  const triggerRestart = (e: Event): void => {
    e.preventDefault();
    scene.restart();
    restartBtn.style.display = 'none';
  };
  restartBtn.addEventListener('click',    triggerRestart);
  restartBtn.addEventListener('touchend', triggerRestart, { passive: false });

  const loop = new GameLoop(
    ctx, hudCtx,
    (dt) => {
      scene.update(dt);
      restartBtn.style.display = scene.isFinished ? 'block' : 'none';
    },
    (c, h) => scene.render(c, h),
  );
  loop.start();
}

main();
