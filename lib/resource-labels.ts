import type { ResourceCategory, ResourceType } from "@/lib/generated/prisma/enums";

export const CATEGORY_LABEL: Record<ResourceCategory, string> = {
  IDENTITY: "Identity",
  PRAYER: "Prayer",
  LEADERSHIP: "Leadership",
  PURPOSE: "Purpose",
  RELATIONSHIPS: "Relationships",
  SPIRITUAL_GROWTH: "Spiritual Growth",
};

export const TYPE_LABEL: Record<ResourceType, string> = {
  TEACHING: "Teaching",
  SERMON: "Sermon",
  ARTICLE: "Article",
  STUDY: "Study",
  DEVOTIONAL: "Devotional",
};
