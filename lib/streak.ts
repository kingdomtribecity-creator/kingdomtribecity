function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Consecutive-day engagement streak, computed from raw activity timestamps
 * rather than stored as a counter so it can never drift out of sync.
 * Counts back from today (or yesterday, so a streak survives until end-of-day).
 */
export function computeStreak(activityDates: Date[]): number {
  if (activityDates.length === 0) return 0;

  const days = new Set(activityDates.map(toDateKey));
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const cursor = new Date(today);
  if (!days.has(toDateKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!days.has(toDateKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
