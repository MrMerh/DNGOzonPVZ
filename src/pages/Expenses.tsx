import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useExpenses } from '../hooks/useExpenses';
import type { Expense, ExpenseCategory } from '../types';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateHelpers';
import { format } from 'date-fns';

const CATEGORIES: ExpenseCategory[] = [
  'реклама', 'аренда', 'зарплата', 'оборудование', 'расходники', 'прочее',
];

interface EditState {
  date: string;
  category: ExpenseCategory;
  amount: string;
  description: string;
}

function toEditState(e: Expense): EditState {
  return {
    date: format(e.date, 'yyyy-MM-dd'),
    category: e.category,
    amount: String(e.amount),
    description: e.description,
  };
}

export default function Expenses() {
  const { expenses, loading, addExpense, updateExpense, deleteExpense } = useExpenses();
  const [editId, setEditId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState<EditState>({
    date: format(new Date(), 'yyyy-MM-dd'),
    category: 'прочее',
    amount: '',
    description: '',
  });

  function startEdit(e: Expense) {
    setEditId(e.id);
    setEditState(toEditState(e));
  }

  async function saveEdit(id: string) {
    if (!editState) return;
    await updateExpense(id, {
      date: new Date(editState.date),
      category: editState.category,
      amount: parseFloat(editState.amount),
      description: editState.description,
    });
    setEditId(null);
    setEditState(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await addExpense({
      date: new Date(newForm.date),
      category: newForm.category,
      amount: parseFloat(newForm.amount),
      description: newForm.description,
    });
    setShowAdd(false);
    setNewForm({ date: format(new Date(), 'yyyy-MM-dd'), category: 'прочее', amount: '', description: '' });
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Расходы</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Добавить
        </button>
      </div>

      <div className="table-meta">
        Итого: <strong>{formatCurrency(total)}</strong> · {expenses.length} записей
      </div>

      {loading ? (
        <div className="loader">Загрузка...</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Категория</th>
                <th>Сумма</th>
                <th>Описание</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 && (
                <tr><td colSpan={5} className="empty-row">Нет данных. Добавьте первый расход.</td></tr>
              )}
              {expenses.map((exp) =>
                editId === exp.id && editState ? (
                  <tr key={exp.id} className="editing-row">
                    <td>
                      <input className="input-sm" type="date" value={editState.date}
                        onChange={(e) => setEditState({ ...editState, date: e.target.value })} />
                    </td>
                    <td>
                      <select className="input-sm" value={editState.category}
                        onChange={(e) => setEditState({ ...editState, category: e.target.value as ExpenseCategory })}>
                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td>
                      <input className="input-sm" type="number" value={editState.amount}
                        onChange={(e) => setEditState({ ...editState, amount: e.target.value })} />
                    </td>
                    <td>
                      <input className="input-sm" type="text" value={editState.description}
                        onChange={(e) => setEditState({ ...editState, description: e.target.value })} />
                    </td>
                    <td className="row-actions">
                      <button className="icon-btn green" onClick={() => saveEdit(exp.id)}><Check size={15} /></button>
                      <button className="icon-btn" onClick={() => setEditId(null)}><X size={15} /></button>
                    </td>
                  </tr>
                ) : (
                  <tr key={exp.id}>
                    <td>{formatDate(exp.date)}</td>
                    <td><Badge category={exp.category} /></td>
                    <td className="amount-cell red">{formatCurrency(exp.amount)}</td>
                    <td className="desc-cell">{exp.description}</td>
                    <td className="row-actions">
                      <button className="icon-btn" onClick={() => startEdit(exp)}><Pencil size={15} /></button>
                      <button className="icon-btn danger" onClick={() => deleteExpense(exp.id)}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal title="Новый расход" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="form-grid">
            <label className="field-label">Дата</label>
            <input className="input" type="date" required value={newForm.date}
              onChange={(e) => setNewForm({ ...newForm, date: e.target.value })} />

            <label className="field-label">Категория</label>
            <select className="input" value={newForm.category}
              onChange={(e) => setNewForm({ ...newForm, category: e.target.value as ExpenseCategory })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>

            <label className="field-label">Сумма (₽)</label>
            <input className="input" type="number" required min="0" step="1" placeholder="0"
              value={newForm.amount}
              onChange={(e) => setNewForm({ ...newForm, amount: e.target.value })} />

            <label className="field-label">Описание</label>
            <input className="input" type="text" placeholder="Краткое описание"
              value={newForm.description}
              onChange={(e) => setNewForm({ ...newForm, description: e.target.value })} />

            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>Добавить</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
