import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not configured. Create a .env file from .env.example.',
  );
}

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export async function checkDatabaseConnection(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  await pool.end();
}
