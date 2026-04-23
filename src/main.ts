import { GameLoop } from './core/GameLoop';
import { InputManager } from './core/InputManager';
import { RaceScene, GameConfig } from './scenes/RaceScene';
import { NetworkManager } from './network/NetworkManager';
import { CONFIG } from './config';
import type { Difficulty } from './config';

const { CANVAS_WIDTH: W, CANVAS_HEIGHT: H } = CONFIG;

// ── Canvas setup ────────────────────────────────────────────────────────────

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

function tryFullscreen(): void {
  const el = document.documentElement as unknown as { requestFullscreen?(): void; webkitRequestFullscreen?(): void };
  try {
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } catch (_) { /* iOS Safari doesn't support it */ }
}

// ── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  const container = document.getElementById('game-container')!;
  container.style.width  = `${W}px`;
  container.style.height = `${H}px`;

  const gameCanvas = setupCanvas('game-canvas');
  const hudCanvas  = setupCanvas('hud-canvas');
  const ctx    = gameCanvas.getContext('2d')!;
  const hudCtx = hudCanvas.getContext('2d')!;

  // Viewport resize — uses visualViewport when available (more accurate on mobile)
  function getViewport() {
    const vp = window.visualViewport;
    return vp ? { w: vp.width, h: vp.height } : { w: window.innerWidth, h: window.innerHeight };
  }

  function resize(): void {
    const { w: vw, h: vh } = getViewport();
    const scale = Math.min(vw / W, vh / H);
    const ox = Math.floor((vw - W * scale) / 2);
    const oy = Math.floor((vh - H * scale) / 2);
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

  document.addEventListener('touchstart', tryFullscreen, { once: true, passive: true });

  // ── Game state ─────────────────────────────────────────────────────────

  let scene: RaceScene | null = null;
  const restartBtn = document.getElementById('btn-restart')!;

  const loop = new GameLoop(
    ctx, hudCtx,
    (dt) => {
      if (!scene) return;
      scene.update(dt);
      restartBtn.style.display = scene.isFinished ? 'block' : 'none';
    },
    (c, h) => scene?.render(c, h),
  );

  function startGame(config: GameConfig): void {
    scene = new RaceScene(input, config);
    restartBtn.style.display = 'none';
    hideLobby();
  }

  // ── Restart button ─────────────────────────────────────────────────────

  const triggerRestart = (e: Event): void => {
    e.preventDefault();
    if (!scene) return;
    if (scene.gameMode === 'online') {
      scene.disconnect();
      scene = null;
      restartBtn.style.display = 'none';
      showLobby();
    } else {
      scene.restart();
      restartBtn.style.display = 'none';
    }
  };
  restartBtn.addEventListener('click',    triggerRestart);
  restartBtn.addEventListener('touchend', triggerRestart, { passive: false });

  // ── Lobby ──────────────────────────────────────────────────────────────

  const lobby         = document.getElementById('lobby-overlay')!;
  const stepName      = document.getElementById('step-name')!;
  const stepAI        = document.getElementById('step-ai')!;
  const stepOnline    = document.getElementById('step-online')!;
  const stepWaiting   = document.getElementById('step-waiting')!;
  const nameInput     = document.getElementById('player-name') as HTMLInputElement;
  const errorMsg      = document.getElementById('lobby-error')!;

  // Restore saved name
  const savedName = localStorage.getItem('playerName');
  if (savedName) nameInput.value = savedName;

  function showLobby(): void {
    lobby.style.display = 'flex';
    showStep(stepName);
    container.style.opacity = '0';
  }

  function hideLobby(): void {
    lobby.style.display = 'none';
    container.style.opacity = '1';
  }

  function showStep(step: HTMLElement): void {
    for (const s of [stepName, stepAI, stepOnline, stepWaiting]) s.hidden = true;
    step.hidden = false;
    errorMsg.textContent = '';
  }

  function getPlayerName(): string {
    const name = nameInput.value.trim().slice(0, 20) || 'Piloto';
    localStorage.setItem('playerName', name);
    return name;
  }

  function showError(msg: string): void {
    errorMsg.textContent = msg;
  }

  // ── AI mode ────────────────────────────────────────────────────────────

  let selectedDifficulty: Difficulty = 'medium';

  document.getElementById('btn-mode-ai')!.addEventListener('click', () => showStep(stepAI));
  document.getElementById('btn-back-ai')!.addEventListener('click', () => showStep(stepName));

  for (const btn of document.querySelectorAll<HTMLButtonElement>('.diff-btn')) {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDifficulty = btn.dataset.diff as Difficulty;
    });
  }

  document.getElementById('btn-start-ai')!.addEventListener('click', () => {
    startGame({ playerName: getPlayerName(), mode: 'offline', difficulty: selectedDifficulty });
  });

  // ── Online mode ────────────────────────────────────────────────────────

  let network: NetworkManager | null = null;

  document.getElementById('btn-mode-online')!.addEventListener('click', () => showStep(stepOnline));
  document.getElementById('btn-back-online')!.addEventListener('click', () => showStep(stepName));

  async function connectNetwork(): Promise<NetworkManager | null> {
    if (network) { network.disconnect(); network = null; }
    const nm = new NetworkManager();
    try {
      await nm.connect();
      network = nm;
      return nm;
    } catch {
      showError('Não foi possível conectar ao servidor. Verifique a conexão.');
      return null;
    }
  }

  // Create room
  document.getElementById('btn-create-room')!.addEventListener('click', async () => {
    const nm = await connectNetwork();
    if (!nm) return;
    const name = getPlayerName();

    nm.onRoomCreated = (code) => {
      (document.getElementById('room-code-display') as HTMLElement).textContent = code;
      (document.getElementById('btn-start-online') as HTMLElement).style.display = 'block';
      (document.getElementById('waiting-msg') as HTMLElement).style.display = 'none';
      updatePlayerList(nm);
      showStep(stepWaiting);
    };

    nm.onPlayerJoined = () => updatePlayerList(nm);
    nm.onPlayerLeft   = () => updatePlayerList(nm);

    nm.onStart = () => {
      startGame({ playerName: name, mode: 'online', difficulty: 'medium', network: nm });
    };

    nm.onError = (msg) => showError(msg);
    nm.createRoom(name);
  });

  // Join room
  document.getElementById('btn-join-room')!.addEventListener('click', async () => {
    const code = (document.getElementById('room-code-input') as HTMLInputElement).value.trim();
    if (code.length < 6) { showError('Código inválido. Deve ter 6 caracteres.'); return; }

    const nm = await connectNetwork();
    if (!nm) return;
    const name = getPlayerName();

    nm.onJoined = (_id, names) => {
      (document.getElementById('room-code-display') as HTMLElement).textContent = code.toUpperCase();
      (document.getElementById('btn-start-online') as HTMLElement).style.display = 'none';
      (document.getElementById('waiting-msg') as HTMLElement).style.display = 'block';
      (document.getElementById('players-list') as HTMLElement).innerHTML =
        names.map(n => `<div class="player-entry">${n}</div>`).join('');
      showStep(stepWaiting);
    };

    nm.onPlayerJoined = () => updatePlayerList(nm);
    nm.onPlayerLeft   = () => updatePlayerList(nm);

    nm.onStart = () => {
      startGame({ playerName: name, mode: 'online', difficulty: 'medium', network: nm });
    };

    nm.onError = (msg) => { showError(msg); nm.disconnect(); network = null; };
    nm.joinRoom(name, code);
  });

  // Host starts online race
  document.getElementById('btn-start-online')!.addEventListener('click', () => {
    if (network) network.startRace();
  });

  // Leave room
  document.getElementById('btn-leave-room')!.addEventListener('click', () => {
    network?.disconnect();
    network = null;
    showStep(stepOnline);
  });

  function updatePlayerList(nm: NetworkManager): void {
    (document.getElementById('players-list') as HTMLElement).innerHTML =
      nm.playerNames.map((n, i) => `<div class="player-entry">${i === 0 ? '👑 ' : ''}${n}</div>`).join('');
  }

  // Start with lobby visible
  showLobby();
  loop.start(); // loop runs but scene is null — no-op until game starts
}

main();
