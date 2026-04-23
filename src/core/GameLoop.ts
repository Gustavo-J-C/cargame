export type UpdateFn = (dt: number) => void;
export type RenderFn = (ctx: CanvasRenderingContext2D, hudCtx: CanvasRenderingContext2D) => void;

export class GameLoop {
  private rafId = 0;
  private lastTime = 0;
  private running = false;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly hudCtx: CanvasRenderingContext2D,
    private readonly update: UpdateFn,
    private readonly render: RenderFn,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private tick = (now: number): void => {
    const dt = Math.min((now - this.lastTime) / 1000, 0.05); // cap at 50ms
    this.lastTime = now;
    this.update(dt);
    this.render(this.ctx, this.hudCtx);
    if (this.running) this.rafId = requestAnimationFrame(this.tick);
  };
}
