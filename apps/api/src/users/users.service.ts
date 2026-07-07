import { ConflictException, Injectable } from '@nestjs/common';
import type { AcademicRole } from '@studyhall/shared';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { users } from '../db/schema/index';
import type { User } from '../db/schema/users';

// Postgres unique-violation error code
const PG_UNIQUE_VIOLATION = '23505';

interface DatabaseError {
  code?: string;
  cause?: unknown;
}

/**
 * Walk up to two levels of `.cause` to find the Postgres error code.
 *
 * drizzle-orm wraps PG driver errors inside `DrizzleQueryError`, so the
 * real `code: '23505'` lives at `err.cause.code`, not `err.code`.
 * We also check `err.cause.cause.code` in case future driver or ORM
 * versions add an extra wrapping layer.
 */
function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as DatabaseError;
  if (e.code === PG_UNIQUE_VIOLATION) return true;
  // One level deep (DrizzleQueryError → PG error)
  if (typeof e.cause === 'object' && e.cause !== null) {
    const cause1 = e.cause as DatabaseError;
    if (cause1.code === PG_UNIQUE_VIOLATION) return true;
    // Two levels deep
    if (typeof cause1.cause === 'object' && cause1.cause !== null) {
      const cause2 = cause1.cause as DatabaseError;
      if (cause2.code === PG_UNIQUE_VIOLATION) return true;
    }
  }
  return false;
}

@Injectable()
export class UsersService {
  async createUserIfNotExists(input: { id: string; email: string }): Promise<void> {
    await db.insert(users).values({ id: input.id, email: input.email }).onConflictDoNothing();
  }

  async findById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  // Kept for backward compatibility — used by existing callers.
  async updateDisplayName(id: string, displayName: string): Promise<void> {
    await db
      .update(users)
      .set({ display_name: displayName, updated_at: new Date() })
      .where(eq(users.id, id));
  }

  async updateProfile(
    id: string,
    fields: {
      displayName?: string | undefined;
      username?: string | undefined;
      accentColor?: string | undefined;
      // wave-77 M13 leg-2 (task 10068f9e): academic-identity fields
      pronouns?: string | undefined;
      bio?: string | undefined;
      institution?: string | undefined;
      program?: string | undefined;
      academicRole?: AcademicRole | undefined;
      academicYear?: string | undefined;
    },
  ): Promise<void> {
    const patch: Partial<{
      display_name: string;
      username: string;
      accent_color: string;
      pronouns: string;
      bio: string;
      institution: string;
      program: string;
      academic_role: string;
      academic_year: string;
      updated_at: Date;
    }> = { updated_at: new Date() };

    if (fields.displayName !== undefined) {
      patch.display_name = fields.displayName;
    }
    if (fields.username !== undefined) {
      // Always store lowercased — the DB unique index on lower(username) also enforces this.
      patch.username = fields.username.toLowerCase();
    }
    if (fields.accentColor !== undefined) {
      patch.accent_color = fields.accentColor;
    }
    // wave-77 M13 leg-2: persist the academic-identity fields (all nullable text
    // columns added by B-0). undefined = untouched (partial PATCH); the Zod schema
    // (UpdateProfileSchema) already bounds every field's length and enum membership.
    if (fields.pronouns !== undefined) {
      patch.pronouns = fields.pronouns;
    }
    if (fields.bio !== undefined) {
      patch.bio = fields.bio;
    }
    if (fields.institution !== undefined) {
      patch.institution = fields.institution;
    }
    if (fields.program !== undefined) {
      patch.program = fields.program;
    }
    if (fields.academicRole !== undefined) {
      patch.academic_role = fields.academicRole;
    }
    if (fields.academicYear !== undefined) {
      patch.academic_year = fields.academicYear;
    }

    try {
      await db.update(users).set(patch).where(eq(users.id, id));
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException('username_taken');
      }
      throw err;
    }
  }

  async setAvatarUrl(id: string, avatarUrl: string): Promise<void> {
    await db
      .update(users)
      .set({ avatar_url: avatarUrl, updated_at: new Date() })
      .where(eq(users.id, id));
  }

  /**
   * Persist avatar_key (S3 object key) and avatar_url (stable app redirect URL)
   * together in a single UPDATE (wave-38, task 84e09891).
   *
   * avatar_url is now a stable app URL (`<PUBLIC_API_URL>/users/:id/avatar?v=<hash>`)
   * rather than a raw static S3 URL — it never expires and consumers need not
   * change; the redirect endpoint handles per-request presigning.
   */
  async setAvatar(id: string, avatarKey: string, avatarUrl: string): Promise<void> {
    await db
      .update(users)
      .set({ avatar_key: avatarKey, avatar_url: avatarUrl, updated_at: new Date() })
      .where(eq(users.id, id));
  }

  /**
   * Look up avatar_key for the given userId — used by GET /users/:userId/avatar
   * to resolve a fresh presigned URL per redirect hit.
   *
   * Returns null when the user has no avatar (avatar_key IS NULL).
   */
  async findAvatarKey(id: string): Promise<string | null> {
    const result = await db
      .select({ avatar_key: users.avatar_key })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0]?.avatar_key ?? null;
  }
}
