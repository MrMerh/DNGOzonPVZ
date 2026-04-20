import { useState } from 'react';
import { Plus, RefreshCw, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useEmployees } from '../hooks/useEmployees';
import { usePVZPoints } from '../hooks/usePVZPoints';
import type { Employee, EmployeeRole, EmploymentType } from '../types';
import { ROLE_LABELS, ROLE_COLORS, EMPLOYMENT_LABELS } from '../types';
import Modal from '../components/ui/Modal';
import Barcode from '../components/ui/Barcode';

interface FormState {
  name: string;
  tgUsername: string;
  primaryPvzId: string;
  role: EmployeeRole;
  employmentType: EmploymentType;
  hourlyRate: string;
}

const EMPTY_FORM: FormState = {
  name: '', tgUsername: '', primaryPvzId: '',
  role: 'employee', employmentType: 'official', hourlyRate: '',
};

const ROLES: EmployeeRole[] = ['owner', 'manager', 'employee'];
const EMPLOYMENT_TYPES: EmploymentType[] = ['official', 'gph', 'self_employed'];

export default function Employees() {
  const { employees, loading, addEmployee, updateEmployee, regenCode, deleteEmployee } = useEmployees();
  const { activePoints } = usePVZPoints();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [showBarcodeFor, setShowBarcodeFor] = useState<string | null>(null);

  function toFormState(e: Employee): FormState {
    return {
      name: e.name, tgUsername: e.tgUsername,
      primaryPvzId: e.primaryPvzId,
      role: e.role ?? 'employee',
      employmentType: e.employmentType ?? 'official',
      hourlyRate: String(e.hourlyRate ?? 0),
    };
  }

  async function handleAdd(ev: React.FormEvent) {
    ev.preventDefault();
    await addEmployee({
      name: form.name,
      tgUsername: form.tgUsername,
      primaryPvzId: form.primaryPvzId,
      role: form.role,
      employmentType: form.employmentType,
      hourlyRate: parseFloat(form.hourlyRate) || 0,
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
      role: editForm.role,
      employmentType: editForm.employmentType,
      hourlyRate: parseFloat(editForm.hourlyRate) || 0,
    });
    setEditId(null);
  }

  async function togglePvzAccess(emp: Employee, pvzId: string) {
    const has = emp.pvzAccess.includes(pvzId);
    const next = has
      ? emp.pvzAccess.filter((id) => id !== pvzId)
      : [...emp.pvzAccess, pvzId];
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
            <div className="card">
              <p className="empty-text">Сотрудников пока нет. Добавьте первого.</p>
            </div>
          )}

          {employees.map((emp) => (
            <div key={emp.id} className={`emp-card${!emp.isActive ? ' inactive' : ''}`}>
              <div className="emp-card-header">
                <div className="emp-info">
                  <div
                    className="emp-avatar"
                    style={{ background: ROLE_COLORS[emp.role ?? 'employee'] }}
                  >
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    {editId === emp.id ? (
                      <div className="emp-edit-row">
                        <input className="input-sm" value={editForm.name} placeholder="ФИО"
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                        <input className="input-sm" value={editForm.tgUsername} placeholder="@username"
                          onChange={(e) => setEditForm({ ...editForm, tgUsername: e.target.value })} />
                        <select className="input-sm" value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value as EmployeeRole })}>
                          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                        <select className="input-sm" value={editForm.employmentType}
                          onChange={(e) => setEditForm({ ...editForm, employmentType: e.target.value as EmploymentType })}>
                          {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{EMPLOYMENT_LABELS[t]}</option>)}
                        </select>
                        <input className="input-sm" type="number" value={editForm.hourlyRate}
                          placeholder="₽/час"
                          onChange={(e) => setEditForm({ ...editForm, hourlyRate: e.target.value })} />
                        <select className="input-sm" value={editForm.primaryPvzId}
                          onChange={(e) => setEditForm({ ...editForm, primaryPvzId: e.target.value })}>
                          <option value="">— ПВЗ —</option>
                          {activePoints.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    ) : (
                      <>
                        <div className="emp-name-row">
                          <span className="emp-name">{emp.name}</span>
                          <span
                            className="role-badge"
                            style={{
                              background: `${ROLE_COLORS[emp.role ?? 'employee']}22`,
                              color: ROLE_COLORS[emp.role ?? 'employee'],
                              borderColor: `${ROLE_COLORS[emp.role ?? 'employee']}44`,
                            }}
                          >
                            {ROLE_LABELS[emp.role ?? 'employee']}
                          </span>
                          <span className="badge badge-outline ml-2">
                            {EMPLOYMENT_LABELS[emp.employmentType ?? 'official']}
                          </span>
                        </div>
                        <div className="emp-meta">
                          {emp.tgUsername && <span>@{emp.tgUsername}</span>}
                          {emp.primaryPvzId && <span>· {pvzName(emp.primaryPvzId)}</span>}
                          {emp.hourlyRate > 0 && (
                            <span>· <strong style={{ color: 'var(--green)' }}>{emp.hourlyRate} ₽/час</strong></span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="emp-actions">
                  {editId === emp.id ? (
                    <>
                      <button className="icon-btn green" onClick={() => handleSaveEdit(emp.id)}>
                        <Check size={15} />
                      </button>
                      <button className="icon-btn" onClick={() => setEditId(null)}>
                        <X size={15} />
                      </button>
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
                        {emp.isActive
                          ? <ToggleRight size={18} style={{ color: 'var(--green)' }} />
                          : <ToggleLeft size={18} />
                        }
                      </button>
                      <button className="icon-btn danger" title="Удалить"
                        onClick={() => deleteEmployee(emp.id)}>
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="emp-card-body">
                <div className="emp-code-row">
                  <span className="field-label">Код Mini App:</span>
                  <code className={`access-code${emp.codeUsed ? ' used' : ''}`}>
                    {emp.accessCode}
                  </code>
                  <span className="code-status">
                    {emp.codeUsed ? '● Использован' : '○ Не использован'}
                  </span>
                  <button className="icon-btn" title="Новый код" onClick={() => regenCode(emp.id)}>
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

                <div className="barcode-row">
                  <button
                    className="barcode-toggle-btn"
                    onClick={() => setShowBarcodeFor(showBarcodeFor === emp.id ? null : emp.id)}
                  >
                    <span>Штрихкод</span>
                    {showBarcodeFor === emp.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  {showBarcodeFor === emp.id && (
                    <div className="barcode-card">
                      <div className="barcode-name">{emp.name}</div>
                      <Barcode value={emp.id} height={56} width={1.4} />
                      <div className="barcode-id">{emp.id}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Новый сотрудник" onClose={() => { setShowAdd(false); setForm(EMPTY_FORM); }}>
          <form onSubmit={handleAdd} className="form-grid">
            <label className="field-label">ФИО *</label>
            <input className="input" required placeholder="Иванов Иван Иванович"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

            <label className="field-label">Telegram username</label>
            <input className="input" placeholder="username (без @)"
              value={form.tgUsername} onChange={(e) => setForm({ ...form, tgUsername: e.target.value })} />

            <label className="field-label">Роль</label>
            <select className="input" value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as EmployeeRole })}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>

            <label className="field-label">Почасовая ставка (₽/час)</label>
            <input className="input" type="number" min="0" step="10" placeholder="250"
              value={form.hourlyRate}
              onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />

            <label className="field-label">Тип трудоустройства</label>
            <select className="input" value={form.employmentType}
              onChange={(e) => setForm({ ...form, employmentType: e.target.value as EmploymentType })}>
              {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{EMPLOYMENT_LABELS[t]}</option>)}
            </select>

            <label className="field-label">Основная ТТ</label>
            <select className="input" value={form.primaryPvzId}
              onChange={(e) => setForm({ ...form, primaryPvzId: e.target.value })}>
              <option value="">— Выберите точку —</option>
              {activePoints.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
              Создать сотрудника
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
