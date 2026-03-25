import type { ExpenseCategory } from '../../types';

const COLORS: Record<ExpenseCategory, string> = {
  реклама: '#3b82f6',
  аренда: '#8b5cf6',
  зарплата: '#f59e0b',
  оборудование: '#06b6d4',
  расходники: '#10b981',
  прочее: '#6b7280',
};

export default function Badge({ category }: { category: ExpenseCategory }) {
  return (
    <span
      className="badge"
      style={{ background: `${COLORS[category]}22`, color: COLORS[category], borderColor: `${COLORS[category]}44` }}
    >
      {category}
    </span>
  );
}
