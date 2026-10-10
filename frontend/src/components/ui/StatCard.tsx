import type { LucideIcon } from 'lucide-react';

type Props = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export function StatCard({ label, value, icon: Icon }: Props) {
  return (
    <div className="glass-panel stat-card">
      <div className="stat-head">
        <div>
          <div className="muted-text">{label}</div>
          <div className="stat-value">{value}</div>
        </div>
        <div className="icon-box">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
