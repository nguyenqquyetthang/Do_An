import 'dotenv/config';
import { app } from './app.js';
import { config } from './config/env.js';
import { closeDatabaseConnection } from './db.js';

const server = app.listen(config.port, () => {
  console.log(`LuckyDraw API listening on http://localhost:${config.port}`);
});

async function shutdown() {
  server.close();
  await closeDatabaseConnection();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
