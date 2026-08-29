export const LEADERBOARD_CHANNEL = "leaderboard";
export const LEADERBOARD_EVENT = "score_update";

export const GAME_SETTINGS_CHANNEL = "game_settings";
export const GAME_SETTINGS_EVENT = "status_changed";

/**
 * Fired whenever the room moves to a new phase or card. Like the others this is
 * only a "go refetch" nudge — the payload is never the source of truth, so a
 * client that misses the broadcast still converges on its next poll.
 */
export const GAME_STATE_CHANNEL = "game_state";
export const GAME_STATE_EVENT = "position_changed";
