import { Link } from 'react-router-dom';
import type { Program } from '../../data/mockData';

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' điểm';
}

export function ProgramCard({ program }: { program: Program }) {
  return (
    <div className="glass-panel program-card">
      <img src={program.image} alt={program.title} className="program-image" />
      <div className="program-body">
        <div className="program-header">
          <h3>{program.title}</h3>
          <span className="status-pill">{program.status}</span>
        </div>

        <p className="program-summary">{program.prize}</p>

        <div className="program-meta">
          <div className="meta-row">
            <span>1 số</span>
            <span>{formatMoney(program.ticketPrice)}</span>
          </div>
          <div className="meta-row">
            <span>Còn</span>
            <span>{(program.totalTickets - program.soldTickets).toLocaleString()} số</span>
          </div>
        </div>

        <Link to={`/programs/${program.id}`} className="primary-btn w-full rounded-xl">
          {program.status === 'Đã kết thúc' ? 'Xem kết quả' : 'Chọn số'}
        </Link>
      </div>
    </div>
  );
}
