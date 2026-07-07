import { z } from 'zod';

// ── Academic role literals (text + z.enum; no pgEnum) ────────────────────────
export const ACADEMIC_ROLES = ['student', 'educator', 'staff'] as const;
export type AcademicRole = (typeof ACADEMIC_ROLES)[number];

// ── GET /profile (self) ───────────────────────────────────────────────────────
export const ProfileResponseSchema = z.object({
  userId: z.string(),
  displayName: z.string().nullable(),
  username: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  accentColor: z.string().nullable(),
  pronouns: z.string().nullable(),
  bio: z.string().nullable(),
  institution: z.string().nullable(),
  program: z.string().nullable(),
  academicRole: z.enum(ACADEMIC_ROLES).nullable(),
  academicYear: z.string().nullable(),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

// ── PATCH /profile ────────────────────────────────────────────────────────────
export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  username: z
    .string()
    .regex(
      /^[a-z0-9_]{3,20}$/,
      'Username must be 3-20 characters: lowercase letters, numbers, underscores only',
    )
    .optional(),
  accentColor: z.string().optional(),
  pronouns: z.string().max(40).optional(),
  bio: z.string().max(500).optional(),
  institution: z.string().max(120).optional(),
  program: z.string().max(120).optional(),
  academicRole: z.preprocess(
    (v) => (v === '' ? null : v),
    z.enum(ACADEMIC_ROLES).nullable().optional(),
  ),
  academicYear: z.string().max(40).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// ── Avatar presign ────────────────────────────────────────────────────────────
export const AvatarPresignResponseSchema = z.object({
  uploadUrl: z.string(),
  key: z.string(),
});

export type AvatarPresignResponse = z.infer<typeof AvatarPresignResponseSchema>;

// ── Public profile (cross-server safe-field allowlist; NEVER email) ───────────
export const PublicProfileSchema = z.object({
  userId: z.string(),
  username: z.string().nullable(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  accentColor: z.string().nullable(),
  pronouns: z.string().nullable(),
  bio: z.string().nullable(),
  institution: z.string().nullable(),
  program: z.string().nullable(),
  academicRole: z.enum(ACADEMIC_ROLES).nullable(),
  academicYear: z.string().nullable(),
});

export type PublicProfile = z.infer<typeof PublicProfileSchema>;
