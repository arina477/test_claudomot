import { ConflictException, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { users } from '../db/schema/index';
import type { User } from '../db/schema/users';

// Postgres unique-violation error code
const PG_UNIQUE_VIOLATION = '23505';

interface DatabaseError {
  code?: string;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' && err !== null && (err as DatabaseError).code === PG_UNIQUE_VIOLATION
  );
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
    },
  ): Promise<void> {
    const patch: Partial<{
      display_name: string;
      username: string;
      accent_color: string;
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
}
