import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { users } from '../db/schema/index';
import type { User } from '../db/schema/users';

@Injectable()
export class UsersService {
  async createUserIfNotExists(input: { id: string; email: string }): Promise<void> {
    await db.insert(users).values({ id: input.id, email: input.email }).onConflictDoNothing();
  }

  async findById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
}
