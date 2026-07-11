/**
 * Curated, hand-picked photography (Unsplash) — a stand-in for KTC's own
 * R2-hosted media library. Swap any of these for a real photo's public URL
 * once uploaded; nothing else in the UI needs to change.
 */
export const PHOTOGRAPHY = {
  plantedAndRooted:
    "https://images.unsplash.com/photo-1712342109846-a8fcb1c883ba?w=1600&q=80&auto=format&fit=crop",
  youngAndYielded:
    "https://images.unsplash.com/photo-1691491071054-6371dfc47d6e?w=1600&q=80&auto=format&fit=crop",
  kingdomWarriorWoman:
    "https://plus.unsplash.com/premium_photo-1706026427244-3b3df84382d8?w=1600&q=80&auto=format&fit=crop",
  kingdomLeaders:
    "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=1600&q=80&auto=format&fit=crop",
  community:
    "https://plus.unsplash.com/premium_photo-1770544880707-f293de8c28fa?w=1600&q=80&auto=format&fit=crop",
  worship:
    "https://images.unsplash.com/photo-1776091104217-02e3732a4a81?w=1600&q=80&auto=format&fit=crop",
} as const;

export const PROGRAM_PHOTO: Record<string, string> = {
  PLANTED_AND_ROOTED: PHOTOGRAPHY.plantedAndRooted,
  YOUNG_AND_YIELDED: PHOTOGRAPHY.youngAndYielded,
  KINGDOM_WARRIOR_WOMAN: PHOTOGRAPHY.kingdomWarriorWoman,
  KINGDOM_LEADERS: PHOTOGRAPHY.kingdomLeaders,
};
