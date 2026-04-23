import { TrackDefinition } from '../TrackData';
import { Vector2 } from '../../utils/math';
import { TRACK_COLORS } from '../../utils/colors';

// Larger circuit — world spans roughly 3200 × 2200 px.
// Camera follows the player; the canvas viewport is 1280 × 720.
//
// Layout (clockwise, screen coords — y increases downward):
//
//  top-left corner ─── top straight ─── top-right corner
//      │                                        │
//   left straight                         right straight
//      │                                        │
//  bottom-left corner ── bottom straight ── bottom-right corner
//
// Right straight:  x ≈ 2700, y  500 → 1700
// Bottom straight: y ≈ 2080, x 2050 → 870
// Left straight:   x ≈  490, y 1520 → 630
// Top straight:    y ≈  200, x  960 → 2220

export const circuit02: TrackDefinition = {
  name: 'Grande Circuito',
  startFinishIndex: 0,
  backgroundColor: TRACK_COLORS.grass,
  roadColor: TRACK_COLORS.road,
  controlPoints: [
    // ── Right straight (going south = +y) ────────────────────────────────
    { position: new Vector2(2700,  500), targetSpeed: 1.0,  width: 92 }, // P0 start line
    { position: new Vector2(2700,  800), targetSpeed: 1.0,  width: 92 },
    { position: new Vector2(2700, 1100), targetSpeed: 1.0,  width: 92 },
    { position: new Vector2(2700, 1450), targetSpeed: 1.0,  width: 92 },
    { position: new Vector2(2700, 1700), targetSpeed: 0.88, width: 92 },

    // ── Bottom-right corner ───────────────────────────────────────────────
    { position: new Vector2(2650, 1900), targetSpeed: 0.65, width: 88 },
    { position: new Vector2(2500, 2030), targetSpeed: 0.52, width: 85 },
    { position: new Vector2(2300, 2080), targetSpeed: 0.55, width: 85 },
    { position: new Vector2(2050, 2080), targetSpeed: 0.65, width: 88 },

    // ── Bottom straight (going west = −x) ────────────────────────────────
    { position: new Vector2(1750, 2080), targetSpeed: 1.0,  width: 92 },
    { position: new Vector2(1450, 2080), targetSpeed: 1.0,  width: 92 },
    { position: new Vector2(1150, 2080), targetSpeed: 1.0,  width: 92 },
    { position: new Vector2(870,  2030), targetSpeed: 0.90, width: 90 },

    // ── Bottom-left corner ────────────────────────────────────────────────
    { position: new Vector2(660,  1920), targetSpeed: 0.65, width: 88 },
    { position: new Vector2(515,  1740), targetSpeed: 0.55, width: 85 },
    { position: new Vector2(490,  1530), targetSpeed: 0.58, width: 85 },

    // ── Left straight (going north = −y) ──────────────────────────────────
    { position: new Vector2(490,  1200), targetSpeed: 1.0,  width: 92 },
    { position: new Vector2(490,   900), targetSpeed: 1.0,  width: 92 },
    { position: new Vector2(490,   640), targetSpeed: 0.90, width: 92 },

    // ── Top-left corner ───────────────────────────────────────────────────
    { position: new Vector2(560,   430), targetSpeed: 0.65, width: 88 },
    { position: new Vector2(730,   265), targetSpeed: 0.55, width: 85 },
    { position: new Vector2(960,   200), targetSpeed: 0.60, width: 85 },

    // ── Top straight (going east = +x) ───────────────────────────────────
    { position: new Vector2(1280,  200), targetSpeed: 1.0,  width: 92 },
    { position: new Vector2(1630,  200), targetSpeed: 1.0,  width: 92 },
    { position: new Vector2(1980,  200), targetSpeed: 1.0,  width: 92 },
    { position: new Vector2(2220,  248), targetSpeed: 0.90, width: 90 },

    // ── Top-right corner (sweeping south back to right straight) ─────────
    { position: new Vector2(2460,  340), targetSpeed: 0.72, width: 88 },
    { position: new Vector2(2630,  456), targetSpeed: 0.80, width: 89 },
    // P0 follows: (2700, 500)
  ],
};
