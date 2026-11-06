import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { z } from 'zod';
import { pool } from './db.js';
import * as authController from './controllers/auth.controller.js';
import { config } from './config/env.js';
import {
  asyncRoute,
  requireAdmin,
  requireAuth,
  requireProgramManager,
} from './middleware/auth.js';
import type { AuthenticatedRequest } from './types/http.js';

const app = express();
const allowedOrigins = new Set([
  config.frontendOrigin,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
]);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin không được phép: ${origin}`));
  },
}));
app.use(express.json({ limit: '1mb' }));
const uploadDirectory = path.resolve('backend/uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });
const mediaUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_request, file, callback) => {
      callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const allowed = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
    if (!allowed) {
      callback(new Error('Chỉ hỗ trợ file ảnh hoặc video.'));
      return;
    }
    callback(null, true);
  },
});
app.use('/uploads', express.static(uploadDirectory));

app.get('/', (_request, response) => {
  response.redirect(`${config.frontendOrigin}/dang-nhap`);
});

const organizerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(128),
  fullName: z.string().trim().min(2).max(150),
  username: z.string().trim().min(3).max(50).regex(
    /^[A-Za-z0-9_.-]+$/,
    'Tên đăng nhập chỉ được chứa chữ không dấu, số, dấu gạch dưới (_), dấu chấm (.) hoặc dấu gạch ngang (-).',
  ),
});

const programSchema = z.object({
  programCode: z.string().trim().min(1).max(50),
  programName: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  rules: z.string().max(10000).optional(),
  ticketPrice: z.number().nonnegative(),
  totalTickets: z.number().int().positive(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  drawTime: z.string().datetime().optional(),
  status: z.enum([
    'draft', 'pending_review', 'rejected', 'upcoming', 'active', 'ended',
    'published', 'closed', 'drawing', 'completed', 'cancelled',
  ]).optional(),
});

app.get('/api/health', asyncRoute(async (_request, response) => {
  await pool.query('SELECT 1');
  response.json({ status: 'ok', database: 'connected' });
}));

app.post('/api/organizer/media', requireAuth, requireProgramManager, (request, response, next) => {
  mediaUpload.single('file')(request, response, (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      response.status(413).json({ error: 'File quá lớn. Ảnh tối đa 10MB và video tối đa 100MB.' });
      return;
    }
    if (error instanceof Error) {
      response.status(400).json({ error: error.message });
      return;
    }
    next();
  });
}, (request, response) => {
  if (!request.file) {
    response.status(400).json({ error: 'Vui lòng chọn một file ảnh hoặc video.' });
    return;
  }
  const isImage = request.file.mimetype.startsWith('image/');
  if (isImage && request.file.size > 10 * 1024 * 1024) {
    fs.unlinkSync(request.file.path);
    response.status(413).json({ error: 'Ảnh quá lớn. Kích thước tối đa là 10MB.' });
    return;
  }
  response.status(201).json({
    url: `/uploads/${request.file.filename}`,
    type: isImage ? 'image' : 'video',
  });
});

app.post('/api/auth/register', asyncRoute(authController.register));
app.post('/api/auth/login', asyncRoute(authController.login));
app.get('/api/auth/me', requireAuth, asyncRoute(authController.me));

let isSyncing = false;
export async function syncProgramStatuses() {
  if (isSyncing) return;
  isSyncing = true;
  try {
    // Tự động chuyển 'upcoming' / 'published' sang 'active' khi start_time <= CURRENT_TIMESTAMP
    // Sử dụng câu lệnh UPDATE nguyên tử của PostgreSQL (Row-level lock) để tránh race condition
    await pool.query(`
      UPDATE lottery_programs
      SET status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE status IN ('upcoming', 'published')
        AND start_time IS NOT NULL
        AND start_time <= CURRENT_TIMESTAMP
        AND (end_time IS NULL OR end_time > CURRENT_TIMESTAMP);
    `);

    // Tự động chuyển sang 'ended' khi end_time <= CURRENT_TIMESTAMP
    await pool.query(`
      UPDATE lottery_programs
      SET status = 'ended', updated_at = CURRENT_TIMESTAMP
      WHERE status IN ('active', 'upcoming', 'published')
        AND end_time IS NOT NULL
        AND end_time <= CURRENT_TIMESTAMP;
    `);

    // Tự động giải phóng các vé giữ quá hạn mà chưa thanh toán
    await pool.query(`
      UPDATE lottery_tickets
      SET status = 'available', held_by = NULL, held_until = NULL
      WHERE status = 'held'
        AND held_until IS NOT NULL
        AND held_until <= CURRENT_TIMESTAMP;
    `);
  } catch (error) {
    console.error('Lỗi khi đồng bộ trạng thái chương trình:', error);
  } finally {
    isSyncing = false;
  }
}

app.get('/api/programs', asyncRoute(async (_request, response) => {
  await syncProgramStatuses();
  const result = await pool.query(
    `SELECT p.*,
            COALESCE(SUM(CASE WHEN t.status IN ('held', 'sold') THEN 1 ELSE 0 END), 0)::int AS reserved_tickets,
            COALESCE((SELECT MAX(pr.estimated_value) FROM prizes pr WHERE pr.program_id = p.program_id), 0)::numeric AS prize_value
     FROM lottery_programs p
     LEFT JOIN lottery_tickets t ON t.program_id = p.program_id
     WHERE p.status IN ('upcoming', 'active', 'ended', 'published', 'closed', 'completed')
     GROUP BY p.program_id
     ORDER BY p.created_at DESC`,
  );
  response.json(result.rows);
}));

app.get('/api/programs/:programId', asyncRoute(async (request, response) => {
  await syncProgramStatuses();
  const result = await pool.query(
    `SELECT p.*, COALESCE(jsonb_agg(to_jsonb(pr) - 'program_id') FILTER (WHERE pr.prize_id IS NOT NULL), '[]') AS prizes
     FROM lottery_programs p
     LEFT JOIN prizes pr ON pr.program_id = p.program_id
     WHERE (
       p.program_id::text = $1
       OR LPAD(p.program_id::text, 3, '0') = $1
       OR p.program_code = $1
     )
       AND p.status IN ('upcoming', 'active', 'ended', 'published', 'closed', 'completed')
     GROUP BY p.program_id`,
    [request.params.programId],
  );
  if (!result.rows[0]) {
    response.status(404).json({ error: 'Không tìm thấy chương trình.' });
    return;
  }
  response.json(result.rows[0]);
}));

app.get('/api/programs/:programId/tickets', asyncRoute(async (request, response) => {
  const result = await pool.query(
    `SELECT ticket_id, ticket_number, price, status, held_until
     FROM lottery_tickets
     WHERE program_id IN (
       SELECT p.program_id FROM lottery_programs p
       WHERE p.program_id::text = $1
          OR LPAD(p.program_id::text, 3, '0') = $1
          OR p.program_code = $1
     )
     ORDER BY ticket_number`,
    [request.params.programId],
  );
  response.json(result.rows);
}));

app.post('/api/programs/:programId/hold', requireAuth, asyncRoute(async (request, response) => {
  const numbersSchema = z.object({ ticketNumbers: z.array(z.string().min(1).max(30)).min(1).max(10) });
  const { ticketNumbers } = numbersSchema.parse(request.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Khóa dòng chương trình bằng FOR UPDATE để kiểm tra trạng thái nguyên tử, chống race condition
    const programResult = await client.query(
      `SELECT program_id, status, start_time, end_time FROM lottery_programs
       WHERE program_id = $1 FOR UPDATE`,
      [request.params.programId],
    );
    const prog = programResult.rows[0];
    if (!prog) {
      await client.query('ROLLBACK');
      response.status(404).json({ error: 'Không tìm thấy chương trình.' });
      return;
    }

    const now = new Date();
    // Tự động kích hoạt sang active nếu đã đến giờ mở bán
    if (['upcoming', 'published'].includes(prog.status) && prog.start_time && new Date(prog.start_time) <= now) {
      if (!prog.end_time || new Date(prog.end_time) > now) {
        prog.status = 'active';
        await client.query(
          `UPDATE lottery_programs SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE program_id = $1`,
          [prog.program_id],
        );
      }
    }
    // Chuyển sang ended nếu đã quá thời gian kết thúc
    if (prog.status === 'active' && prog.end_time && new Date(prog.end_time) <= now) {
      prog.status = 'ended';
      await client.query(
        `UPDATE lottery_programs SET status = 'ended', updated_at = CURRENT_TIMESTAMP WHERE program_id = $1`,
        [prog.program_id],
      );
    }

    if (prog.status !== 'active') {
      await client.query('ROLLBACK');
      response.status(400).json({
        error: prog.status === 'ended' || prog.status === 'closed'
          ? 'Chương trình đã kết thúc hoặc đã khoá bán.'
          : 'Chương trình chưa đến giờ mở bán.',
      });
      return;
    }

    // Tự động giải phóng các số đang giữ quá hạn trước khi kiểm tra số khả dụng
    await client.query(
      `UPDATE lottery_tickets SET status = 'available', held_by = NULL, held_until = NULL
       WHERE program_id = $1 AND ticket_number = ANY($2::varchar[]) AND status = 'held' AND held_until <= CURRENT_TIMESTAMP`,
      [request.params.programId, ticketNumbers],
    );

    const tickets = await client.query(
      `SELECT ticket_id, ticket_number, price FROM lottery_tickets
       WHERE program_id = $1 AND ticket_number = ANY($2::varchar[]) AND status = 'available'
       FOR UPDATE`,
      [request.params.programId, ticketNumbers],
    );
    if (tickets.rowCount !== ticketNumbers.length) {
      await client.query('ROLLBACK');
      response.status(409).json({ error: 'Một hoặc nhiều số vừa được người khác giữ hoặc đã bán.' });
      return;
    }
    await client.query(
      `UPDATE lottery_tickets SET status = 'held', held_by = $1, held_until = CURRENT_TIMESTAMP + INTERVAL '10 minutes'
       WHERE program_id = $2 AND ticket_number = ANY($3::varchar[])`,
      [request.user?.userId, request.params.programId, ticketNumbers],
    );
    await client.query('COMMIT');
    response.status(201).json({ tickets: tickets.rows });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.post('/api/orders', requireAuth, asyncRoute(async (request, response) => {
  const input = z.object({ programId: z.number().int().positive(), ticketNumbers: z.array(z.string()).min(1).max(10) }).parse(request.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tickets = await client.query(
      `SELECT ticket_id, ticket_number, price FROM lottery_tickets
       WHERE program_id = $1 AND ticket_number = ANY($2::varchar[]) AND held_by = $3
       AND status = 'held' AND held_until > CURRENT_TIMESTAMP FOR UPDATE`,
      [input.programId, input.ticketNumbers, request.user?.userId],
    );
    if (tickets.rowCount !== input.ticketNumbers.length) {
      await client.query('ROLLBACK');
      response.status(409).json({ error: 'Vé đã hết thời gian giữ. Vui lòng chọn lại.' });
      return;
    }
    const total = tickets.rows.reduce((sum: number, ticket: { price: string }) => sum + Number(ticket.price), 0);
    const order = await client.query(
      `INSERT INTO orders (user_id, order_code, total_amount, expires_at)
       VALUES ($1, 'ORD-' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 10)), $2, CURRENT_TIMESTAMP + INTERVAL '10 minutes')
       RETURNING *`,
      [request.user?.userId, total],
    );
    for (const ticket of tickets.rows) {
      await client.query(
        'INSERT INTO order_items (order_id, ticket_id, unit_price) VALUES ($1, $2, $3)',
        [order.rows[0].order_id, ticket.ticket_id, ticket.price],
      );
    }
    const formattedTickets = tickets.rows.map((t: { ticket_id: number; ticket_number: string }) => ({
      ticketId: t.ticket_id,
      ticketNumber: t.ticket_number,
      programId: input.programId,
    }));
    await client.query('COMMIT');
    response.status(201).json({
      order: {
        ...order.rows[0],
        tickets: formattedTickets,
      },
      tickets: tickets.rows,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.get('/api/orders/:orderId/payment-qr', requireAuth, asyncRoute(async (request, response) => {
  const result = await pool.query(
    `SELECT o.*,
            COUNT(oi.ticket_id)::int AS ticket_count,
            pr.program_id, pr.program_name, pr.program_code
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.order_id
     JOIN lottery_tickets t ON t.ticket_id = oi.ticket_id
     JOIN lottery_programs pr ON pr.program_id = t.program_id
     WHERE o.order_id = $1 AND (o.user_id = $2 OR $3 = 'ADMIN')
     GROUP BY o.order_id, pr.program_id`,
    [request.params.orderId, request.user?.userId, request.user?.role],
  );
  const order = result.rows[0];
  if (!order) {
    response.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
    return;
  }

  const bankCode = 'MB';
  const bankName = 'MBBank - Ngân hàng TMCP Quân Đội';
  const accountNumber = '999988886666';
  const accountName = 'LUCKYDRAW LOTTERY PORTAL';
  const amount = Number(order.total_amount);
  const transferContent = `LUCKYDRAW ${order.order_code}`;
  const qrCodeUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

  response.json({
    orderId: order.order_id,
    orderCode: order.order_code,
    orderStatus: order.status,
    amount,
    bankCode,
    bankName,
    accountNumber,
    accountName,
    transferContent,
    qrCodeUrl,
    expiresAt: order.expires_at,
    isSimulated: true,
  });
}));

app.post('/api/orders/:orderId/pay', requireAuth, asyncRoute(async (request, response) => {
  const idempotencyKey = (
    request.headers['idempotency-key'] ||
    request.headers['x-idempotency-key'] ||
    request.body?.idempotencyKey ||
    ''
  ).toString().trim();

  const paymentMethod = request.body?.paymentMethod || 'qr_simulation';
  const client = await pool.connect();

  try {
    // 1. Kiểm tra Idempotency Record đã lưu trước đó nếu có idempotencyKey
    if (idempotencyKey) {
      const existingRecord = await client.query(
        `SELECT response_code, response_body FROM idempotency_records
         WHERE idempotency_key = $1 AND user_id = $2`,
        [idempotencyKey, request.user?.userId],
      );
      if (existingRecord.rows[0]) {
        response.setHeader('X-Idempotent-Replayed', 'true');
        response.status(existingRecord.rows[0].response_code).json(existingRecord.rows[0].response_body);
        return;
      }
    }

    await client.query('BEGIN');

    // 2. Lock dòng orders bằng FOR UPDATE để chống race condition và xử lý double payment
    const orderResult = await client.query(
      `SELECT * FROM orders WHERE order_id = $1 AND user_id = $2 FOR UPDATE`,
      [request.params.orderId, request.user?.userId],
    );
    const order = orderResult.rows[0];
    if (!order) {
      await client.query('ROLLBACK');
      response.status(404).json({ error: 'Đơn hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn.' });
      return;
    }

    // 3. Nếu đơn hàng đã được thanh toán trước đó (idempotency an toàn trên cấp độ đơn hàng)
    if (order.status === 'confirmed') {
      const existingPayment = await client.query(
        `SELECT * FROM payments WHERE order_id = $1 AND status = 'success' ORDER BY payment_id DESC LIMIT 1`,
        [order.order_id],
      );
      await client.query('COMMIT');
      const responsePayload = {
        order: { ...order, status: 'confirmed' },
        payment: existingPayment.rows[0] ?? null,
        replayed: true,
        message: 'Đơn hàng đã được thanh toán thành công trước đó (Idempotent replay).',
      };
      if (idempotencyKey) {
        await pool.query(
          `INSERT INTO idempotency_records (idempotency_key, user_id, endpoint, order_id, response_code, response_body)
           VALUES ($1, $2, '/orders/pay', $3, 200, $4)
           ON CONFLICT (idempotency_key) DO NOTHING`,
          [idempotencyKey, request.user?.userId, order.order_id, JSON.stringify(responsePayload)],
        );
      }
      response.setHeader('X-Idempotent-Replayed', 'true');
      response.json(responsePayload);
      return;
    }

    if (order.status !== 'pending') {
      await client.query('ROLLBACK');
      response.status(400).json({ error: `Đơn hàng đang ở trạng thái "${order.status}", không thể thanh toán.` });
      return;
    }

    // Kiểm tra thời hạn giữ vé của đơn hàng
    if (order.expires_at && new Date(order.expires_at).getTime() <= Date.now()) {
      await client.query(
        `UPDATE orders SET status = 'expired', updated_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
        [order.order_id],
      );
      await client.query(
        `UPDATE lottery_tickets t SET status = 'available', held_by = NULL, held_until = NULL
         FROM order_items oi WHERE oi.order_id = $1 AND oi.ticket_id = t.ticket_id AND t.status = 'held'`,
        [order.order_id],
      );
      await client.query('COMMIT');
      response.status(400).json({ error: 'Đơn hàng đã hết thời gian giữ vé. Vé đã được trả lại hệ thống.' });
      return;
    }

    // 4. Cập nhật trạng thái vé sang 'sold'
    await client.query(
      `UPDATE lottery_tickets t SET status = 'sold', held_by = NULL, held_until = NULL
       FROM order_items oi WHERE oi.order_id = $1 AND oi.ticket_id = t.ticket_id`,
      [order.order_id],
    );

    // 5. Tạo mã giao dịch và ghi nhận thanh toán
    const paymentCode = 'PAY-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const transactionRef = 'TXN-QR-' + Date.now() + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const qrUrl = `https://img.vietqr.io/image/MB-999988886666-compact2.png?amount=${Number(order.total_amount)}&addInfo=${encodeURIComponent('LUCKYDRAW ' + order.order_code)}&accountName=${encodeURIComponent('LUCKYDRAW LOTTERY PORTAL')}`;

    const paymentResult = await client.query(
      `INSERT INTO payments (
         order_id, payment_code, payment_method, amount, status,
         is_simulated, transaction_reference, paid_at, idempotency_key, qr_code_url, metadata
       )
       VALUES ($1, $2, $3, $4, 'success', TRUE, $5, CURRENT_TIMESTAMP, $6, $7, $8)
       RETURNING *`,
      [
        order.order_id,
        paymentCode,
        paymentMethod,
        order.total_amount,
        transactionRef,
        idempotencyKey || null,
        qrUrl,
        JSON.stringify({
          bank: 'MBBank',
          accountNumber: '999988886666',
          transferContent: `LUCKYDRAW ${order.order_code}`,
          paidVia: 'QR_SIMULATION',
          clientIp: request.ip,
          userAgent: request.headers['user-agent'],
        }),
      ],
    );
    const payment = paymentResult.rows[0];

    // Cập nhật trạng thái đơn hàng sang 'confirmed'
    const updatedOrderResult = await client.query(
      `UPDATE orders SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE order_id = $1 RETURNING *`,
      [order.order_id],
    );
    const updatedOrder = updatedOrderResult.rows[0];

    // 6. Ghi log giao dịch chi tiết vào audit_logs
    const rawIp = request.ip || request.socket.remoteAddress || '127.0.0.1';
    const ipAddress = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(rawIp) ? rawIp : '127.0.0.1';

    await client.query(
      `INSERT INTO audit_logs (
         actor_user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent
       )
       VALUES ($1, $2, 'PAYMENT', $3, $4, $5, $6::inet, $7)`,
      [
        request.user?.userId,
        'PAYMENT_QR_SIMULATION_SUCCESS',
        payment.payment_code,
        JSON.stringify({ order_id: order.order_id, status: order.status }),
        JSON.stringify({
          order_id: order.order_id,
          order_code: order.order_code,
          payment_id: payment.payment_id,
          payment_code: payment.payment_code,
          amount: Number(payment.amount),
          payment_method: payment.payment_method,
          transaction_reference: payment.transaction_reference,
          idempotency_key: idempotencyKey || null,
          is_simulated: true,
          paid_at: payment.paid_at,
        }),
        ipAddress,
        request.headers['user-agent'] ?? 'unknown',
      ],
    );

    // 7. Lưu Idempotency Record
    const responsePayload = {
      order: updatedOrder,
      payment,
      replayed: false,
      message: 'Thanh toán QR mô phỏng thành công.',
    };

    if (idempotencyKey) {
      await client.query(
        `INSERT INTO idempotency_records (idempotency_key, user_id, endpoint, order_id, response_code, response_body)
         VALUES ($1, $2, '/orders/pay', $3, 200, $4)
         ON CONFLICT (idempotency_key) DO NOTHING`,
        [idempotencyKey, request.user?.userId, order.order_id, JSON.stringify(responsePayload)],
      );
    }

    await client.query('COMMIT');
    response.status(200).json(responsePayload);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.get('/api/me/payments', requireAuth, asyncRoute(async (request, response) => {
  const result = await pool.query(
    `SELECT p.*, o.order_code, pr.program_name
     FROM payments p
     JOIN orders o ON o.order_id = p.order_id
     LEFT JOIN order_items oi ON oi.order_id = o.order_id
     LEFT JOIN lottery_tickets t ON t.ticket_id = oi.ticket_id
     LEFT JOIN lottery_programs pr ON pr.program_id = t.program_id
     WHERE o.user_id = $1
     GROUP BY p.payment_id, o.order_id, pr.program_name
     ORDER BY p.created_at DESC LIMIT 50`,
    [request.user?.userId],
  );
  response.json(result.rows);
}));

