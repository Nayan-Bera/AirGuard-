import { eq, lt } from 'drizzle-orm';
import type { HouseholdPlant, HouseholdProfile, LocationInfo } from '@/types';
import { getDatabase } from '@/lib/db';
import { appUserData, profiles, refreshTokens } from '@/db/schema';

export interface StoredUserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface StoredRefreshTokenRecord {
  jti: string;
  userId: string;
  expiresAt: number;
}

export interface UserPersistedData {
  householdProfile: HouseholdProfile | null;
  plants: HouseholdPlant[];
  location: LocationInfo | null;
  locations: LocationInfo[];
  updatedAt: string;
}

function toStoredUser(row: typeof profiles.$inferSelect): StoredUserRecord {
  return {
    id: row.id,
    email: row.email ?? '',
    name: row.displayName ?? '',
    passwordHash: row.passwordHash ?? '',
    createdAt: row.createdAt.toISOString(),
  };
}

export async function findUserByEmail(email: string): Promise<StoredUserRecord | null> {
  const [row] = await getDatabase().select().from(profiles)
    .where(eq(profiles.email, email.trim().toLowerCase())).limit(1);
  return row ? toStoredUser(row) : null;
}

export async function findUserById(id: string): Promise<StoredUserRecord | null> {
  const [row] = await getDatabase().select().from(profiles)
    .where(eq(profiles.id, id)).limit(1);
  return row ? toStoredUser(row) : null;
}

export async function createUser(user: StoredUserRecord): Promise<StoredUserRecord> {
  const [row] = await getDatabase().insert(profiles).values({
    id: user.id,
    authId: user.id,
    email: user.email.trim().toLowerCase(),
    displayName: user.name,
    passwordHash: user.passwordHash,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(),
  }).returning();
  return toStoredUser(row);
}

export async function saveRefreshToken(record: StoredRefreshTokenRecord): Promise<void> {
  const db = getDatabase();
  await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, new Date()));
  await db.insert(refreshTokens).values({
    jti: record.jti,
    userId: record.userId,
    expiresAt: new Date(record.expiresAt),
  });
}

export async function findRefreshToken(jti: string): Promise<StoredRefreshTokenRecord | null> {
  const [row] = await getDatabase().select().from(refreshTokens)
    .where(eq(refreshTokens.jti, jti)).limit(1);
  if (!row || row.expiresAt.getTime() <= Date.now()) return null;
  return { jti: row.jti, userId: row.userId, expiresAt: row.expiresAt.getTime() };
}

export async function revokeRefreshToken(jti: string): Promise<void> {
  await getDatabase().delete(refreshTokens).where(eq(refreshTokens.jti, jti));
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await getDatabase().delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}

const emptyUserData = (): UserPersistedData => ({
  householdProfile: null,
  plants: [],
  location: null,
  locations: [],
  updatedAt: new Date().toISOString(),
});

export async function getUserPersistedData(userId: string): Promise<UserPersistedData> {
  const [row] = await getDatabase().select().from(appUserData)
    .where(eq(appUserData.userId, userId)).limit(1);
  return row ? { ...emptyUserData(), ...(row.data as Partial<UserPersistedData>), updatedAt: row.updatedAt.toISOString() } : emptyUserData();
}

export async function saveUserPersistedData(
  userId: string,
  partial: Partial<UserPersistedData>
): Promise<UserPersistedData> {
  const db = getDatabase();
  const [existingRow] = await db.select().from(appUserData)
    .where(eq(appUserData.userId, userId)).limit(1);
  const existing = existingRow
    ? { ...emptyUserData(), ...(existingRow.data as Partial<UserPersistedData>), updatedAt: existingRow.updatedAt.toISOString() }
    : emptyUserData();
  const updated: UserPersistedData = { ...existing, ...partial, updatedAt: new Date().toISOString() };
  const jsonData = updated as unknown as Record<string, unknown>;
  await db.insert(appUserData).values({ userId, data: jsonData, updatedAt: new Date(updated.updatedAt) })
    .onConflictDoUpdate({
      target: appUserData.userId,
      set: { data: jsonData, updatedAt: new Date(updated.updatedAt) },
    });
  return updated;
}

export async function deleteUserAccountAndData(userId: string): Promise<void> {
  await getDatabase().delete(profiles).where(eq(profiles.id, userId));
}
