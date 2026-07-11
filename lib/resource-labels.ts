import type {
  ResourceCategory,
  ResourceType,
  ResourceVisibility,
  Role,
} from "@/lib/generated/prisma/enums";

export const CATEGORY_LABEL: Record<ResourceCategory, string> = {
  IDENTITY: "Identity",
  PRAYER: "Prayer",
  LEADERSHIP: "Leadership",
  PURPOSE: "Purpose",
  RELATIONSHIPS: "Relationships",
  SPIRITUAL_GROWTH: "Spiritual Growth",
};

export const TYPE_LABEL: Record<ResourceType, string> = {
  VIDEO: "Video",
  AUDIO: "Audio",
  SERMON: "Sermon",
  PDF: "PDF",
  EBOOK: "E-book",
  DOCUMENT: "Document",
  STUDY: "Study",
  WORKBOOK: "Workbook",
  DEVOTIONAL: "Devotional",
  ARTICLE: "Article",
  EXTERNAL_LINK: "External Link",
  YOUTUBE: "YouTube",
  EVENT_RECORDING: "Event Recording",
  LIVE_REPLAY: "Live Replay",
  IMAGE: "Image",
  TEACHING_NOTE: "Teaching Notes",
};

/** Types with no uploaded file — the "file" is just a link. */
export const LINK_ONLY_TYPES: ResourceType[] = ["EXTERNAL_LINK", "YOUTUBE"];

export const VISIBILITY_LABEL: Record<ResourceVisibility, string> = {
  PUBLIC: "Public — anyone",
  MEMBERS: "Members only",
  STUDENTS: "Students only",
  LEADERS: "Mentors & leaders only",
};

const STUDENT_TIER: Role[] = [
  "STUDENT",
  "MENTOR",
  "INSTRUCTOR",
  "MINISTRY_LEADER",
  "ADMIN",
  "SUPER_ADMIN",
];
const LEADER_TIER: Role[] = ["MENTOR", "INSTRUCTOR", "MINISTRY_LEADER", "ADMIN", "SUPER_ADMIN"];

export function canViewResource(visibility: ResourceVisibility, role: Role | null): boolean {
  if (visibility === "PUBLIC") return true;
  if (!role || role === "GUEST") return false;
  if (visibility === "MEMBERS") return true;
  if (visibility === "STUDENTS") return STUDENT_TIER.includes(role);
  if (visibility === "LEADERS") return LEADER_TIER.includes(role);
  return false;
}