app.post('/api/orders/:orderId/cancel', requireAuth, asyncRoute(async (request, response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const order = await client.query(
      `UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE order_id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING *`,
      [request.params.orderId, request.user?.userId],
    );
    if (!order.rows[0]) {
      await client.query('ROLLBACK');
      response.status(404).json({ error: 'Đơn hàng không tồn tại hoặc không thể huỷ.' });
      return;
    }
    await client.query(
      `UPDATE lottery_tickets t SET status = 'available', held_by = NULL, held_until = NULL
       FROM order_items oi
       WHERE oi.order_id = $1 AND oi.ticket_id = t.ticket_id AND t.status = 'held'`,
      [request.params.orderId],
    );
    await client.query('COMMIT');
    response.json({ order: order.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.get('/api/me/orders', requireAuth, asyncRoute(async (request, response) => {
  const result = await pool.query(
    `SELECT o.*, jsonb_agg(jsonb_build_object('ticketId', t.ticket_id, 'ticketNumber', t.ticket_number, 'programId', p.program_id, 'programName', p.program_name))
     AS tickets FROM orders o
     JOIN order_items oi ON oi.order_id = o.order_id
     JOIN lottery_tickets t ON t.ticket_id = oi.ticket_id
     JOIN lottery_programs p ON p.program_id = t.program_id
     WHERE o.user_id = $1 GROUP BY o.order_id ORDER BY o.created_at DESC`,
    [request.user?.userId],
  );
  response.json(result.rows);
}));

app.get('/api/results', asyncRoute(async (_request, response) => {
  const result = await pool.query(
    `SELECT d.draw_id, d.draw_code, d.completed_at, d.seed_commitment, d.revealed_seed, p.program_id, p.program_name,
            jsonb_agg(jsonb_build_object('ticketNumber', t.ticket_number, 'prizeName', pr.prize_name, 'rank', dr.result_rank)) AS results
     FROM draws d JOIN lottery_programs p ON p.program_id = d.program_id
     JOIN draw_results dr ON dr.draw_id = d.draw_id
     JOIN lottery_tickets t ON t.ticket_id = dr.ticket_id
     LEFT JOIN prizes pr ON pr.prize_id = dr.prize_id
     WHERE d.status = 'completed' GROUP BY d.draw_id, p.program_id ORDER BY d.completed_at DESC`,
  );
  response.json(result.rows);
}));

app.get('/api/organizer/programs', requireAuth, requireProgramManager, asyncRoute(async (request, response) => {
  await syncProgramStatuses();
  const result = await pool.query(
    `SELECT p.*, COUNT(t.ticket_id) FILTER (WHERE t.status IN ('held', 'sold'))::int AS reserved_tickets
     FROM lottery_programs p
     LEFT JOIN lottery_tickets t ON t.program_id = p.program_id
     WHERE $1 = 'ADMIN' OR p.created_by = $2
     GROUP BY p.program_id ORDER BY p.created_at DESC`,
    [request.user?.role, request.user?.userId],
  );
  response.json(result.rows);
}));

app.post('/api/organizer/programs/:programId/submit', requireAuth, requireProgramManager, asyncRoute(async (request, response) => {
  const result = await pool.query(
    `UPDATE lottery_programs
     SET status = 'pending_review', rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE program_id = $1 AND created_by = $2 AND status IN ('draft', 'rejected')
     RETURNING *`,
    [request.params.programId, request.user?.userId],
  );
  if (!result.rows[0]) {
    response.status(409).json({ error: 'Chỉ bản nháp hoặc chương trình bị từ chối mới được gửi duyệt.' });
    return;
  }
  await pool.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, new_data)
     VALUES ($1, 'SUBMIT_REVIEW', 'PROGRAM', $2, jsonb_build_object('status', 'pending_review'))`,
    [request.user?.userId, request.params.programId],
  );
  response.json(result.rows[0]);
}));

app.get('/api/organizer/programs/:programId/tickets', requireAuth, requireProgramManager, asyncRoute(async (request, response) => {
  const result = await pool.query(
    `SELECT t.ticket_id, t.ticket_number, t.price, t.status, t.held_until,
            u.username, u.full_name, o.order_code
     FROM lottery_tickets t
     JOIN lottery_programs p ON p.program_id = t.program_id
     LEFT JOIN users u ON u.user_id = t.held_by
     LEFT JOIN order_items oi ON oi.ticket_id = t.ticket_id
     LEFT JOIN orders o ON o.order_id = oi.order_id
     WHERE t.program_id = $1 AND ($2 = 'ADMIN' OR p.created_by = $3)
     ORDER BY t.ticket_number`,
    [request.params.programId, request.user?.role, request.user?.userId],
  );
  response.json(result.rows);
}));

app.get('/api/organizer/orders', requireAuth, requireProgramManager, asyncRoute(async (request, response) => {
  const result = await pool.query(
    `SELECT o.order_id, o.order_code, o.status, o.total_amount, o.created_at,
            p.program_id, p.program_name,
            COUNT(oi.ticket_id)::int AS ticket_count
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.order_id
     JOIN lottery_tickets t ON t.ticket_id = oi.ticket_id
     JOIN lottery_programs p ON p.program_id = t.program_id
     WHERE $1 = 'ADMIN' OR p.created_by = $2
     GROUP BY o.order_id, p.program_id
     ORDER BY o.created_at DESC LIMIT 100`,
    [request.user?.role, request.user?.userId],
  );
  response.json(result.rows);
}));

app.get('/api/admin/stats', requireAuth, requireAdmin, asyncRoute(async (_request, response) => {
  const [stats, monthly, statuses, programs] = await Promise.all([
    pool.query(`SELECT
      (SELECT COUNT(*)::int FROM lottery_programs) AS programs,
      (SELECT COUNT(*)::int FROM orders) AS orders,
      (SELECT COUNT(*)::int FROM users) AS users,
      COALESCE((SELECT SUM(amount) FROM payments WHERE status = 'success'), 0) AS revenue`),
    pool.query(`SELECT TO_CHAR(date_trunc('month', created_at), 'Mon') AS name,
      COUNT(*)::int AS orders, COALESCE(SUM(total_amount), 0) AS revenue
      FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY date_trunc('month', created_at) ORDER BY date_trunc('month', created_at)`),
    pool.query(`SELECT status AS name, COUNT(*)::int AS value
      FROM lottery_programs GROUP BY status ORDER BY status`),
    pool.query(`SELECT p.*, COUNT(t.ticket_id) FILTER (WHERE t.status IN ('held', 'sold'))::int AS reserved_tickets
      FROM lottery_programs p LEFT JOIN lottery_tickets t ON t.program_id = p.program_id
      GROUP BY p.program_id ORDER BY p.created_at DESC LIMIT 10`),
  ]);
  response.json({ stats: stats.rows[0], monthly: monthly.rows, statuses: statuses.rows, programs: programs.rows });
}));

app.get('/api/admin/users', requireAuth, requireAdmin, asyncRoute(async (_request, response) => {
  const result = await pool.query(
    `SELECT u.user_id, u.username, u.email, u.full_name, u.status, u.created_at,
            r.role_name,
            COUNT(DISTINCT oi.ticket_id) FILTER (WHERE o.status = 'confirmed')::int AS total_tickets,
            COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'success'), 0) AS total_spent
     FROM users u
     JOIN roles r ON r.role_id = u.role_id
     LEFT JOIN orders o ON o.user_id = u.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.order_id
     LEFT JOIN payments p ON p.order_id = o.order_id
     GROUP BY u.user_id, r.role_name
     ORDER BY u.created_at DESC`,
  );
  response.json(result.rows.map((user) => ({
    userId: user.user_id,
    username: user.username,
    email: user.email,
    fullName: user.full_name,
    role: user.role_name,
    status: user.status,
    createdAt: user.created_at,
    totalTickets: user.total_tickets,
    totalSpent: user.total_spent,
  })));
}));

app.patch('/api/admin/users/:userId/status', requireAuth, requireAdmin, asyncRoute(async (request, response) => {
  const input = z.object({ status: z.enum(['active', 'inactive', 'locked']) }).parse(request.body);
  if (String(request.user?.userId) === request.params.userId) {
    response.status(400).json({ error: 'Không thể khóa hoặc vô hiệu hóa chính tài khoản đang đăng nhập.' });
    return;
  }
  const result = await pool.query(
    `UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $2 RETURNING user_id, username, email, full_name, status`,
    [input.status, request.params.userId],
  );
  if (!result.rows[0]) {
    response.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    return;
  }
  await pool.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, new_data)
     VALUES ($1, 'UPDATE_STATUS', 'USER', $2, jsonb_build_object('status', $3))`,
    [request.user?.userId, request.params.userId, input.status],
  );
  response.json(result.rows[0]);
}));

app.post('/api/admin/organizers', requireAuth, requireAdmin, asyncRoute(async (request, response) => {
  const input = organizerSchema.parse(request.body);
  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    const result = await pool.query(
      `INSERT INTO users (role_id, username, email, password_hash, full_name, status, email_verified)
       SELECT role_id, $1, LOWER($2), $3, $4, 'active', TRUE FROM roles WHERE role_name = 'ORGANIZER'
       RETURNING user_id, username, email, full_name, status, created_at`,
      [input.username, input.email, passwordHash, input.fullName],
    );
    const user = result.rows[0];
    if (!user) {
      response.status(500).json({ error: 'Database chưa được cấu hình vai trò ORGANIZER.' });
      return;
    }
    await pool.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, new_data)
       VALUES ($1, 'CREATE', 'USER', $2, jsonb_build_object('role', 'ORGANIZER'))`,
      [request.user?.userId, user.user_id],
    );
    response.status(201).json({
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: 'ORGANIZER',
      },
    });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      response.status(409).json({ error: 'Tên đăng nhập hoặc email đã tồn tại.' });
      return;
    }
    throw error;
  }
}));

app.get('/api/admin/orders', requireAuth, requireAdmin, asyncRoute(async (_request, response) => {
  const result = await pool.query(`SELECT o.*, jsonb_agg(jsonb_build_object(
    'ticketId', t.ticket_id, 'ticketNumber', t.ticket_number, 'programId', p.program_id, 'programName', p.program_name
  )) AS tickets FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    JOIN lottery_tickets t ON t.ticket_id = oi.ticket_id
    JOIN lottery_programs p ON p.program_id = t.program_id
    GROUP BY o.order_id ORDER BY o.created_at DESC LIMIT 100`);
  response.json(result.rows);
}));

app.get('/api/admin/tickets', requireAuth, requireAdmin, asyncRoute(async (_request, response) => {
  const result = await pool.query(
    `SELECT t.ticket_id, t.ticket_number, t.price, t.status, t.held_until,
            u.username, u.full_name, o.order_code, p.program_name
     FROM lottery_tickets t
     JOIN lottery_programs p ON p.program_id = t.program_id
     LEFT JOIN users u ON u.user_id = t.held_by
     LEFT JOIN order_items oi ON oi.ticket_id = t.ticket_id
     LEFT JOIN orders o ON o.order_id = oi.order_id
     ORDER BY t.created_at DESC
     LIMIT 500`,
  );
  response.json(result.rows);
}));

app.get('/api/admin/audit', requireAuth, requireAdmin, asyncRoute(async (_request, response) => {
  const result = await pool.query(`SELECT a.audit_id, a.created_at, COALESCE(u.username, 'system') AS username,
    a.action, a.entity_type, a.entity_id, a.old_data, a.new_data, a.ip_address::text AS ip_address, a.user_agent
    FROM audit_logs a LEFT JOIN users u ON u.user_id = a.actor_user_id
    ORDER BY a.created_at DESC LIMIT 100`);
  response.json(result.rows);
}));

app.post('/api/admin/programs', requireAuth, requireProgramManager, asyncRoute(async (request, response) => {
  const input = programSchema.extend({
    prizeName: z.preprocess(
      (value) => value === '' ? undefined : value,
      z.string().trim().min(1).max(200).optional(),
    ),
    prizeValue: z.number().nonnegative().optional(),
    imageUrl: z.preprocess(
      (value) => value === '' ? undefined : value,
      z.string().max(1000).refine((value) => value.startsWith('/') || /^https?:\/\//.test(value), 'URL ảnh không hợp lệ.').optional(),
    ),
    videoUrl: z.preprocess(
      (value) => value === '' ? undefined : value,
      z.string().max(1000).refine((value) => value.startsWith('/') || /^https?:\/\//.test(value), 'URL video không hợp lệ.').optional(),
    ),
  }).parse(request.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO lottery_programs (created_by, program_code, program_name, description, rules, ticket_price, total_tickets, start_time, end_time, draw_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [request.user?.userId, input.programCode, input.programName, input.description, input.rules, input.ticketPrice, input.totalTickets, input.startTime, input.endTime, input.drawTime, request.user?.role === 'ADMIN' ? input.status ?? 'draft' : input.status === 'pending_review' ? 'pending_review' : 'draft'],
    );
    const program = result.rows[0];
    for (let index = 1; index <= input.totalTickets; index += 1) {
      await client.query(
        'INSERT INTO lottery_tickets (program_id, ticket_number, price) VALUES ($1, $2, $3)',
        [program.program_id, String(index).padStart(String(input.totalTickets).length, '0'), input.ticketPrice],
      );
    }
    if (input.prizeName) {
      await client.query(
        `INSERT INTO prizes (program_id, prize_name, prize_type, estimated_value, image_url, video_url)
         VALUES ($1, $2, 'main', $3, $4, $5)`,
        [program.program_id, input.prizeName, input.prizeValue ?? 0, input.imageUrl, input.videoUrl],
      );
    }
    await client.query('COMMIT');
    response.status(201).json(program);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.patch('/api/admin/programs/:programId/status', requireAuth, requireAdmin, asyncRoute(async (request, response) => {
  const input = z.object({
    status: z.enum(['upcoming', 'active', 'ended', 'rejected', 'cancelled', 'draft']),
    rejectionReason: z.string().trim().max(2000).optional(),
  }).parse(request.body);
  if (input.status === 'rejected' && !input.rejectionReason) {
    response.status(400).json({ error: 'Vui lòng nhập lý do từ chối chương trình.' });
    return;
  }
  const result = await pool.query(
    `UPDATE lottery_programs
     SET status = CASE
           WHEN $1 = 'upcoming' AND start_time IS NOT NULL AND start_time <= CURRENT_TIMESTAMP AND (end_time IS NULL OR end_time > CURRENT_TIMESTAMP) THEN 'active'
           WHEN $1 = 'upcoming' AND end_time IS NOT NULL AND end_time <= CURRENT_TIMESTAMP THEN 'ended'
           ELSE $1
         END,
         rejection_reason = CASE WHEN $1 = 'rejected' THEN $3 ELSE NULL END,
         reviewed_by = $4,
         reviewed_at = CURRENT_TIMESTAMP,
         published_at = CASE WHEN $1 IN ('upcoming', 'active') THEN CURRENT_TIMESTAMP ELSE published_at END,
         updated_at = CURRENT_TIMESTAMP
     WHERE program_id = $2
     RETURNING *`,
    [input.status, request.params.programId, input.rejectionReason ?? null, request.user?.userId],
  );
  if (!result.rows[0]) {
    response.status(404).json({ error: 'Không tìm thấy chương trình.' });
    return;
  }
  await pool.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, new_data)
     VALUES ($1, $2, 'PROGRAM', $3, jsonb_build_object('status', $4))`,
    [request.user?.userId, input.status === 'rejected' ? 'REJECT' : input.status === 'cancelled' ? 'CANCEL' : 'APPROVE', request.params.programId, input.status],
  );
  response.json(result.rows[0]);
}));

