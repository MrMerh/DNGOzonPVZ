import { useMemo } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { useIncome } from '../hooks/useIncome';
import { useSettingsContext } from '../context/SettingsContext';
import SummaryCard from '../components/ui/SummaryCard';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, toISOMonth } from '../utils/dateHelpers';
import { calcTax } from '../utils/taxCalculations';
import type { RecentTransaction } from '../types';
import { format } from 'date-fns';

const THIS_MONTH = toISOMonth(new Date());

export default function Dashboard() {
  const { expenses } = useExpenses();
  const { entries } = useIncome();
  const { settings } = useSettingsContext();
  const { taxRate, breakevenTarget } = settings;

  const monthIncome = useMemo(
    () => entries.filter((e) => toISOMonth(e.date) === THIS_MONTH),
    [entries],
  );

  // All-time totals for summary cards
  const grossIncome = entries.reduce((s, e) => s + e.amount, 0);
  const taxAmount = entries.reduce((s, e) => s + (e.noTax ? 0 : calcTax(e.amount, taxRate)), 0);
  const netIncome = grossIncome - taxAmount;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = netIncome - totalExpenses;

  // This month for breakeven progress
  const monthGross = monthIncome.reduce((s, e) => s + e.amount, 0);
  const monthTax = monthIncome.reduce((s, e) => s + (e.noTax ? 0 : calcTax(e.amount, taxRate)), 0);
  const monthNet = monthGross - monthTax;
  const breakevenProgress = breakevenTarget > 0 ? monthNet / breakevenTarget : 0;

  const recent: RecentTransaction[] = useMemo(() => {
    const inc: RecentTransaction[] = entries.slice(0, 5).map((e) => ({
      id: e.id, type: 'income', date: e.date, amount: e.amount, label: e.description || 'Доход',
    }));
    const exp: RecentTransaction[] = expenses.slice(0, 5).map((e) => ({
      id: e.id, type: 'expense', date: e.date, amount: e.amount, label: e.category,
    }));
    return [...inc, ...exp].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
  }, [entries, expenses]);

  const currentMonthLabel = format(new Date(), 'LLLL yyyy', { locale: undefined });

  return (
    <div className="page">
      <h1 className="page-title">Дашборд <span className="page-title-sub">за всё время</span></h1>

      <div className="cards-grid">
        <SummaryCard label="Выручка (брутто)" value={formatCurrency(grossIncome)} sub={`Нетто после налога: ${formatCurrency(netIncome)}`} accent="blue" />
        <SummaryCard label="Налог" value={formatCurrency(taxAmount)} sub={`Ставка: ${Math.round(taxRate * 100)}%`} accent="red" />
        <SummaryCard label="Расходы" value={formatCurrency(totalExpenses)} accent="red" />
        <SummaryCard
          label="Прибыль / Убыток"
          value={formatCurrency(profit)}
          sub={profit >= 0 ? 'В плюсе' : 'В минусе'}
          accent={profit >= 0 ? 'green' : 'red'}
        />
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 className="card-title">Точка безубыточности</h2>
        <ProgressBar
          value={breakevenProgress}
          label={`${currentMonthLabel} — нетто ${formatCurrency(monthNet)} / цель ${formatCurrency(breakevenTarget)}`}
        />
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 className="card-title">Последние операции</h2>
        {recent.length === 0 ? (
          <p className="empty-text">Нет данных. Добавьте доходы или расходы.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Тип</th>
                <th>Описание</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id + t.type}>
                  <td>{formatDate(t.date)}</td>
                  <td>
                    {t.type === 'income'
                      ? <span className="tag green">Доход</span>
                      : <Badge category={t.label as never} />
                    }
                  </td>
                  <td className="desc-cell">{t.label}</td>
                  <td className={`amount-cell ${t.type === 'income' ? 'green' : 'red'}`}>
                    {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
