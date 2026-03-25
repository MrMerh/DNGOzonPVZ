import { useMemo } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { useIncome } from '../hooks/useIncome';
import { useSettingsContext } from '../context/SettingsContext';
import SummaryCard from '../components/ui/SummaryCard';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, toISOMonth } from '../utils/dateHelpers';
import { calcNet, calcTax } from '../utils/taxCalculations';
import type { RecentTransaction } from '../types';
import { format } from 'date-fns';

const THIS_MONTH = toISOMonth(new Date());

export default function Dashboard() {
  const { expenses } = useExpenses();
  const { entries } = useIncome();
  const { settings } = useSettingsContext();
  const { taxRate, breakevenTarget } = settings;

  const monthExpenses = useMemo(
    () => expenses.filter((e) => toISOMonth(e.date) === THIS_MONTH),
    [expenses],
  );
  const monthIncome = useMemo(
    () => entries.filter((e) => toISOMonth(e.date) === THIS_MONTH),
    [entries],
  );

  const grossIncome = monthIncome.reduce((s, e) => s + e.amount, 0);
  const taxAmount = calcTax(grossIncome, taxRate);
  const netIncome = calcNet(grossIncome, taxRate);
  const totalExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const profit = netIncome - totalExpenses;
  const breakevenProgress = breakevenTarget > 0 ? netIncome / breakevenTarget : 0;

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
      <h1 className="page-title">Дашборд <span className="page-title-sub">{currentMonthLabel}</span></h1>

      <div className="cards-grid">
        <SummaryCard label="Доходы (нетто)" value={formatCurrency(netIncome)} sub={`Налог: ${formatCurrency(taxAmount)}`} accent="green" />
        <SummaryCard label="Расходы" value={formatCurrency(totalExpenses)} accent="red" />
        <SummaryCard
          label="Прибыль / Убыток"
          value={formatCurrency(profit)}
          sub={profit >= 0 ? 'В плюсе' : 'В минусе'}
          accent={profit >= 0 ? 'green' : 'red'}
        />
        <SummaryCard label="Доходы (брутто)" value={formatCurrency(grossIncome)} accent="blue" />
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 className="card-title">Точка безубыточности</h2>
        <ProgressBar
          value={breakevenProgress}
          label={`Нетто доход / цель ${formatCurrency(breakevenTarget)}`}
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
