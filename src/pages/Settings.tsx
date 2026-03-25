import { useState, useEffect } from 'react';
import { useSettingsContext } from '../context/SettingsContext';
import { formatCurrency } from '../utils/formatCurrency';

const TAX_PRESETS = [
  { label: '4% — НПД', value: 0.04 },
  { label: '6% — УСН', value: 0.06 },
  { label: '15% — УСН доходы−расходы', value: 0.15 },
  { label: '20% — ОСНО', value: 0.20 },
];

export default function Settings() {
  const { settings, loading, updateSettings } = useSettingsContext();
  const [taxRate, setTaxRate] = useState('');
  const [breakeven, setBreakeven] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading) {
      setTaxRate(String(Math.round(settings.taxRate * 100)));
      setBreakeven(String(settings.breakevenTarget));
    }
  }, [loading, settings]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const rate = parseFloat(taxRate) / 100;
    const target = parseInt(breakeven, 10);
    if (isNaN(rate) || isNaN(target)) return;
    await updateSettings({ taxRate: rate, breakevenTarget: target });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="page">
      <h1 className="page-title">Настройки</h1>

      <div className="card" style={{ maxWidth: 480 }}>
        <h2 className="card-title">Налог и финансы</h2>

        <form onSubmit={handleSave} className="settings-form">
          <label className="field-label">Ставка налога</label>
          <div className="preset-grid">
            {TAX_PRESETS.map((p) => (
              <button
                type="button"
                key={p.value}
                className={`preset-btn${Math.abs(settings.taxRate - p.value) < 0.001 ? ' active' : ''}`}
                onClick={() => setTaxRate(String(Math.round(p.value * 100)))}
              >
                {p.label}
              </button>
            ))}
          </div>

          <label className="field-label" style={{ marginTop: 16 }}>
            Произвольная ставка (%)
          </label>
          <input
            className="input"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
          />

          <label className="field-label" style={{ marginTop: 16 }}>
            Цель точки безубыточности в месяц (₽)
          </label>
          <input
            className="input"
            type="number"
            min="0"
            step="1000"
            value={breakeven}
            onChange={(e) => setBreakeven(e.target.value)}
            placeholder="100000"
          />
          {breakeven && (
            <p className="field-hint">
              Цель: {formatCurrency(parseInt(breakeven, 10) || 0)}
            </p>
          )}

          <button type="submit" className="btn btn-primary" style={{ marginTop: 24 }}>
            {saved ? '✓ Сохранено' : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  );
}
