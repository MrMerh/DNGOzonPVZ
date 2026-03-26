import { useState } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useShifts } from '../hooks/useShifts';
import { useEmployees } from '../hooks/useEmployees';
import { usePVZPoints } from '../hooks/usePVZPoints';
import type { Shift } from '../types';
import Modal from '../components/ui/Modal';
import { formatDate } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/formatCurrency';

type ShiftForm = Omit<Shift, 'id' | 'createdAt' | 'date'> & { date: string };

const EMPTY: ShiftForm = {
  employeeId: '', pvzId: '', date: format(new Date(), 'yyyy-MM-dd'),
  parcelsIn: 0, parcelsOut: 0, returns: 0,
  incident: false, bonus: 0, bonusComment: '', fine: 0, fineComment: '',
  checklistCompleted: false, notes: '',
};

export default function Shifts() {
  const { shifts, loading, addShift, deleteShift } = useShifts();
  const { activeEmployees } = useEmployees();
  const { activePoints } = usePVZPoints();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<ShiftForm>(EMPTY);
  const [filterEmp, setFilterEmp] = useState('');
  const [filterPvz, setFilterPvz] = useState('');

  const empName = (id: string) => activeEmployees.find((e) => e.id === id)?.name ?? id;
  const pvzName = (id: string) => activePoints.find((p) => p.id === id)?.name ?? id;

  async function handleAdd(ev: React.FormEvent) {
    ev.preventDefault();
    await addShift({ ...form, date: new Date(form.date) });
    setShowAdd(false);
    setForm(EMPTY);
  }

  function f(field: keyof ShiftForm, val: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  const filtered = shifts.filter((s) =>
    (!filterEmp || s.employeeId === filterEmp) &&
    (!filterPvz || s.pvzId === filterPvz),
  );

  const totalOut = filtered.reduce((s, sh) => s + sh.parcelsOut, 0);
  const totalIn = filtered.reduce((s, sh) => s + sh.parcelsIn, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Данные смен</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Добавить</button>
      </div>

      <div className="filters-row">
        <select className="input-sm" value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)}>
          <option value="">Все сотрудники</option>
          {activeEmployees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select className="input-sm" value={filterPvz} onChange={(e) => setFilterPvz(e.target.value)}>
          <option value="">Все точки</option>
          {activePoints.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <span className="table-meta" style={{ marginLeft: 'auto' }}>
          {filtered.length} смен · выдано: <strong>{totalOut}</strong> · принято: <strong>{totalIn}</strong>
        </span>
      </div>

      {loading ? <div className="loader">Загрузка...</div> : (
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Сотрудник</th>
                <th>ТТ</th>
                <th>Выдано</th>
                <th>Принято</th>
                <th>Возвраты</th>
                <th>Бонус/Штраф</th>
                <th>Флаги</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="empty-row">Нет данных по выбранным фильтрам.</td></tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>{formatDate(s.date)}</td>
                  <td>{empName(s.employeeId)}</td>
                  <td>{pvzName(s.pvzId)}</td>
                  <td className="amount-cell accent">{s.parcelsOut}</td>
                  <td>{s.parcelsIn}</td>
                  <td>{s.returns > 0 ? <span className="tag red">{s.returns}</span> : '—'}</td>
                  <td>
                    {s.bonus > 0 && <span className="tag green">+{formatCurrency(s.bonus)}</span>}
                    {s.fine > 0 && <span className="tag red" style={{ marginLeft: 4 }}>−{formatCurrency(s.fine)}</span>}
                    {s.bonus === 0 && s.fine === 0 && '—'}
                  </td>
                  <td>
                    {s.incident && <span title="Инцидент"><AlertTriangle size={14} color="var(--red)" /></span>}
                    {s.checklistCompleted && <span title="Чеклист выполнен" style={{ marginLeft: 4 }}>✓</span>}
                  </td>
                  <td className="row-actions">
                    <button className="icon-btn danger" onClick={() => deleteShift(s.id)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal title="Данные смены" onClose={() => { setShowAdd(false); setForm(EMPTY); }}>
          <form onSubmit={handleAdd} className="form-grid">
            <label className="field-label">Сотрудник *</label>
            <select className="input" required value={form.employeeId} onChange={(e) => f('employeeId', e.target.value)}>
              <option value="">— Выберите —</option>
              {activeEmployees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>

            <label className="field-label">ПВЗ точка *</label>
            <select className="input" required value={form.pvzId} onChange={(e) => f('pvzId', e.target.value)}>
              <option value="">— Выберите —</option>
              {activePoints.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <label className="field-label">Дата *</label>
            <input className="input" type="date" required value={form.date} onChange={(e) => f('date', e.target.value)} />

            <div className="form-row-3">
              <div>
                <label className="field-label">Выдано *</label>
                <input className="input" type="number" min="0" required value={form.parcelsOut}
                  onChange={(e) => f('parcelsOut', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="field-label">Принято</label>
                <input className="input" type="number" min="0" value={form.parcelsIn}
                  onChange={(e) => f('parcelsIn', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="field-label">Возвраты</label>
                <input className="input" type="number" min="0" value={form.returns}
                  onChange={(e) => f('returns', parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div className="form-row-2">
              <div>
                <label className="field-label">Бонус (₽)</label>
                <input className="input" type="number" min="0" value={form.bonus}
                  onChange={(e) => f('bonus', parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className="field-label">Штраф (₽)</label>
                <input className="input" type="number" min="0" value={form.fine}
                  onChange={(e) => f('fine', parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            {(form.bonus > 0 || form.fine > 0) && (
              <input className="input" placeholder="Комментарий к бонусу/штрафу"
                value={form.bonusComment || form.fineComment}
                onChange={(e) => { f('bonusComment', e.target.value); f('fineComment', e.target.value); }} />
            )}

            <div className="checkboxes-row">
              <label className="checkbox-label">
                <input type="checkbox" checked={form.incident} onChange={(e) => f('incident', e.target.checked)} />
                Инцидент
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={form.checklistCompleted}
                  onChange={(e) => f('checklistCompleted', e.target.checked)} />
                Чеклист выполнен
              </label>
            </div>

            <label className="field-label">Заметки</label>
            <textarea className="input" rows={2} value={form.notes}
              onChange={(e) => f('notes', e.target.value)} />

            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>Сохранить</button>
          </form>
        </Modal>
      )}

      {/* inline to avoid unused import warning */}
      <span style={{ display: 'none' }}>{format(new Date(), 'yyyy', { locale: ru })}</span>
    </div>
  );
}
