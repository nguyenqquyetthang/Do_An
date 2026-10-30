import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../db.js';
import { issueToken } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types/http.js';
import type { Response } from 'express';

const credentialsSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(128),
});

const registerSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(2).max(150),
  username: z.string().trim().min(3).max(50).regex(
    /^[A-Za-z0-9_.-]+$/,
    'Tên đăng nhập chỉ được chứa chữ không dấu, số, dấu gạch dưới, chấm hoặc gạch ngang.',
  ),
  confirmPassword: z.string().min(6).max(128),
}).refine((input) => input.password === input.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Mật khẩu xác nhận không khớp.',
});

export async function register(request: AuthenticatedRequest, response: Response) {
  const input = registerSchema.parse(request.body);
  const passwordHash = await bcrypt.hash(input.password, 12);
  let result;
  try {
    result = await pool.query(
      `INSERT INTO users (role_id, username, email, password_hash, full_name)
       SELECT role_id, $1, LOWER($2), $3, $4 FROM roles WHERE role_name = 'USER'
       RETURNING user_id, username, email, full_name`,
      [input.username, input.email, passwordHash, input.fullName],
    );
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      const constraint = 'constraint' in error && error.constraint === 'users_email_key' ? 'email' : 'username';
      response.status(409).json({
        error: constraint === 'email'
          ? 'Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.'
          : 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.',
      });
      return;
    }
    throw error;
  }
  const user = result.rows[0];
  response.status(201).json({
    user: {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: 'USER',
    },
    token: issueToken(user.user_id, 'USER'),
  });
}

export async function login(request: AuthenticatedRequest, response: Response) {
  const input = credentialsSchema.parse(request.body);
  const result = await pool.query(
    `SELECT u.user_id, u.username, u.email, u.full_name, u.password_hash, u.status, r.role_name
     FROM users u JOIN roles r ON r.role_id = u.role_id
     WHERE LOWER(u.email) = LOWER($1)`,
    [input.email],
  );
  const user = result.rows[0];
  if (!user || user.status !== 'active' || !(await bcrypt.compare(input.password, user.password_hash))) {
    response.status(401).json({ error: 'Email hoặc mật khẩu chưa đúng.' });
    return;
  }
  response.json({
    user: {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role_name,
    },
    token: issueToken(user.user_id, user.role_name),
  });
}

export async function me(request: AuthenticatedRequest, response: Response) {
  const result = await pool.query(
    `SELECT u.user_id, u.username, u.email, u.full_name, r.role_name
     FROM users u
     JOIN roles r ON r.role_id = u.role_id
     WHERE u.user_id = $1`,
    [request.user?.userId],
  );
  const user = result.rows[0];
  if (!user) {
    response.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    return;
  }
  response.json({
    user: {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      balance: 0,
      role: user.role_name,
    },
  });
}
