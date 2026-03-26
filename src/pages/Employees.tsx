import { useState } from 'react';
import { Plus, RefreshCw, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { useEmployees } from '../hooks/useEmployees';
import { usePVZPoints } from '../hooks/usePVZPoints';
import type { Employee } from '../types';
import Modal from '../components/ui/Modal';
import { formatCurrency } from '../utils/formatCurrency';

interface FormState {
  name: string;
  tgUsername: string;
  primaryPvzId: string;
  salary: string;
}

const EMPTY_FORM: FormState = { name: '', tgUsername: '', primaryPvzId: '', salary: '' };

export default function Employees() {
  const { employees, loading, addEmployee, updateEmployee, regenCode, deleteEmployee } = useEmployees();
  const { activePoints } = usePVZPoints();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toFormState(e: Employee): FormState {
    return { name: e.name, tgUsername: e.tgUsername, primaryPvzId: e.primaryPvzId, salary: String(e.salary) };
  }

  async function handleAdd(ev: React.FormEvent) {
    ev.preventDefault();
    await addEmployee({
      name: form.name,
      tgUsername: form.tgUsername,
      primaryPvzId: form.primaryPvzId,
      salary: parseFloat(form.salary) || 0,
      isActive: true,
      pvzAccess: form.primaryPvzId ? [form.primaryPvzId] : [],
    });
    setShowAdd(false);
    setForm(EMPTY_FORM);
  }

  async function handleSaveEdit(id: string) {
    await updateEmployee(id, {
      name: editForm.name,
      tgUsername: editForm.tgUsername,
      primaryPvzId: editForm.primaryPvzId,
      salary: parseFloat(editForm.salary) || 0,
    });
    setEditId(null);
  }

  async function togglePvzAccess(emp: Employee, pvzId: string) {
    const has = emp.pvzAccess.includes(pvzId);
    const next = has ? emp.pvzAccess.filter((id) => id !== pvzId) : [...emp.pvzAccess, pvzId];
    await updateEmployee(emp.id, { pvzAccess: next });
  }

  const pvzName = (id: string) => activePoints.find((p) => p.id === id)?.name ?? id;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Сотрудники</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Добавить
        </button>
      </div>

      {loading ? <div className="loader">Загрузка...</div> : (
        <div className="employees-list">
          {employees.length === 0 && (
            <div className="card"><p className="empty-text">Сотрудников пока нет. Добавьте первого.</p></div>
          )}
          {employees.map((emp) => (
            <div key={emp.id} className={`emp-card${!emp.isActive ? ' inactive' : ''}`}>
              <div className="emp-card-header">
                <div className="emp-info">
                  <div className="emp-avatar">{emp.name.charAt(0).toUpperCase()}</div>
                  <div>
                    {editId === emp.id ? (
                      <div className="emp-edit-row">
                        <input className="input-sm" value={editForm.name} placeholder="ФИО"
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                        <input className="input-sm" value={editForm.tgUsername} placeholder="@username"
                          onChange={(e) => setEditForm({ ...editForm, tgUsername: e.target.value })} />
                        <input className="input-sm" type="number" value={editForm.salary} placeholder="Ставка"
                          onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })} />
                        <select className="input-sm" value={editForm.primaryPvzId}
                          onChange={(e) => setEditForm({ ...editForm, primaryPvzId: e.target.value })}>
                          <option value="">— ПВЗ —</option>
                          {activePoints.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    ) : (
                      <>
                        <div className="emp-name">{emp.name}</div>
                        <div className="emp-meta">
                          {emp.tgUsername && <span>@{emp.tgUsername}</span>}
                          {emp.primaryPvzId && <span>· {pvzName(emp.primaryPvzId)}</span>}
                          <span>· {formatCurrency(emp.salary)}/мес</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="emp-actions">
                  {editId === emp.id ? (
                    <>
                      <button className="icon-btn green" onClick={() => handleSaveEdit(emp.id)}><Check size={15} /></button>
                      <button className="icon-btn" onClick={() => setEditId(null)}><X size={15} /></button>
                    </>
                  ) : (
                    <>
                      <button className="icon-btn" title="Редактировать"
                        onClick={() => { setEditId(emp.id); setEditForm(toFormState(emp)); }}>
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-btn"
                        title={emp.isActive ? 'Деактивировать' : 'Активировать'}
                        onClick={() => updateEmployee(emp.id, { isActive: !emp.isActive })}
                      >
                        {emp.isActive ? <ToggleRight size={18} style={{ color: 'var(--green)' }} /> : <ToggleLeft size={18} />}
                      </button>
                      <button className="icon-btn danger" title="Удалить" onClick={() => deleteEmployee(emp.id)}>
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Code + PVZ access */}
              <div className="emp-card-body">
                <div className="emp-code-row">
                  <span className="field-label">Код доступа Mini App:</span>
                  <code className={`access-code${emp.codeUsed ? ' used' : ''}`}>{emp.accessCode}</code>
                  <span className="code-status">{emp.codeUsed ? '● Использован' : '○ Не использован'}</span>
                  <button className="icon-btn" title="Перегенерировать код" onClick={() => regenCode(emp.id)}>
                    <RefreshCw size={13} />
                  </button>
                </div>

                {activePoints.length > 0 && (
                  <div className="pvz-access-row">
                    <span className="field-label">Доступ к ТТ:</span>
                    <div className="pvz-toggles">
                      {activePoints.map((p) => (
                        <button
                          key={p.id}
                          className={`pvz-toggle-btn${emp.pvzAccess.includes(p.id) ? ' on' : ''}`}
                          onClick={() => togglePvzAccess(emp, p.id)}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  className="expand-btn"
                  onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
                >
                  {expandedId === emp.id ? '▲ Скрыть' : '▼ Статистика'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Новый сотрудник" onClose={() => { setShowAdd(false); setForm(EMPTY_FORM); }}>
          <form onSubmit={handleAdd} className="form-grid">
            <label className="field-label">ФИО</label>
            <input className="input" required placeholder="Иванов Иван Иванович"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

            <label className="field-label">Telegram username</label>
            <input className="input" placeholder="username (без @)"
              value={form.tgUsername} onChange={(e) => setForm({ ...form, tgUsername: e.target.value })} />

            <label className="field-label">Основная ТТ</label>
            <select className="input" value={form.primaryPvzId}
              onChange={(e) => setForm({ ...form, primaryPvzId: e.target.value })}>
              <option value="">— Выберите точку —</option>
              {activePoints.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <label className="field-label">Ставка (₽/мес)</label>
            <input className="input" type="number" min="0" step="500" placeholder="30000"
              value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />

            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
              Создать сотрудника
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
