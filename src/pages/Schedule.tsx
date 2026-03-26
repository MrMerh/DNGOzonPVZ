import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { addDays, startOfDay, format, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useSchedule } from '../hooks/useSchedule';
import { useEmployees } from '../hooks/useEmployees';
import { usePVZPoints } from '../hooks/usePVZPoints';
import type { ScheduleSlot } from '../types';
import Modal from '../components/ui/Modal';

const DAYS = 14;

function getDates(): Date[] {
  const today = startOfDay(new Date());
  return Array.from({ length: DAYS }, (_, i) => addDays(today, i));
}

function dateKey(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

interface AddSlotForm { employeeId: string; pvzId: string; }

export default function Schedule() {
  const { slots, loading, addSlot, deleteSlot } = useSchedule(DAYS);
  const { activeEmployees } = useEmployees();
  const { activePoints } = usePVZPoints();

  const [addFor, setAddFor] = useState<{ empId: string; date: Date } | null>(null);
  const [addForm, setAddForm] = useState<AddSlotForm>({ employeeId: '', pvzId: '' });

  const dates = getDates();

  // Map: employeeId → dateKey → slot
  const slotMap = new Map<string, Map<string, ScheduleSlot>>();
  slots.forEach((s) => {
    if (!slotMap.has(s.employeeId)) slotMap.set(s.employeeId, new Map());
    slotMap.get(s.employeeId)!.set(dateKey(s.date), s);
  });

  async function handleAddSlot(ev: React.FormEvent) {
    ev.preventDefault();
    if (!addFor) return;
    await addSlot({
      employeeId: addFor.empId,
      pvzId: addForm.pvzId,
      date: addFor.date,
      confirmed: true,
      requestedByEmp: false,
    });
    setAddFor(null);
  }

  const pvzName = (id: string) => activePoints.find((p) => p.id === id)?.name ?? '—';

  if (loading) return <div className="page"><div className="loader">Загрузка...</div></div>;

  if (activeEmployees.length === 0) {
    return (
      <div className="page">
        <h1 className="page-title">График смен</h1>
        <div className="card"><p className="empty-text">Сначала добавьте сотрудников и ПВЗ точки.</p></div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">График смен <span className="page-title-sub">14 дней вперёд</span></h1>

      <div className="schedule-wrap">
        <table className="schedule-table">
          <thead>
            <tr>
              <th className="emp-col">Сотрудник</th>
              {dates.map((d) => (
                <th key={dateKey(d)} className={isToday(d) ? 'today-col' : ''}>
                  <div className="date-head">
                    <span className="date-day">{format(d, 'EEE', { locale: ru })}</span>
                    <span className="date-num">{format(d, 'd MMM', { locale: ru })}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeEmployees.map((emp) => (
              <tr key={emp.id}>
                <td className="emp-col">
                  <div className="sched-emp-name">{emp.name.split(' ')[0]}</div>
                  <div className="sched-emp-sub">{emp.name.split(' ')[1] ?? ''}</div>
                </td>
                {dates.map((d) => {
                  const slot = slotMap.get(emp.id)?.get(dateKey(d));
                  return (
                    <td key={dateKey(d)} className={`slot-cell${isToday(d) ? ' today-col' : ''}`}>
                      {slot ? (
                        <div className="slot-filled">
                          <span className="slot-pvz">{pvzName(slot.pvzId)}</span>
                          <button className="slot-del" onClick={() => deleteSlot(slot.id)}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="slot-add"
                          onClick={() => {
                            setAddFor({ empId: emp.id, date: d });
                            setAddForm({ employeeId: emp.id, pvzId: activePoints[0]?.id ?? '' });
                          }}
                        >
                          <Plus size={12} />
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addFor && (
        <Modal
          title={`Смена — ${format(addFor.date, 'd MMMM', { locale: ru })}`}
          onClose={() => setAddFor(null)}
        >
          <form onSubmit={handleAddSlot} className="form-grid">
            <label className="field-label">Сотрудник</label>
            <input className="input" disabled
              value={activeEmployees.find((e) => e.id === addFor.empId)?.name ?? ''} />

            <label className="field-label">ПВЗ точка</label>
            <select className="input" required value={addForm.pvzId}
              onChange={(e) => setAddForm({ ...addForm, pvzId: e.target.value })}>
              <option value="">— Выберите точку —</option>
              {activePoints.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
              Добавить смену
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
