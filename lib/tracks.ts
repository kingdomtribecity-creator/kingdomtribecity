export type TrackStatus = "Completed" | "In Progress" | "Growing" | "Upcoming";

export const TRACK_COURSE_SLUG: Record<string, string> = {
  Identity: "planted-identity-foundations",
  Prayer: "rooted-life-with-god",
  "Character Formation": "formed-the-renewed-mind",
  "Kingdom Assignment": "", // no course yet — see ROADMAP.md
};

export function deriveTrackStatus(
  enrollment: { status: string } | undefined,
  completedLessons: number,
  totalLessons: number
): TrackStatus {
  if (!enrollment) return "Upcoming";
  if (enrollment.status === "COMPLETED") return "Completed";
  if (completedLessons === 0) return "Growing";
  if (completedLessons < totalLessons) return "In Progress";
  return "Completed";
}
