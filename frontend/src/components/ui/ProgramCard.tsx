import { Link } from 'react-router-dom';
type Program = {
  id: string;
  title: string;
  displayStatus: string;
  ticketPrice: number;
  total_tickets: number;
  soldTickets: number;
  description: string | null;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' điểm';
}

export function ProgramCard({ program }: { program: Program }) {
  return (
    <div className="glass-panel program-card">
      <div className="program-image flex items-center justify-center bg-gradient-to-br from-cyan-500/30 to-violet-500/30 text-5xl font-black text-white">L</div>
      <div className="program-body">
        <div className="program-header">
          <h3>{program.title}</h3>
          <span className="status-pill">{program.displayStatus}</span>
        </div>

        <p className="program-summary">{program.description || 'Chương trình quay số minh bạch và an toàn.'}</p>

        <div className="program-meta">
          <div className="meta-row">
            <span>1 số</span>
            <span>{formatMoney(program.ticketPrice)}</span>
          </div>
          <div className="meta-row">
            <span>Còn</span>
            <span>{(program.total_tickets - program.soldTickets).toLocaleString()} số</span>
          </div>
        </div>

        <Link to={`/chuong-trinh/${program.id}`} className="primary-btn w-full rounded-xl">
          {program.displayStatus === 'Đã kết thúc' ? 'Xem kết quả' : 'Chọn số'}
        </Link>
      </div>
    </div>
  );
}
