export type Difficulty = 'easy' | 'medium' | 'hard';

export const CONFIG = {
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,
  TOTAL_LAPS: 3,
  AI_COUNT: 3,
  TRACK_SAMPLE_COUNT: 600,
  WAYPOINT_REACH_DIST: 90,
  CAR: {
    MAX_SPEED: 320,
    ACCELERATION: 480,
    BRAKE_FORCE: 650,
    ROLLING_FRICTION: 0.992,
    LATERAL_GRIP: 0.60,
    MAX_STEER_RATE: 2.2,
    RADIUS: 13,
    WIDTH: 26,
    HEIGHT: 15,
  },
  DIFFICULTIES: {
    easy:   { speeds: [0.65, 0.68, 0.62] as [number, number, number], lookahead: 3 },
    medium: { speeds: [0.82, 0.86, 0.78] as [number, number, number], lookahead: 4 },
    hard:   { speeds: [0.93, 0.96, 0.89] as [number, number, number], lookahead: 6 },
  },
};
