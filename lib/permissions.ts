import type { Role } from "@/lib/generated/prisma/enums";

/**
 * Canonical permission catalog. This is the code-defined set of things the
 * platform knows how to gate — but which *roles* grant which permissions is
 * data (`RolePermission`, editable at /admin/settings/roles), not code, so
 * new role/permission combinations don't require a deploy.
 */
export const PERMISSIONS = {
  CONTENT_MANAGE: "content.manage",
  MEDIA_UPLOAD: "media.upload",
  USERS_MANAGE: "users.manage",
  EVENTS_MANAGE: "events.manage",
  COHORTS_MANAGE: "cohorts.manage",
  ANNOUNCEMENTS_MANAGE: "announcements.manage",
  ANALYTICS_VIEW: "analytics.view",
  ROLES_MANAGE: "roles.manage",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_CATALOG: {
  key: PermissionKey;
  label: string;
  category: string;
}[] = [
  { key: PERMISSIONS.CONTENT_MANAGE, label: "Create & edit courses, lessons, resources", category: "Content" },
  { key: PERMISSIONS.MEDIA_UPLOAD, label: "Upload media (video, audio, documents)", category: "Content" },
  { key: PERMISSIONS.EVENTS_MANAGE, label: "Create & edit events", category: "Content" },
  { key: PERMISSIONS.ANNOUNCEMENTS_MANAGE, label: "Post platform announcements", category: "Content" },
  { key: PERMISSIONS.COHORTS_MANAGE, label: "Manage cohorts, tribes & mentors", category: "Community" },
  { key: PERMISSIONS.USERS_MANAGE, label: "Manage user accounts & roles", category: "Platform" },
  { key: PERMISSIONS.ROLES_MANAGE, label: "Manage roles & permissions", category: "Platform" },
  { key: PERMISSIONS.ANALYTICS_VIEW, label: "View platform analytics", category: "Platform" },
];

/** Default role → permission grid, seeded on first migration. Editable after that. */
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS), // also bypasses checks entirely, see lib/rbac.ts
  ADMIN: [
    PERMISSIONS.CONTENT_MANAGE,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.EVENTS_MANAGE,
    PERMISSIONS.COHORTS_MANAGE,
    PERMISSIONS.ANNOUNCEMENTS_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  MINISTRY_LEADER: [
    PERMISSIONS.CONTENT_MANAGE,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.EVENTS_MANAGE,
    PERMISSIONS.COHORTS_MANAGE,
    PERMISSIONS.ANNOUNCEMENTS_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  INSTRUCTOR: [PERMISSIONS.CONTENT_MANAGE, PERMISSIONS.MEDIA_UPLOAD],
  MENTOR: [],
  STUDENT: [],
  MEMBER: [],
  GUEST: [],
};

/** Roles allowed into /admin at all — each page/query then scopes further. */
export const ADMIN_AREA_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "MINISTRY_LEADER", "INSTRUCTOR"];

export const ROLE_ORDER: Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MINISTRY_LEADER",
  "INSTRUCTOR",
  "MENTOR",
  "STUDENT",
  "MEMBER",
  "GUEST",
];

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Super Administrator",
  ADMIN: "Administrator",
  MINISTRY_LEADER: "Ministry Leader",
  INSTRUCTOR: "Instructor",
  MENTOR: "Mentor",
  STUDENT: "Student",
  MEMBER: "Member",
  GUEST: "Guest",
};
