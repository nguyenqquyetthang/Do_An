import type { TicketStatus } from '../../data/mockData';

type Props = {
  selected: string[];
  onSelect: (number: string) => void;
  ticketMap: Record<string, TicketStatus>;
  tickets: Array<{ number: string; status: TicketStatus }>;
};

export function TicketGrid({ selected, onSelect, ticketMap, tickets }: Props) {
  return (
    <div className="ticket-grid">
      {tickets.map((ticket) => {
        const status = ticketMap[ticket.number] ?? 'Available';
        const isSelected = selected.includes(ticket.number);

        const classes = [
          'ticket-slot',
          status === 'Available' ? 'available' : '',
          status === 'Held' ? 'holding' : '',
          status === 'Sold' ? 'sold' : '',
          status === 'Unavailable' ? 'unavailable' : '',
          isSelected ? 'selected' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={ticket.number}
            onClick={() => onSelect(ticket.number)}
            className={classes}
            aria-pressed={isSelected}
            title={`Số ${ticket.number}`}
            type="button"
          >
            {ticket.number}
          </button>
        );
      })}
    </div>
  );
}
