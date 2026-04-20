import { useState } from 'react';
import {
  Plus, Trash2, Pencil, X,
  GripVertical, ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useChecklists } from '../hooks/useChecklists';
import { usePVZPoints } from '../hooks/usePVZPoints';

import Modal from '../components/ui/Modal';

interface ItemDraft {
  text: string;
}

interface FormState {
  title: string;
  description: string;
  items: ItemDraft[];
  pvzIds: string[];
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  items: [{ text: '' }],
  pvzIds: [],
};

export default function Checklists() {
  const { checklists, loading, addChecklist, updateChecklist, deleteChecklist } = useChecklists();
  const { activePoints } = usePVZPoints();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);

  function addItem(f: FormState, setF: (v: FormState) => void) {
    setF({ ...f, items: [...f.items, { text: '' }] });
  }

  function removeItem(f: FormState, setF: (v: FormState) => void, idx: number) {
    if (f.items.length <= 1) return;
    setF({ ...f, items: f.items.filter((_, i) => i !== idx) });
  }

  function updateItem(f: FormState, setF: (v: FormState) => void, idx: number, text: string) {
    const items = [...f.items];
    items[idx] = { text };
    setF({ ...f, items });
  }

  function togglePvz(f: FormState, setF: (v: FormState) => void, pvzId: string) {
    const has = f.pvzIds.includes(pvzId);
    setF({
      ...f,
      pvzIds: has ? f.pvzIds.filter((id) => id !== pvzId) : [...f.pvzIds, pvzId],
    });
  }

  async function handleAdd(ev: React.FormEvent) {
    ev.preventDefault();
    const validItems = form.items.filter((i) => i.text.trim());
    if (!form.title.trim() || validItems.length === 0) return;
    await addChecklist({
      title: form.title.trim(),
      description: form.description.trim(),
      items: validItems,
      pvzIds: form.pvzIds,
    });
    setShowAdd(false);
    setForm(EMPTY_FORM);
  }

  function startEdit(cl: typeof checklists[0]) {
    setEditId(cl.id);
    setEditForm({
      title: cl.title,
      description: cl.description,
      items: cl.items.map((i) => ({ text: i.text })),
      pvzIds: cl.pvzIds,
    });
  }

  async function handleSaveEdit() {
    if (!editId) return;
    const validItems = editForm.items.filter((i) => i.text.trim());
    await updateChecklist(editId, {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      items: validItems.map((item, i) => ({
        id: Math.random().toString(36).slice(2, 10),
        text: item.text,
        order: i,
      })),
      pvzIds: editForm.pvzIds,
    });
    setEditId(null);
  }

  function renderForm(
    f: FormState,
    setF: (v: FormState) => void,
    onSubmit: (e: React.FormEvent) => void,
    submitLabel: string,
  ) {
    return (
      <form onSubmit={onSubmit} className="form-grid">
        <label className="field-label">Название *</label>
        <input
          className="input"
          required
          placeholder="Чек-лист открытия смены"
          value={f.title}
          onChange={(e) => setF({ ...f, title: e.target.value })}
        />

        <label className="field-label">Описание</label>
        <input
          className="input"
          placeholder="Краткое описание..."
          value={f.description}
          onChange={(e) => setF({ ...f, description: e.target.value })}
        />

        <label className="field-label">Пункты чек-листа *</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {f.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <GripVertical size={14} style={{ color: 'var(--text2)', flexShrink: 0 }} />
              <input
                className="input-sm"
                placeholder={`Пункт ${idx + 1}`}
                value={item.text}
                onChange={(e) => updateItem(f, setF, idx, e.target.value)}
              />
              <button
                type="button"
                className="icon-btn danger"
                onClick={() => removeItem(f, setF, idx)}
                disabled={f.items.length <= 1}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn"
            style={{ alignSelf: 'flex-start', background: 'var(--surface)', color: 'var(--text2)', fontSize: 12 }}
            onClick={() => addItem(f, setF)}
          >
            <Plus size={13} /> Добавить пункт
          </button>
        </div>

        {activePoints.length > 0 && (
          <>
            <label className="field-label">Для каких ТТ (пусто = все)</label>
            <div className="pvz-toggles">
              {activePoints.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`pvz-toggle-btn${f.pvzIds.includes(p.id) ? ' on' : ''}`}
                  onClick={() => togglePvz(f, setF, p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </>
        )}

        <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
          {submitLabel}
        </button>
      </form>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Чек-листы</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Создать
        </button>
      </div>

      {loading ? (
        <div className="loader">Загрузка...</div>
      ) : checklists.length === 0 ? (
        <div className="card">
          <p className="empty-text">Чек-листов пока нет. Создайте первый.</p>
        </div>
      ) : (
        <div className="employees-list">
          {checklists.map((cl) => (
            <div key={cl.id} className={`emp-card${!cl.isActive ? ' inactive' : ''}`}>
              <div className="emp-card-header">
                <div className="emp-info" style={{ gap: 10 }}>
                  <div>
                    <div className="emp-name-row">
                      <span className="emp-name">{cl.title}</span>
                      <span
                        className={`tag ${cl.isActive ? 'accent' : 'muted'}`}
                        style={{ fontSize: 11 }}
                      >
                        {cl.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </div>
                    {cl.description && (
                      <div className="emp-meta">{cl.description}</div>
                    )}
                    <div className="emp-meta" style={{ marginTop: 4 }}>
                      {cl.items.length} пунктов
                      {cl.pvzIds.length > 0 && (
                        <span>· {cl.pvzIds.length} ТТ</span>
                      )}
                      {cl.pvzIds.length === 0 && (
                        <span>· Все ТТ</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="emp-actions">
                  <button
                    className="icon-btn"
                    title="Редактировать"
                    onClick={() => startEdit(cl)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="icon-btn"
                    title={cl.isActive ? 'Деактивировать' : 'Активировать'}
                    onClick={() => updateChecklist(cl.id, { isActive: !cl.isActive })}
                  >
                    {cl.isActive
                      ? <ToggleRight size={18} style={{ color: 'var(--green)' }} />
                      : <ToggleLeft size={18} />
                    }
                  </button>
                  <button
                    className="icon-btn danger"
                    title="Удалить"
                    onClick={() => deleteChecklist(cl.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="emp-card-body">
                <button
                  className="barcode-toggle-btn"
                  onClick={() => setExpandedId(expandedId === cl.id ? null : cl.id)}
                >
                  <span>Пункты</span>
                  {expandedId === cl.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {expandedId === cl.id && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                    {cl.items
                      .sort((a, b) => a.order - b.order)
                      .map((item, idx) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                            padding: '4px 8px',
                            background: 'var(--surface)',
                            borderRadius: 6,
                            fontSize: 13,
                          }}
                        >
                          <span style={{ color: 'var(--text2)', fontWeight: 600, minWidth: 20 }}>
                            {idx + 1}.
                          </span>
                          <span>{item.text}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно добавления */}
      {showAdd && (
        <Modal title="Новый чек-лист" onClose={() => { setShowAdd(false); setForm(EMPTY_FORM); }}>
          {renderForm(form, setForm, handleAdd, 'Создать чек-лист')}
        </Modal>
      )}

      {/* Модальное окно редактирования */}
      {editId && (
        <Modal title="Редактировать чек-лист" onClose={() => setEditId(null)}>
          {renderForm(editForm, setEditForm, (e) => { e.preventDefault(); handleSaveEdit(); }, 'Сохранить')}
        </Modal>
      )}
    </div>
  );
}
