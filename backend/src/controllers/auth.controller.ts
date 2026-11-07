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

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  email: z.string().email().max(255),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  province: z.string().trim().max(100).optional().or(z.literal('')),
  district: z.string().trim().max(100).optional().or(z.literal('')),
  ward: z.string().trim().max(100).optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6).max(128),
  newPassword: z.string().min(6).max(128),
  confirmPassword: z.string().min(6).max(128),
}).refine((input) => input.newPassword === input.confirmPassword, {
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
    `SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.address, u.province, u.district, u.ward, r.role_name
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
      phone: user.phone,
      address: user.address,
      province: user.province,
      district: user.district,
      ward: user.ward,
      balance: 0,
      role: user.role_name,
    },
  });
}

export async function updateProfile(request: AuthenticatedRequest, response: Response) {
  const input = profileSchema.parse(request.body);
  try {
    const result = await pool.query(
      `UPDATE users
       SET full_name = $1, email = LOWER($2), phone = NULLIF($3, ''), address = NULLIF($4, ''),
           province = NULLIF($5, ''), district = NULLIF($6, ''), ward = NULLIF($7, ''),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $8
       RETURNING user_id, username, email, full_name, phone, address, province, district, ward`,
      [input.fullName, input.email, input.phone ?? '', input.address ?? '', input.province ?? '', input.district ?? '', input.ward ?? '', request.user?.userId],
    );
    if (!result.rows[0]) {
      response.status(404).json({ error: 'Không tìm thấy tài khoản.' });
      return;
    }

    const user = result.rows[0];
    response.json({ user: {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      address: user.address,
      province: user.province,
      district: user.district,
      ward: user.ward,
      role: request.user?.role ?? 'USER',
    } });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      response.status(409).json({ error: 'Email này đã được sử dụng bởi tài khoản khác.' });
      return;
    }
    throw error;
  }
}

export async function changePassword(request: AuthenticatedRequest, response: Response) {
  const input = passwordSchema.parse(request.body);
  const result = await pool.query(
    'SELECT password_hash FROM users WHERE user_id = $1',
    [request.user?.userId],
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(input.currentPassword, user.password_hash))) {
    response.status(400).json({ error: 'Mật khẩu hiện tại chưa đúng.' });
    return;
  }
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
    [await bcrypt.hash(input.newPassword, 12), request.user?.userId],
  );
  response.json({ message: 'Đổi mật khẩu thành công.' });
}
