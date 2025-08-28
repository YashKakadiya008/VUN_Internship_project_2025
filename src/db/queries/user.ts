// db/queries/user.ts
import { db } from '@/db';
import { users } from '@/db/schema';
import type { User } from '@/db/index';
import { eq } from 'drizzle-orm';

export async function findOneByUsername(username: string) {
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0] || null;
}

export async function updateToken(userId: string, token: string | null) {
  return db
    .update(users)
    .set({ token })
    .where(eq(users.id, userId));
}


export async function findOneById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}
export async function createUser(data: User) {
  const [user] = await db.insert(users).values(data).returning();
  return user ?? null;
}

