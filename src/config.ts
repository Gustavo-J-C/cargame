export type Difficulty = 'easy' | 'medium' | 'hard';

export const CONFIG = {
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,
  TOTAL_LAPS: 3,
  AI_COUNT: 3,
  TRACK_SAMPLE_COUNT: 600,
  WAYPOINT_REACH_DIST: 100,
  CAR: {
    MAX_SPEED: 440,      // px/s — higher for snappier arcade feel
    ACCELERATION: 660,
    BRAKE_FORCE: 950,
    ROLLING_FRICTION: 0.992,
    LATERAL_GRIP: 0.60,
    MAX_STEER_RATE: 2.2,
    RADIUS: 13,
    WIDTH: 26,
    HEIGHT: 15,
  },
  // AI speed factors relative to player MAX_SPEED.
  // Hard AIs match the player exactly so the race feels genuinely competitive.
  DIFFICULTIES: {
    easy:   { speeds: [0.72, 0.76, 0.68] as [number, number, number], lookahead: 3 },
    medium: { speeds: [0.90, 0.94, 0.86] as [number, number, number], lookahead: 4 },
    hard:   { speeds: [1.00, 1.00, 0.97] as [number, number, number], lookahead: 6 },
  },
};