app.post('/api/admin/programs/:programId/draw', requireAuth, requireProgramManager, asyncRoute(async (request, response) => {
  const seed = crypto.randomBytes(32).toString('hex');
  const commitment = crypto.createHash('sha256').update(seed).digest('hex');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const program = await client.query(
      `SELECT * FROM lottery_programs
       WHERE program_id = $1
       AND ($2 = 'ADMIN' OR created_by = $3)
       FOR UPDATE`,
      [request.params.programId, request.user?.role, request.user?.userId],
    );
    if (!program.rows[0]) {
      await client.query('ROLLBACK');
      response.status(404).json({ error: 'Không tìm thấy chương trình.' });
      return;
    }
    const draw = await client.query(
      `INSERT INTO draws (program_id, executed_by, draw_code, status, algorithm_version, seed_commitment, revealed_seed, started_at, completed_at)
       VALUES ($1, $2, 'DRAW-' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 12)), 'completed', 'SHA-256 deterministic selection', $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [request.params.programId, request.user?.userId, commitment, seed],
    );
    const tickets = await client.query(
      `SELECT ticket_id FROM lottery_tickets WHERE program_id = $1 AND status = 'sold' ORDER BY MD5(ticket_number || $2) LIMIT 3`,
      [request.params.programId, seed],
    );
    const prizes = await client.query(`SELECT prize_id FROM prizes WHERE program_id = $1 ORDER BY prize_id LIMIT $2`, [request.params.programId, tickets.rowCount]);
    for (let index = 0; index < tickets.rows.length; index += 1) {
      await client.query(
        `INSERT INTO draw_results (draw_id, program_id, ticket_id, prize_id, result_rank, is_winner, verification_data)
         VALUES ($1, $2, $3, $4, $5, $6, jsonb_build_object('algorithm', 'SHA-256', 'seed', $7))`,
        [draw.rows[0].draw_id, request.params.programId, tickets.rows[index].ticket_id, prizes.rows[index]?.prize_id ?? null, index + 1, Boolean(prizes.rows[index]), seed],
      );
    }
    await client.query(`UPDATE lottery_programs SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE program_id = $1`, [request.params.programId]);
    await client.query('COMMIT');
    response.status(201).json(draw.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) {
    const details = error.flatten();
    const firstFieldError = Object.values(details.fieldErrors).flat()[0];
    response.status(400).json({
      error: typeof firstFieldError === 'string' ? firstFieldError : 'Dữ liệu không hợp lệ.',
      details,
    });
    return;
  }
  console.error(error);
  response.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
});

export { app };
