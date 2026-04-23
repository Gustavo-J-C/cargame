import { TrackDefinition } from '../TrackData';
import { Vector2 } from '../../utils/math';
import { TRACK_COLORS } from '../../utils/colors';

// Large circuit — world ~3200 × 2200 px, camera follows player.
// Track width enlarged to ≈ 150 px on straights (comfortable 3-lane racing).

export const circuit02: TrackDefinition = {
  name: 'Grande Circuito',
  startFinishIndex: 0,
  backgroundColor: TRACK_COLORS.grass,
  roadColor: TRACK_COLORS.road,
  controlPoints: [
    // ── Right straight (going south) ─────────────────────────────────────
    { position: new Vector2(2700,  500), targetSpeed: 1.0,  width: 150 }, // P0 start line
    { position: new Vector2(2700,  800), targetSpeed: 1.0,  width: 150 },
    { position: new Vector2(2700, 1100), targetSpeed: 1.0,  width: 150 },
    { position: new Vector2(2700, 1450), targetSpeed: 1.0,  width: 150 },
    { position: new Vector2(2700, 1700), targetSpeed: 0.88, width: 148 },

    // ── Bottom-right corner ───────────────────────────────────────────────
    { position: new Vector2(2650, 1900), targetSpeed: 0.62, width: 138 },
    { position: new Vector2(2500, 2030), targetSpeed: 0.50, width: 128 },
    { position: new Vector2(2300, 2080), targetSpeed: 0.52, width: 128 },
    { position: new Vector2(2050, 2080), targetSpeed: 0.62, width: 138 },

    // ── Bottom straight (going west) ──────────────────────────────────────
    { position: new Vector2(1750, 2080), targetSpeed: 1.0,  width: 150 },
    { position: new Vector2(1450, 2080), targetSpeed: 1.0,  width: 150 },
    { position: new Vector2(1150, 2080), targetSpeed: 1.0,  width: 150 },
    { position: new Vector2(870,  2030), targetSpeed: 0.88, width: 145 },

    // ── Bottom-left corner ────────────────────────────────────────────────
    { position: new Vector2(660,  1920), targetSpeed: 0.62, width: 135 },
    { position: new Vector2(515,  1740), targetSpeed: 0.52, width: 128 },
    { position: new Vector2(490,  1530), targetSpeed: 0.55, width: 128 },

    // ── Left straight (going north) ───────────────────────────────────────
    { position: new Vector2(490,  1200), targetSpeed: 1.0,  width: 150 },
    { position: new Vector2(490,   900), targetSpeed: 1.0,  width: 150 },
    { position: new Vector2(490,   640), targetSpeed: 0.88, width: 148 },

    // ── Top-left corner ───────────────────────────────────────────────────
    { position: new Vector2(560,   430), targetSpeed: 0.62, width: 138 },
    { position: new Vector2(730,   265), targetSpeed: 0.52, width: 128 },
    { position: new Vector2(960,   200), targetSpeed: 0.58, width: 128 },

    // ── Top straight (going east) ─────────────────────────────────────────
    { position: new Vector2(1280,  200), targetSpeed: 1.0,  width: 150 },
    { position: new Vector2(1630,  200), targetSpeed: 1.0,  width: 150 },
    { position: new Vector2(1980,  200), targetSpeed: 1.0,  width: 150 },
    { position: new Vector2(2220,  248), targetSpeed: 0.88, width: 145 },

    // ── Top-right corner ──────────────────────────────────────────────────
    { position: new Vector2(2460,  340), targetSpeed: 0.70, width: 138 },
    { position: new Vector2(2630,  456), targetSpeed: 0.78, width: 142 },
    // P0 follows: (2700, 500)
  ],
};
