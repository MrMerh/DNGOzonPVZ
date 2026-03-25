import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useExpenses } from '../hooks/useExpenses';
import { useIncome } from '../hooks/useIncome';
import { useSettingsContext } from '../context/SettingsContext';
import type { MonthlyAggregate } from '../types';
import { toISOMonth, formatMonthLabel } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/formatCurrency';
import { calcTax, calcNet } from '../utils/taxCalculations';

function buildAggregates(
  expenses: ReturnType<typeof useExpenses>['expenses'],
  entries: ReturnType<typeof useIncome>['entries'],
  taxRate: number,
): MonthlyAggregate[] {
  const map = new Map<string, MonthlyAggregate>();

  const ensure = (month: string) => {
    if (!map.has(month)) {
      map.set(month, {
        month,
        label: formatMonthLabel(month),
        grossIncome: 0, taxAmount: 0, netIncome: 0,
        totalExpenses: 0, profit: 0,
      });
    }
    return map.get(month)!;
  };

  entries.forEach((e) => {
    const agg = ensure(toISOMonth(e.date));
    agg.grossIncome += e.amount;
    agg.taxAmount = calcTax(agg.grossIncome, taxRate);
    agg.netIncome = calcNet(agg.grossIncome, taxRate);
  });

  expenses.forEach((e) => {
    const agg = ensure(toISOMonth(e.date));
    agg.totalExpenses += e.amount;
  });

  map.forEach((agg) => { agg.profit = agg.netIncome - agg.totalExpenses; });

  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

const TICK_STYLE = { fill: '#94a3b8', fontSize: 12 };

export default function Analytics() {
  const { expenses } = useExpenses();
  const { entries } = useIncome();
  const { settings } = useSettingsContext();

  const aggregates = useMemo(
    () => buildAggregates(expenses, entries, settings.taxRate),
    [expenses, entries, settings.taxRate],
  );

  const chartData = aggregates.map((a) => ({
    name: a.label.slice(0, 7),
    'Нетто': a.netIncome,
    'Расходы': a.totalExpenses,
    'Прибыль': a.profit,
  }));

  return (
    <div className="page">
      <h1 className="page-title">Аналитика</h1>

      {aggregates.length === 0 ? (
        <div className="card"><p className="empty-text">Недостаточно данных. Добавьте доходы и расходы.</p></div>
      ) : (
        <>
          <div className="card">
            <h2 className="card-title">По месяцам</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={TICK_STYLE} />
                <YAxis tick={TICK_STYLE} tickFormatter={(v) => `${(v / 1000).toFixed(0)}к`} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Legend wrapperStyle={{ fontSize: 13, color: '#94a3b8' }} />
                <Bar dataKey="Нетто" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Расходы" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Прибыль" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <h2 className="card-title">Таблица по месяцам</h2>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Месяц</th>
                    <th>Доходы (брутто)</th>
                    <th>Налог</th>
                    <th>Нетто</th>
                    <th>Расходы</th>
                    <th>Прибыль/Убыток</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregates.map((a) => (
                    <tr key={a.month}>
                      <td><strong>{a.label}</strong></td>
                      <td className="amount-cell green">{formatCurrency(a.grossIncome)}</td>
                      <td className="amount-cell red">−{formatCurrency(a.taxAmount)}</td>
                      <td className="amount-cell accent">{formatCurrency(a.netIncome)}</td>
                      <td className="amount-cell red">−{formatCurrency(a.totalExpenses)}</td>
                      <td className={`amount-cell ${a.profit >= 0 ? 'green' : 'red'}`}>
                        {a.profit >= 0 ? '+' : ''}{formatCurrency(a.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
