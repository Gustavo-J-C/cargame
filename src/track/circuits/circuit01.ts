import { TrackDefinition } from '../TrackData';
import { Vector2 } from '../../utils/math';
import { TRACK_COLORS } from '../../utils/colors';

// Clean stadium oval — no self-intersections.
// Sections are grouped and spaced so no two non-adjacent sections come within
// one track width of each other.
//
// Layout (clockwise in screen coords):
//
//        ╭──── top straight ────╮
//       /                        \
//  left │                        │ right straight
//       \                        /
//        ╰── bottom straight ───╯
//
// Right straight:  x≈1040, y 215–555
// Top straight:    y≈88,   x 880–310
// Left straight:   x≈150,  y 240–445
// Bottom straight: y≈625,  x 360–800
// All four corners are well-separated arcs.

const W = 1280, H = 720;

export const circuit01: TrackDefinition = {
  name: 'Circuito Ensolarado',
  startFinishIndex: 0,
  backgroundColor: TRACK_COLORS.grass,
  roadColor: TRACK_COLORS.road,
  controlPoints: [
    // ── Right straight (going north) ──────────────────────────────────
    { position: new Vector2(W * 0.813, H * 0.771), targetSpeed: 1.0, width: 80 }, // P0 start line
    { position: new Vector2(W * 0.813, H * 0.639), targetSpeed: 1.0, width: 80 },
    { position: new Vector2(W * 0.813, H * 0.486), targetSpeed: 1.0, width: 80 },
    { position: new Vector2(W * 0.813, H * 0.340), targetSpeed: 1.0, width: 80 },
    { position: new Vector2(W * 0.813, H * 0.215), targetSpeed: 0.90, width: 80 },

    // ── Top-right corner (sweeps left, arc stays above y=170) ─────────
    { position: new Vector2(W * 0.836, H * 0.163), targetSpeed: 0.70, width: 78 },
    { position: new Vector2(W * 0.836, H * 0.125), targetSpeed: 0.58, width: 76 },
    { position: new Vector2(W * 0.797, H * 0.097), targetSpeed: 0.55, width: 76 },
    { position: new Vector2(W * 0.734, H * 0.090), targetSpeed: 0.60, width: 77 },

    // ── Top straight (going west, y≈88–100) ──────────────────────────
    { position: new Vector2(W * 0.641, H * 0.122), targetSpeed: 1.0, width: 80 },
    { position: new Vector2(W * 0.500, H * 0.122), targetSpeed: 1.0, width: 80 },
    { position: new Vector2(W * 0.344, H * 0.122), targetSpeed: 1.0, width: 80 },
    { position: new Vector2(W * 0.250, H * 0.125), targetSpeed: 0.90, width: 80 },

    // ── Top-left corner (sweeps down, arc stays left of x=185) ───────
    { position: new Vector2(W * 0.172, H * 0.153), targetSpeed: 0.68, width: 78 },
    { position: new Vector2(W * 0.133, H * 0.208), targetSpeed: 0.55, width: 76 },
    { position: new Vector2(W * 0.125, H * 0.278), targetSpeed: 0.58, width: 76 },

    // ── Left straight (going south, x≈160) ───────────────────────────
    { position: new Vector2(W * 0.125, H * 0.375), targetSpeed: 1.0, width: 80 },
    { position: new Vector2(W * 0.125, H * 0.500), targetSpeed: 1.0, width: 80 },
    { position: new Vector2(W * 0.125, H * 0.618), targetSpeed: 0.90, width: 80 },

    // ── Bottom-left corner (sweeps right, arc stays below y=580) ─────
    { position: new Vector2(W * 0.148, H * 0.701), targetSpeed: 0.65, width: 78 },
    { position: new Vector2(W * 0.203, H * 0.757), targetSpeed: 0.55, width: 76 },
    { position: new Vector2(W * 0.281, H * 0.785), targetSpeed: 0.52, width: 76 },
    { position: new Vector2(W * 0.375, H * 0.785), targetSpeed: 0.60, width: 77 },

    // ── Bottom straight (going east, y≈565) ──────────────────────────
    { position: new Vector2(W * 0.484, H * 0.771), targetSpeed: 0.95, width: 80 },
    { position: new Vector2(W * 0.594, H * 0.771), targetSpeed: 1.0,  width: 80 },
    { position: new Vector2(W * 0.703, H * 0.771), targetSpeed: 0.95, width: 80 },

    // ── Bottom-right corner (sweeps north, arc stays right of x=900) ─
    // This arc connects smoothly into P0 — no separate straight needed.
    { position: new Vector2(W * 0.766, H * 0.771), targetSpeed: 0.80, width: 78 },
  ],
};
