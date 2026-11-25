import { promises as fs } from 'fs';
import path from 'path';
import type { HouseholdPlant, HouseholdProfile, LocationInfo } from '@/types';

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
  updatedAt: string;
}

interface LocalStoreSchema {
  users: StoredUserRecord[];
  refreshTokens: StoredRefreshTokenRecord[];
  userData: Record<string, UserPersistedData>;
}

const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'users-store.json');

async function readStore(): Promise<LocalStoreSchema> {
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<LocalStoreSchema>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      refreshTokens: Array.isArray(parsed.refreshTokens) ? parsed.refreshTokens : [],
      userData: parsed.userData && typeof parsed.userData === 'object' ? parsed.userData : {},
    };
  } catch {
    return { users: [], refreshTokens: [], userData: {} };
  }
}

async function writeStore(store: LocalStoreSchema): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

export async function findUserByEmail(email: string): Promise<StoredUserRecord | null> {
  const store = await readStore();
  const normalized = email.trim().toLowerCase();
  return store.users.find((u) => u.email.toLowerCase() === normalized) ?? null;
}

export async function findUserById(id: string): Promise<StoredUserRecord | null> {
  const store = await readStore();
  return store.users.find((u) => u.id === id) ?? null;
}

export async function createUser(user: StoredUserRecord): Promise<StoredUserRecord> {
  const store = await readStore();
  store.users.push(user);
  await writeStore(store);
  return user;
}

export async function saveRefreshToken(record: StoredRefreshTokenRecord): Promise<void> {
  const store = await readStore();
  const now = Date.now();
  // Prune expired tokens while saving
  store.refreshTokens = store.refreshTokens.filter((t) => t.expiresAt > now);
  store.refreshTokens.push(record);
  await writeStore(store);
}

export async function findRefreshToken(jti: string): Promise<StoredRefreshTokenRecord | null> {
  const store = await readStore();
  const token = store.refreshTokens.find((t) => t.jti === jti);
  if (!token || token.expiresAt <= Date.now()) return null;
  return token;
}

export async function revokeRefreshToken(jti: string): Promise<void> {
  const store = await readStore();
  store.refreshTokens = store.refreshTokens.filter((t) => t.jti !== jti);
  await writeStore(store);
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  const store = await readStore();
  store.refreshTokens = store.refreshTokens.filter((t) => t.userId !== userId);
  await writeStore(store);
}

export async function getUserPersistedData(userId: string): Promise<UserPersistedData> {
  const store = await readStore();
  return (
    store.userData[userId] ?? {
      householdProfile: null,
      plants: [],
      location: null,
      updatedAt: new Date().toISOString(),
    }
  );
}

export async function saveUserPersistedData(
  userId: string,
  partial: Partial<UserPersistedData>
): Promise<UserPersistedData> {
  const store = await readStore();
  const existing = store.userData[userId] ?? {
    householdProfile: null,
    plants: [],
    location: null,
    updatedAt: new Date().toISOString(),
  };

  const updated: UserPersistedData = {
    householdProfile:
      partial.householdProfile !== undefined
        ? partial.householdProfile
        : existing.householdProfile,
    plants: partial.plants !== undefined ? partial.plants : existing.plants,
    location: partial.location !== undefined ? partial.location : existing.location,
    updatedAt: new Date().toISOString(),
  };

  store.userData[userId] = updated;
  await writeStore(store);
  return updated;
}

export async function deleteUserAccountAndData(userId: string): Promise<void> {
  const store = await readStore();
  store.users = store.users.filter((u) => u.id !== userId);
  store.refreshTokens = store.refreshTokens.filter((t) => t.userId !== userId);
  delete store.userData[userId];
  await writeStore(store);
}
