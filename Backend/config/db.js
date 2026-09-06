import pg from 'pg';
import {env} from './env.js';

const {Pool} = pg;

if (!env.databaseUrl) {
  console.log('Database URL is not defined in the environment variables. Add Your Neon connection string to the .env file as DATABASE_URL');
}

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
});

export function query(text, params) {
  return pool.query(text, params);
}

pool.on('error', (err) => {
  console.error('Postgres Pool error', err.message);
  process.exit(-1);
});