-- Development seed data
INSERT INTO users (role_id, username, email, password_hash, full_name, phone, status, email_verified)
VALUES
    ((SELECT role_id FROM roles WHERE role_name = 'ADMIN'), 'admin', 'admin@luckydraw.vn', '$2b$10$JC1vIpiIch9vvSMyapHTZelBS/fCpF9Zr/Zsw0.SfC5PcLhogp05S', 'Quản trị viên Hệ thống', '0988888888', 'active', true),
    ((SELECT role_id FROM roles WHERE role_name = 'ORGANIZER'), 'organizer', 'organizer@luckydraw.vn', '$2b$10$tV96.MjQz3Acmqu5.o.oU.n.ByIHtFDc8TI/Pt4iA/5HzMa31UnyO', 'Người tạo chương trình', '0977777777', 'active', true),
    ((SELECT role_id FROM roles WHERE role_name = 'USER'), 'user', 'user@luckydraw.vn', '$2b$10$pCmainLKMjCh4CIn/M4BvOK5tdwx4Tkmx.Ix4z95NLdiRkKz8.bca', 'Người dùng thử nghiệm', '0912345678', 'active', true)
ON CONFLICT (email) DO NOTHING;
