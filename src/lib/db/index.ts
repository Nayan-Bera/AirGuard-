// PostgreSQL is the source of truth for server-side account and profile data.
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@/db/schema';
import { appConfig } from '@/lib/config/env';

// pg does not bundle TypeScript declarations; @types/pg is not required at runtime.
type PostgresPool = ReturnType<typeof drizzle<typeof schema>>['$client'];
const { Pool } = require('pg') as {
  Pool: new (config: { connectionString: string }) => PostgresPool;
};

let pool: PostgresPool | undefined;
let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDatabase() {
  if (!appConfig.db.databaseUrl) {
    throw new Error('DATABASE_URL is required for server-side data storage.');
  }
  if (!pool) {
    pool = new Pool({ connectionString: appConfig.db.databaseUrl });
    database = drizzle(pool, { schema });
  }
  return database!;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(appConfig.db.databaseUrl);
}

export { schema };
