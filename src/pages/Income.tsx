import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useIncome } from '../hooks/useIncome';
import { useSettingsContext } from '../context/SettingsContext';
import type { IncomeEntry } from '../types';
import Modal from '../components/ui/Modal';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateHelpers';
import { calcTax, calcNet } from '../utils/taxCalculations';
import { format } from 'date-fns';

interface EditState { date: string; amount: string; description: string; noTax: boolean; }

function toEditState(e: IncomeEntry): EditState {
  return {
    date: format(e.date, 'yyyy-MM-dd'),
    amount: String(e.amount),
    description: e.description,
    noTax: e.noTax ?? false,
  };
}

export default function Income() {
  const { entries, loading, addEntry, updateEntry, deleteEntry } = useIncome();
  const { settings } = useSettingsContext();
  const taxRate = settings.taxRate;

  const [editId, setEditId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState<EditState>({
    date: format(new Date(), 'yyyy-MM-dd'), amount: '', description: '', noTax: false,
  });

  function startEdit(e: IncomeEntry) { setEditId(e.id); setEditState(toEditState(e)); }

  async function saveEdit(id: string) {
    if (!editState) return;
    await updateEntry(id, {
      date: new Date(editState.date),
      amount: parseFloat(editState.amount),
      description: editState.description,
      noTax: editState.noTax,
    });
    setEditId(null); setEditState(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await addEntry({
      date: new Date(newForm.date),
      amount: parseFloat(newForm.amount),
      description: newForm.description,
      showNet: false,
      noTax: newForm.noTax,
    });
    setShowAdd(false);
    setNewForm({ date: format(new Date(), 'yyyy-MM-dd'), amount: '', description: '', noTax: false });
  }

  // Totals: only taxable entries count toward tax
  const totalGross = entries.reduce((s, e) => s + e.amount, 0);
  const totalTax = entries.reduce((s, e) => s + (e.noTax ? 0 : calcTax(e.amount, taxRate)), 0);
  const totalNet = totalGross - totalTax;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Доходы</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Добавить</button>
      </div>

      <div className="income-totals">
        <span>Брутто: <strong className="green">{formatCurrency(totalGross)}</strong></span>
        <span>Налог ({Math.round(taxRate * 100)}%): <strong className="red">{formatCurrency(totalTax)}</strong></span>
        <span>Нетто: <strong className="accent">{formatCurrency(totalNet)}</strong></span>
      </div>

      {loading ? <div className="loader">Загрузка...</div> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Описание</th>
                <th>Брутто</th>
                <th>Налог / Нетто</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr><td colSpan={5} className="empty-row">Нет данных. Добавьте первый доход.</td></tr>
              )}
              {entries.map((entry) =>
                editId === entry.id && editState ? (
                  <tr key={entry.id} className="editing-row">
                    <td><input className="input-sm" type="date" value={editState.date} onChange={(e) => setEditState({ ...editState, date: e.target.value })} /></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <input className="input-sm" type="text" value={editState.description} onChange={(e) => setEditState({ ...editState, description: e.target.value })} />
                        <label className="checkbox-label" style={{ fontSize: 12 }}>
                          <input type="checkbox" checked={editState.noTax} onChange={(e) => setEditState({ ...editState, noTax: e.target.checked })} />
                          Без налога
                        </label>
                      </div>
                    </td>
                    <td><input className="input-sm" type="number" value={editState.amount} onChange={(e) => setEditState({ ...editState, amount: e.target.value })} /></td>
                    <td>—</td>
                    <td className="row-actions">
                      <button className="icon-btn green" onClick={() => saveEdit(entry.id)}><Check size={15} /></button>
                      <button className="icon-btn" onClick={() => setEditId(null)}><X size={15} /></button>
                    </td>
                  </tr>
                ) : (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.date)}</td>
                    <td className="desc-cell">
                      {entry.description}
                      {entry.noTax && <span className="tag no-tax-tag">Без налога</span>}
                    </td>
                    <td className="amount-cell green">{formatCurrency(entry.amount)}</td>
                    <td>
                      {entry.noTax ? (
                        <span className="tag no-tax-tag">— налог не начисляется</span>
                      ) : (
                        <button
                          className={`tax-toggle${entry.showNet ? ' show-net' : ''}`}
                          onClick={() => updateEntry(entry.id, { showNet: !entry.showNet })}
                          title="Нажмите чтобы переключить вид"
                        >
                          {entry.showNet
                            ? <><span className="tag red">−{formatCurrency(calcTax(entry.amount, taxRate))}</span> → <span className="tag accent">{formatCurrency(calcNet(entry.amount, taxRate))}</span></>
                            : <span className="tag muted">Показать нетто</span>
                          }
                        </button>
                      )}
                    </td>
                    <td className="row-actions">
                      <button className="icon-btn" onClick={() => startEdit(entry)}><Pencil size={15} /></button>
                      <button className="icon-btn danger" onClick={() => deleteEntry(entry.id)}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal title="Новый доход" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="form-grid">
            <label className="field-label">Дата</label>
            <input className="input" type="date" required value={newForm.date}
              onChange={(e) => setNewForm({ ...newForm, date: e.target.value })} />

            <label className="field-label">Описание</label>
            <input className="input" type="text" placeholder="Источник дохода" value={newForm.description}
              onChange={(e) => setNewForm({ ...newForm, description: e.target.value })} />

            <label className="field-label">Сумма (₽)</label>
            <input className="input" type="number" required min="0" step="1" placeholder="0" value={newForm.amount}
              onChange={(e) => setNewForm({ ...newForm, amount: e.target.value })} />

            <label className="checkbox-label" style={{ marginTop: 4 }}>
              <input type="checkbox" checked={newForm.noTax}
                onChange={(e) => setNewForm({ ...newForm, noTax: e.target.checked })} />
              Без налога
            </label>
            {newForm.noTax && (
              <p className="no-tax-hint">Налог не будет начислен на эту запись и не войдёт в итог по налогам.</p>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>Добавить</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
