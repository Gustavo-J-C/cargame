export class InputManager {
  private keys = new Set<string>();
  private virtual = new Set<string>();

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));

    // Prevent scroll on mobile while playing
    document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }

  setVirtual(code: string, down: boolean): void {
    if (down) this.virtual.add(code);
    else this.virtual.delete(code);
  }

  isDown(code: string): boolean {
    return this.keys.has(code) || this.virtual.has(code);
  }

  get throttle(): number {
    return (this.isDown('ArrowUp') || this.isDown('KeyW')) ? 1 : 0;
  }
  get brake(): number {
    return (this.isDown('ArrowDown') || this.isDown('KeyS')) ? 1 : 0;
  }
  get steer(): number {
    const left = (this.isDown('ArrowLeft') || this.isDown('KeyA')) ? -1 : 0;
    const right = (this.isDown('ArrowRight') || this.isDown('KeyD')) ? 1 : 0;
    return left + right;
  }
}
