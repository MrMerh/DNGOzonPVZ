interface SummaryCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'red' | 'blue' | 'default';
}

export default function SummaryCard({ label, value, sub, accent = 'default' }: SummaryCardProps) {
  return (
    <div className={`summary-card accent-${accent}`}>
      <span className="summary-label">{label}</span>
      <span className="summary-value">{value}</span>
      {sub && <span className="summary-sub">{sub}</span>}
    </div>
  );
}
