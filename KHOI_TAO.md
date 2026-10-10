# Khởi tạo dự án LuckyDraw

Tài liệu này giúp thành viên mới tải code về và chạy dự án trên máy cá nhân.

## Yêu cầu

- Node.js 18 trở lên
- npm 9 trở lên
- Git

Kiểm tra phiên bản:

```bash
node --version
npm --version
git --version
```

## Tải và chạy dự án

```bash
git clone <URL_REPOSITORY>
cd Do_an
npm install
npm run dev
```

Mở địa chỉ được Vite hiển thị trong terminal, thường là `http://localhost:5173`.

## Các lệnh thường dùng

```bash
npm run dev       # Chạy môi trường phát triển
npm run build     # Kiểm tra TypeScript và tạo bản build
npm run preview   # Xem bản build ở chế độ preview
```

## Quy trình làm việc với Git

```bash
git pull origin main
git checkout -b feature/ten-tinh-nang

# Sau khi hoàn thành thay đổi
npm run build
git add .
git commit -m "mo ta thay doi"
git push -u origin feature/ten-tinh-nang
```

Sau đó tạo Pull Request để cùng kiểm tra trước khi gộp vào `main`.

## Cấu trúc chính

- `frontend/src/App.tsx`: các màn hình và luồng chính của ứng dụng
- `frontend/src/components/`: các component giao diện dùng lại
- `frontend/src/data/mockData.ts`: dữ liệu mẫu cho giao diện demo
- `frontend/src/index.css`: style chung và Tailwind
- `vite.config.ts`: cấu hình Vite

## Lưu ý

- Không commit `node_modules`, `dist`, file `.env` hoặc các file `*.tsbuildinfo`.
- Khi thêm biến môi trường, tạo `.env.example` chỉ chứa tên biến, không chứa khóa bí mật.
- Đây hiện là giao diện demo dùng dữ liệu mẫu; backend và cơ sở dữ liệu được chuẩn bị trong các thư mục tương ứng.
