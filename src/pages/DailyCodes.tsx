import { useState } from 'react';
import { KeyRound, Copy, Check, XCircle, Bot } from 'lucide-react';
import { useDailyCodes } from '../hooks/useDailyCodes';
import { formatDate } from '../utils/dateHelpers';

export default function DailyCodes() {
  const { todayCodes, codes, loading, deactivateCode } = useDailyCodes();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">
          <KeyRound size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
          Одноразовые коды
        </h1>
      </div>

      {/* Информация о том, что коды генерируются через бота */}
      <div className="card" style={{ marginBottom: 20, borderColor: 'var(--accent)', borderWidth: 1, borderStyle: 'solid' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bot size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Коды генерируются через Telegram-бот</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              Сотрудник отправляет команду <code>/code</code> в TG-бот и получает одноразовый код для входа в мобильное приложение. Здесь отображаются все выданные коды.
            </div>
          </div>
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
                  <th>Источник</th>
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
                      <span className={`tag ${dc.source === 'telegram' ? 'accent' : 'muted'}`}>
                        {dc.source === 'telegram' ? 'TG-бот' : 'Админ'}
                      </span>
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
