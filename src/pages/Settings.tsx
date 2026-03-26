import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useSettingsContext } from '../context/SettingsContext';
import { usePVZPoints } from '../hooks/usePVZPoints';
import type { PVZPoint } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

type Tab = 'finance' | 'pvz';

const TAX_PRESETS = [
  { label: '4% — НПД', value: 0.04 },
  { label: '6% — УСН', value: 0.06 },
  { label: '15% — УСН д−р', value: 0.15 },
  { label: '20% — ОСНО', value: 0.20 },
];

interface PvzForm { name: string; address: string; }
const EMPTY_PVZ: PvzForm = { name: '', address: '' };

export default function Settings() {
  const { settings, loading, updateSettings } = useSettingsContext();
  const { points, addPoint, updatePoint, deletePoint } = usePVZPoints();

  const [tab, setTab] = useState<Tab>('finance');
  const [taxRate, setTaxRate] = useState('');
  const [breakeven, setBreakeven] = useState('');
  const [saved, setSaved] = useState(false);

  // PVZ editing state
  const [showAddPvz, setShowAddPvz] = useState(false);
  const [pvzForm, setPvzForm] = useState<PvzForm>(EMPTY_PVZ);
  const [editPvzId, setEditPvzId] = useState<string | null>(null);
  const [editPvzForm, setEditPvzForm] = useState<PvzForm>(EMPTY_PVZ);

  useEffect(() => {
    if (!loading) {
      setTaxRate(String(Math.round(settings.taxRate * 100)));
      setBreakeven(String(settings.breakevenTarget));
    }
  }, [loading, settings]);

  async function handleSaveFinance(e: React.FormEvent) {
    e.preventDefault();
    const rate = parseFloat(taxRate) / 100;
    const target = parseInt(breakeven, 10);
    if (isNaN(rate) || isNaN(target)) return;
    await updateSettings({ taxRate: rate, breakevenTarget: target });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleAddPvz(e: React.FormEvent) {
    e.preventDefault();
    await addPoint({ name: pvzForm.name, address: pvzForm.address, isActive: true });
    setShowAddPvz(false);
    setPvzForm(EMPTY_PVZ);
  }

  async function handleSavePvz(p: PVZPoint) {
    await updatePoint(p.id, { name: editPvzForm.name, address: editPvzForm.address });
    setEditPvzId(null);
  }

  return (
    <div className="page">
      <h1 className="page-title">Настройки</h1>

      <div className="tabs">
        <button className={`tab-btn${tab === 'finance' ? ' active' : ''}`} onClick={() => setTab('finance')}>
          Налог и финансы
        </button>
        <button className={`tab-btn${tab === 'pvz' ? ' active' : ''}`} onClick={() => setTab('pvz')}>
          ПВЗ точки
        </button>
      </div>

      {tab === 'finance' && (
        <div className="card" style={{ maxWidth: 480, marginTop: 20 }}>
          <form onSubmit={handleSaveFinance} className="settings-form">
            <label className="field-label">Ставка налога</label>
            <div className="preset-grid">
              {TAX_PRESETS.map((p) => (
                <button type="button" key={p.value}
                  className={`preset-btn${Math.abs(settings.taxRate - p.value) < 0.001 ? ' active' : ''}`}
                  onClick={() => setTaxRate(String(Math.round(p.value * 100)))}>
                  {p.label}
                </button>
              ))}
            </div>
            <label className="field-label" style={{ marginTop: 16 }}>Произвольная ставка (%)</label>
            <input className="input" type="number" min="0" max="100" step="0.1"
              value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />

            <label className="field-label" style={{ marginTop: 16 }}>Цель безубыточности (₽/мес)</label>
            <input className="input" type="number" min="0" step="1000" placeholder="100000"
              value={breakeven} onChange={(e) => setBreakeven(e.target.value)} />
            {breakeven && (
              <p className="field-hint">Цель: {formatCurrency(parseInt(breakeven, 10) || 0)}</p>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: 24 }}>
              {saved ? '✓ Сохранено' : 'Сохранить'}
            </button>
          </form>
        </div>
      )}

      {tab === 'pvz' && (
        <div style={{ marginTop: 20 }}>
          <div className="page-header" style={{ marginBottom: 12 }}>
            <span style={{ color: 'var(--text2)', fontSize: 13 }}>{points.length} точек</span>
            <button className="btn btn-primary" onClick={() => setShowAddPvz(true)}>
              <Plus size={15} /> Добавить точку
            </button>
          </div>

          {showAddPvz && (
            <form onSubmit={handleAddPvz} className="pvz-add-form">
              <input className="input-sm" required placeholder="Название (напр. ПВЗ Центр)"
                value={pvzForm.name} onChange={(e) => setPvzForm({ ...pvzForm, name: e.target.value })} />
              <input className="input-sm" placeholder="Адрес"
                value={pvzForm.address} onChange={(e) => setPvzForm({ ...pvzForm, address: e.target.value })} />
              <button type="submit" className="icon-btn green"><Check size={15} /></button>
              <button type="button" className="icon-btn" onClick={() => { setShowAddPvz(false); setPvzForm(EMPTY_PVZ); }}>
                <X size={15} />
              </button>
            </form>
          )}

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Название</th><th>Адрес</th><th>Статус</th><th></th></tr>
              </thead>
              <tbody>
                {points.length === 0 && (
                  <tr><td colSpan={4} className="empty-row">Нет точек. Добавьте первую ПВЗ.</td></tr>
                )}
                {points.map((p) => (
                  editPvzId === p.id ? (
                    <tr key={p.id} className="editing-row">
                      <td><input className="input-sm" value={editPvzForm.name}
                        onChange={(e) => setEditPvzForm({ ...editPvzForm, name: e.target.value })} /></td>
                      <td><input className="input-sm" value={editPvzForm.address}
                        onChange={(e) => setEditPvzForm({ ...editPvzForm, address: e.target.value })} /></td>
                      <td>—</td>
                      <td className="row-actions">
                        <button className="icon-btn green" onClick={() => handleSavePvz(p)}><Check size={14} /></button>
                        <button className="icon-btn" onClick={() => setEditPvzId(null)}><X size={14} /></button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td className="desc-cell">{p.address || '—'}</td>
                      <td>
                        <button
                          className={`preset-btn${p.isActive ? ' active' : ''}`}
                          style={{ padding: '2px 10px', fontSize: 12 }}
                          onClick={() => updatePoint(p.id, { isActive: !p.isActive })}
                        >
                          {p.isActive ? 'Активна' : 'Неактивна'}
                        </button>
                      </td>
                      <td className="row-actions">
                        <button className="icon-btn"
                          onClick={() => { setEditPvzId(p.id); setEditPvzForm({ name: p.name, address: p.address }); }}>
                          <Pencil size={14} />
                        </button>
                        <button className="icon-btn danger" onClick={() => deletePoint(p.id)}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
