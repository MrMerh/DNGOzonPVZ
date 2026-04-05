import { useState } from 'react';
import { KeyRound, Copy, Check, XCircle } from 'lucide-react';
import { useDailyCodes } from '../hooks/useDailyCodes';
import { useEmployees } from '../hooks/useEmployees';
import { formatDate } from '../utils/dateHelpers';

export default function DailyCodes() {
  const { todayCodes, codes, loading, generateCode, deactivateCode } = useDailyCodes();
  const { activeEmployees } = useEmployees();
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!selectedEmpId) return;
    const emp = activeEmployees.find((e) => e.id === selectedEmpId);
    if (!emp) return;
    setGenerating(true);
    await generateCode(emp.id, emp.name);
    setSelectedEmpId('');
    setGenerating(false);
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  // Сотрудники, для которых уже есть активный код сегодня
  const empWithActiveCode = new Set(todayCodes.filter((c) => c.active).map((c) => c.employeeId));

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">
          <KeyRound size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
          Одноразовые коды
        </h1>
      </div>

      {/* Генерация кода */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Выдать код на сегодня</div>
        <div className="scan-form">
          <select
            className="input"
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            style={{ flex: 1, maxWidth: 300 }}
          >
            <option value="">— Выберите сотрудника —</option>
            {activeEmployees.map((emp) => (
              <option key={emp.id} value={emp.id} disabled={empWithActiveCode.has(emp.id)}>
                {emp.name} {empWithActiveCode.has(emp.id) ? '(код выдан)' : ''}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={!selectedEmpId || generating}
          >
            <KeyRound size={15} />
            {generating ? 'Генерация...' : 'Сгенерировать'}
          </button>
        </div>
      </div>

      {/* Коды на сегодня */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Коды на сегодня</div>
        {loading ? (
          <div className="loader">Загрузка...</div>
        ) : todayCodes.length === 0 ? (
          <p className="empty-text">Коды ещё не выданы.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Сотрудник</th>
                  <th>Код</th>
                  <th>Статус</th>
                  <th>Создан</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {todayCodes.map((dc) => (
                  <tr key={dc.id}>
                    <td style={{ fontWeight: 600 }}>{dc.employeeName}</td>
                    <td>
                      <code className={`access-code${!dc.active ? ' used' : ''}`} style={{ fontSize: 22 }}>
                        {dc.code}
                      </code>
                    </td>
                    <td>
                      {dc.usedAt ? (
                        <span className="tag green">Использован</span>
                      ) : dc.active ? (
                        <span className="tag accent">Активен</span>
                      ) : (
                        <span className="tag muted">Деактивирован</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: 13 }}>
                      {dc.createdAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="row-actions">
                      {dc.active && (
                        <>
                          <button
                            className="icon-btn"
                            title="Копировать код"
                            onClick={() => copyCode(dc.code, dc.id)}
                          >
                            {copiedId === dc.id ? <Check size={15} style={{ color: 'var(--green)' }} /> : <Copy size={15} />}
                          </button>
                          <button
                            className="icon-btn danger"
                            title="Деактивировать"
                            onClick={() => deactivateCode(dc.id)}
                          >
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* История кодов */}
      <div className="card">
        <div className="card-title">История (последние 50)</div>
        {codes.length === 0 ? (
          <p className="empty-text">Нет истории.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Сотрудник</th>
                  <th>Код</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {codes.slice(0, 50).map((dc) => (
                  <tr key={dc.id}>
                    <td style={{ color: 'var(--text2)', fontSize: 13 }}>
                      {formatDate(dc.createdAt)}
                    </td>
                    <td>{dc.employeeName}</td>
                    <td><code style={{ fontFamily: 'monospace', color: 'var(--text2)' }}>{dc.code}</code></td>
                    <td>
                      {dc.usedAt ? (
                        <span className="tag green">Использован</span>
                      ) : dc.active ? (
                        <span className="tag accent">Активен</span>
                      ) : (
                        <span className="tag muted">Истёк</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
