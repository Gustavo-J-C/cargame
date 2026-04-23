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

// Bind a touch button to a virtual key — handles multi-touch correctly
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

function main(): void {
  const container = document.getElementById('game-container')!;
  container.style.width  = `${W}px`;
  container.style.height = `${H}px`;

  const gameCanvas = setupCanvas('game-canvas');
  const hudCanvas  = setupCanvas('hud-canvas');

  const ctx    = gameCanvas.getContext('2d')!;
  const hudCtx = hudCanvas.getContext('2d')!;

  const input = new InputManager();

  // Wire touch buttons → virtual keys
  bindTouchBtn('btn-left',  'ArrowLeft',  input);
  bindTouchBtn('btn-right', 'ArrowRight', input);
  bindTouchBtn('btn-gas',   'ArrowUp',    input);
  bindTouchBtn('btn-brake', 'ArrowDown',  input);

  // Scale game canvas to fill available screen
  function resize(): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min(vw / W, vh / H);

    container.style.transform       = `scale(${scale})`;
    container.style.transformOrigin = 'top left';
    container.style.position        = 'absolute';
    container.style.left            = `${(vw - W * scale) / 2}px`;
    container.style.top             = `${(vh - H * scale) / 2}px`;
  }

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  resize();

  const scene = new RaceScene(input);

  // Restart button — HTML element so touch works natively on mobile
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
      // Show/hide restart button based on race state
      restartBtn.style.display = scene.isFinished ? 'block' : 'none';
    },
    (c, h) => scene.render(c, h),
  );
  loop.start();
}

main();
