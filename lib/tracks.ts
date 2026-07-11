import type { Stage } from "@/lib/generated/prisma/enums";

export type TrackStatus = "Completed" | "In Progress" | "Growing" | "Upcoming";

/**
 * The dashboard's four growth tracks map to stages of the universal
 * Planted→Sent pathway, not to any specific course — any enrolled course's
 * Module tagged with the matching Stage counts toward the track. This is
 * what lets a brand-new program (e.g. "School of Prayer") contribute to a
 * student's "Prayer" track without any code change.
 */
export const TRACK_STAGE: Record<string, Stage> = {
  Identity: "PLANTED",
  Prayer: "ROOTED",
  "Character Formation": "FORMED",
  "Kingdom Assignment": "FRUITFUL",
};

export function deriveTrackStatus(
  hasModule: boolean,
  completedLessons: number,
  totalLessons: number
): TrackStatus {
  if (!hasModule || totalLessons === 0) return "Upcoming";
  if (completedLessons === 0) return "Growing";
  if (completedLessons < totalLessons) return "In Progress";
  return "Completed";
}
