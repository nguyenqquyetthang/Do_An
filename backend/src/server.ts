import 'dotenv/config';
import { app, syncProgramStatuses } from './app.js';
import { config } from './config/env.js';
import { closeDatabaseConnection } from './db.js';

// Chạy đồng bộ ngay khi khởi động server
void syncProgramStatuses();

// Chạy nền định kỳ mỗi 5 giây để tự động chuyển trạng thái chương trình và giải phóng vé giữ quá hạn
const syncInterval = setInterval(() => {
  void syncProgramStatuses();
}, 5000);

const server = app.listen(config.port, () => {
  console.log(`LuckyDraw API listening on http://localhost:${config.port}`);
});

async function shutdown() {
  clearInterval(syncInterval);
  server.close();
  await closeDatabaseConnection();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
