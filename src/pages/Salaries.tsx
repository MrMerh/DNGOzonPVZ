import { useState, useMemo } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { useShifts } from '../hooks/useShifts';
import { useSchedule } from '../hooks/useSchedule';
import { format, isSameMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { calculateSalaryTaxes } from '../utils/taxCalculations';
import { EMPLOYMENT_LABELS } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { ChevronLeft, ChevronRight, Calculator } from 'lucide-react';
import SummaryCard from '../components/ui/SummaryCard';

export default function Salaries() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const { employees, loading: empsLoading } = useEmployees();
  const { shifts, loading: shiftsLoading } = useShifts();
  const { slots, loading: scheduleLoading } = useSchedule(selectedMonth);

  const loading = empsLoading || shiftsLoading || scheduleLoading;

  // Filter shifts for the selected month
  const monthShifts = useMemo(() => {
    return shifts.filter(s => isSameMonth(s.date, selectedMonth));
  }, [shifts, selectedMonth]);

  // Group data by employee
  const salaryData = useMemo(() => {
    return employees
      .filter(e => e.isActive || monthShifts.some(s => s.employeeId === e.id))
      .map(emp => {
        const empShifts = monthShifts.filter(s => s.employeeId === emp.id);

        const totalHours = empShifts.reduce((sum, s) => sum + (s.hours || 0), 0);
        const totalBonus = empShifts.reduce((sum, s) => sum + (s.bonus || 0), 0);
        const totalFine = empShifts.reduce((sum, s) => sum + (s.fine || 0), 0);
        
        const baseSalary = totalHours * (emp.hourlyRate || 0);
        const grossSalary = baseSalary + totalBonus - totalFine;
        
        const { tax, net, taxRate } = calculateSalaryTaxes(grossSalary, emp.employmentType || 'official');

        return {
          employee: emp,
          shiftsCount: empShifts.length,
          totalHours,
          totalBonus,
          totalFine,
          grossSalary,
          tax,
          net,
          taxRate,
          employmentLabel: EMPLOYMENT_LABELS[emp.employmentType || 'official']
        };
      })
      .filter(d => d.shiftsCount > 0)
      .sort((a, b) => b.net - a.net);
  }, [employees, monthShifts]);

  const totals = useMemo(() => {
    return salaryData.reduce((acc, d) => ({
      gross: acc.gross + d.grossSalary,
      tax: acc.tax + d.tax,
      net: acc.net + d.net,
      hours: acc.hours + d.totalHours,
      shifts: acc.shifts + d.shiftsCount
    }), { gross: 0, tax: 0, net: 0, hours: 0, shifts: 0 });
  }, [salaryData]);

  const changeMonth = (offset: number) => {
    const next = new Date(selectedMonth);
    next.setMonth(next.getMonth() + offset);
    setSelectedMonth(next);
  };

  if (loading) return <div className="loader">Загрузка данных...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Расчет зарплаты</h1>
        <div className="month-picker">
          <button className="icon-btn" onClick={() => changeMonth(-1)}>
            <ChevronLeft size={20} />
          </button>
          <span className="current-month">
            {format(selectedMonth, 'LLLL yyyy', { locale: ru })}
          </span>
          <button className="icon-btn" onClick={() => changeMonth(1)}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <SummaryCard 
          label="Всего к выплате (Net)" 
          value={formatCurrency(totals.net)} 
          accent="green"
          sub={`${totals.shifts} смен`}
        />
        <SummaryCard 
          label="Общий налог" 
          value={formatCurrency(totals.tax)} 
          accent="default"
        />
        <SummaryCard 
          label="ФОТ (Gross)" 
          value={formatCurrency(totals.gross)} 
          accent="blue"
        />
        <SummaryCard 
          label="Отработано часов" 
          value={`${Math.round(totals.hours)} ч.`} 
          accent="default"
        />
      </div>

      <div className="card mt-6">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Сотрудник</th>
                <th>Тип</th>
                <th>Смены</th>
                <th>Часы</th>
                <th>Ставка</th>
                <th>Бонусы / Штрафы</th>
                <th>Начислено</th>
                <th>Налог</th>
                <th>На руки</th>
              </tr>
            </thead>
            <tbody>
              {salaryData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-text">Нет данных за этот месяц</td>
                </tr>
              ) : salaryData.map((d) => (
                <tr key={d.employee.id}>
                  <td>
                    <div className="emp-cell">
                      <div className="emp-avatar-sm" style={{ background: 'var(--blue)' }}>
                        {d.employee.name.charAt(0)}
                      </div>
                      <div className="emp-names">
                        <span className="emp-name-main">{d.employee.name}</span>
                        <span className="emp-tg">@{d.employee.tgUsername}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-outline">{d.employmentLabel}</span>
                  </td>
                  <td className="text-center">{d.shiftsCount}</td>
                  <td className="text-center">{d.totalHours}</td>
                  <td className="text-right">{d.employee.hourlyRate} ₽</td>
                  <td className="text-right">
                    <span className="text-green">+{d.totalBonus}</span> / <span className="text-danger">-{d.totalFine}</span>
                  </td>
                  <td className="text-right font-medium">
                    {formatCurrency(d.grossSalary)}
                  </td>
                  <td className="text-right text-orange">
                    {formatCurrency(d.tax)}
                    <div className="text-xs">({d.taxRate * 100}%)</div>
                  </td>
                  <td className="text-right font-bold text-green">
                    {formatCurrency(d.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex gap-4 flex-wrap">
        <div className="card flex-1 min-w-[300px]">
          <h3 className="section-title flex items-center gap-2">
            <Calculator size={18} /> Примечание к расчету
          </h3>
          <ul className="list-disc pl-5 text-sm text-gray-400 space-y-1">
            <li><strong>ТК РФ / ГПХ:</strong> Налог 13% (НДФЛ) вычитается из общей суммы начислений.</li>
            <li><strong>Самозанятость:</strong> Налог 6% вычитается из суммы, так как оплата идет от юрлица/ИП.</li>
            <li><strong>Итоговая сумма:</strong> (Часы × Ставка) + Бонусы - Штрафы - Налоги.</li>
          </ul>
        </div>
      </div>

      <style>{`
        .month-picker {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: var(--card-bg);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }
        .current-month {
          font-weight: 600;
          text-transform: capitalize;
          min-width: 140px;
          text-align: center;
        }
        .emp-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .emp-avatar-sm {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.875rem;
        }
        .emp-names {
          display: flex;
          flex-direction: column;
        }
        .emp-name-main {
          font-weight: 500;
        }
        .emp-tg {
          font-size: 0.75rem;
          color: var(--text-dim);
        }
        .text-green { color: var(--green); }
        .text-danger { color: #ef4444; }
        .text-orange { color: var(--orange); }
        .font-medium { font-weight: 500; }
        .font-bold { font-weight: 700; }
        .mt-6 { margin-top: 1.5rem; }
        .flex { display: flex; }
        .gap-2 { gap: 0.5rem; }
        .gap-4 { gap: 1rem; }
        .items-center { align-items: center; }
        .flex-1 { flex: 1; }
        .min-w-\[300px\] { min-width: 300px; }
        .list-disc { list-style-type: disc; }
        .space-y-1 > * + * { margin-top: 0.25rem; }
      `}</style>
    </div>
  );
}
