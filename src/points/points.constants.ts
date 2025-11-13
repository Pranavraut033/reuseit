// src/points/points.constants.ts

/**
 * Points awarded for each user action.
 * Update these values as needed for gamification tuning.
 */
export const POINTS_RULES = {
  CREATE_POST: 10, // User creates a post: +10 points
  COMMENT_POST: 3, // User comments on a post: +3 points
  JOIN_EVENT: 5, // User joins an event: +5 points
  COMPLETE_EVENT: 15, // User completes an event: +15 points
  SCAN_ITEM: 2, // User scans an item: +2 points
  // Add more actions as needed
};
