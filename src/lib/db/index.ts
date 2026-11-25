// Drizzle ORM + Supabase PostgreSQL client
// Note: Gracefully returns null if Supabase is not configured so local dev works without a live DB.

import { createClient } from '@supabase/supabase-js';
import * as schema from '@/db/schema';
import { appConfig } from '@/lib/config/env';

export function isDatabaseConfigured(): boolean {
  return appConfig.db.isConfigured;
}

export function getSupabaseAdmin() {
  if (!appConfig.db.isConfigured) return null;

  return createClient(appConfig.db.supabaseUrl, appConfig.db.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { schema };
