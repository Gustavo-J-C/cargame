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
  // Difficulty is purely about driving skill — all AIs share the same max speed.
  // steeringLookahead: how far ahead the AI aims (higher = smoother cornering).
  // brakingLookahead:  how far ahead it scans for corners (higher = brakes earlier = carries more speed).
  DIFFICULTIES: {
    easy:   { steeringLookahead: 2, brakingLookahead: 4  },
    medium: { steeringLookahead: 4, brakingLookahead: 9  },
    hard:   { steeringLookahead: 8, brakingLookahead: 16 },
  },
};
