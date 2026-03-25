interface ProgressBarProps {
  value: number; // 0–1
  label?: string;
}

export default function ProgressBar({ value, label }: ProgressBarProps) {
  const pct = Math.min(Math.round(value * 100), 100);
  const color = pct >= 100 ? 'var(--green)' : pct >= 60 ? 'var(--accent)' : 'var(--yellow)';

  return (
    <div className="progress-wrap">
      {label && (
        <div className="progress-header">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
