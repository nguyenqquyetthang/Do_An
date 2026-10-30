const numberFormatter = new Intl.NumberFormat("vi-VN");

export const pad = (value: number, length = 2) => String(value).padStart(length, "0");

/** Số dự thưởng luôn hiển thị đủ 4 chữ số: 7 -> 0007 */
export const formatTicketNumber = (value: number, length = 4) => pad(value, length);

export const formatNumber = (value: number) => numberFormatter.format(Math.round(value));

export const formatPoints = (value: number) => `${numberFormatter.format(Math.round(value))} điểm`;

export const formatCompactPoints = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(value % 1_000_000_000 === 0 ? 0 : 1)} tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)} tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
};

export const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} - ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

export const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

export const formatTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** Dùng cho audit log: HH:MM:SS */
export const shortTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

/** "2 ngày 13 giờ" khi còn xa, "13:04:22" khi sắp hết. */
export const formatDuration = (ms: number) => {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days} ngày ${pad(hours)} giờ`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

/** Đồng hồ giữ chỗ luôn ở dạng MM:SS. */
export const formatHold = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad(minutes)}:${pad(seconds)}`;
};

export const maskName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return `${parts[0].slice(0, 2)}***`;
  return parts
    .map((part, index) => (index === parts.length - 1 ? part : `${part.charAt(0)}***`))
    .join(" ");
};
