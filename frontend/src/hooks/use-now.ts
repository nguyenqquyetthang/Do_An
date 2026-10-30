import { useEffect, useState } from "react";

/** Đồng hồ dùng chung cho các bộ đếm ngược; chỉ component gọi hook này mới re-render. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}
