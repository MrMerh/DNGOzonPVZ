import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Plus, X, ScanLine } from 'lucide-react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  format, isToday, getDay, addMonths, subMonths,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { useSchedule } from '../hooks/useSchedule';
import { useEmployees } from '../hooks/useEmployees';
import { usePVZPoints } from '../hooks/usePVZPoints';
import { useAttendance } from '../hooks/useAttendance';
import type { Employee } from '../types';
import { ROLE_COLORS } from '../types';
import Modal from '../components/ui/Modal';

const DEFAULT_START = '09:00';
const DEFAULT_END = '21:00';

function dateKey(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

function isWeekend(d: Date) {
  const day = getDay(d);
  return day === 0 || day === 6;
}

export default function Schedule() {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const { slots, loading, addSlot, addSlots, deleteSlot } = useSchedule(currentMonth);
  const { activeEmployees } = useEmployees();
  const { activePoints } = usePVZPoints();
  const { records: attendanceToday, checkIn, isCheckedIn } = useAttendance();

  // Cell modal — single day
  const [cellModal, setCellModal] = useState<{ emp: Employee; date: Date } | null>(null);
  const [cellPvz, setCellPvz] = useState('');
  const [cellStart, setCellStart] = useState(DEFAULT_START);
  const [cellEnd, setCellEnd] = useState(DEFAULT_END);

  // Employee modal — multiple days
  const [empModal, setEmpModal] = useState<Employee | null>(null);
  const [empPvz, setEmpPvz] = useState('');
  const [empStart, setEmpStart] = useState(DEFAULT_START);
  const [empEnd, setEmpEnd] = useState(DEFAULT_END);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());

  // Barcode scanner
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [scanPvz, setScanPvz] = useState('');
  const scanRef = useRef<HTMLInputElement>(null);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  // slotMap: employeeId → dateKey → slot
  const slotMap = new Map<string, Map<string, typeof slots[0]>>();
  slots.forEach((s) => {
    if (!slotMap.has(s.employeeId)) slotMap.set(s.employeeId, new Map());
    slotMap.get(s.employeeId)!.set(dateKey(s.date), s);
  });

  const pvzName = (id: string) => activePoints.find((p) => p.id === id)?.name ?? '—';
  const empName = (id: string) => activeEmployees.find((e) => e.id === id)?.name ?? '—';

  // Auto-focus scan input when scan mode opens
  useEffect(() => {
    if (scanMode) {
      setScanInput('');
      setScanResult(null);
      setScanPvz(activePoints[0]?.id ?? '' );
      setTimeout(() => scanRef.current?.focus(), 50);
    }
  }, [scanMode, activePoints]);

  async function handleCellAdd(ev: React.FormEvent) {
    ev.preventDefault();
    if (!cellModal) return;
    await addSlot({
      employeeId: cellModal.emp.id,
      pvzId: cellPvz,
      date: cellModal.date,
      timeStart: cellStart,
      timeEnd: cellEnd,
      confirmed: true,
      requestedByEmp: false,
    });
    setCellModal(null);
  }

  async function handleEmpAdd(ev: React.FormEvent) {
    ev.preventDefault();
    if (!empModal || selectedDays.size === 0) return;
    const items = Array.from(selectedDays).map((dk) => ({
      employeeId: empModal.id,
      pvzId: empPvz,
      date: new Date(dk),
      timeStart: empStart,
      timeEnd: empEnd,
      confirmed: true,
      requestedByEmp: false,
    }));
    await addSlots(items);
    setEmpModal(null);
    setSelectedDays(new Set());
  }

  function openEmpModal(emp: Employee) {
    setEmpModal(emp);
    setEmpPvz(emp.primaryPvzId || (activePoints[0]?.id ?? ''));
    setEmpStart(DEFAULT_START);
    setEmpEnd(DEFAULT_END);
    setSelectedDays(new Set());
  }

  function toggleDay(dk: string) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dk)) next.delete(dk);
      else next.add(dk);
      return next;
    });
  }

  async function handleScan(ev: React.FormEvent) {
    ev.preventDefault();
    const empId = scanInput.trim();
    const emp = activeEmployees.find((e) => e.id === empId);
    if (!emp) {
      setScanResult({ ok: false, msg: `Сотрудник не найден (${empId})` });
      setScanInput('');
      return;
    }
    if (isCheckedIn(emp.id)) {
      setScanResult({ ok: false, msg: `${emp.name} уже отметился сегодня` });
      setScanInput('');
      return;
    }
    await checkIn(emp.id, scanPvz);
    setScanResult({ ok: true, msg: `✓ ${emp.name} отмечен! ${format(new Date(), 'HH:mm')}` });
    setScanInput('');
    setTimeout(() => {
      setScanResult(null);
      scanRef.current?.focus();
    }, 3000);
  }

  if (loading) return <div className="page"><div className="loader">Загрузка...</div></div>;

  if (activeEmployees.length === 0) {
    return (
      <div className="page">
        <h1 className="page-title">График смен</h1>
        <div className="card"><p className="empty-text">Сначала добавьте сотрудников и ПВЗ точки.</p></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">График смен</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className={`btn${scanMode ? ' btn-primary' : ''}`}
            style={!scanMode ? { background: 'var(--surface)', border: '1px solid var(--border)' } : {}}
            onClick={() => setScanMode(!scanMode)}
          >
            <ScanLine size={15} /> Отметить явку
          </button>
          <div className="month-nav">
            <button className="icon-btn" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft size={18} />
            </button>
            <span className="month-label">
              {format(currentMonth, 'LLLL yyyy', { locale: ru })}
            </span>
            <button className="icon-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Barcode scanner panel */}
      {scanMode && (
        <div className="scan-panel">
          <div className="scan-panel-inner">
            <div className="scan-header">
              <ScanLine size={16} style={{ color: 'var(--accent)' }} />
              <span>Сканирование штрихкода</span>
              <span className="scan-hint">— поднесите сканер или введите ID сотрудника вручную</span>
            </div>
            <form onSubmit={handleScan} className="scan-form">
              <select
                className="input-sm"
                value={scanPvz}
                onChange={(e) => setScanPvz(e.target.value)}
                required
              >
                <option value="">— ПВЗ —</option>
                {activePoints.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input
                ref={scanRef}
                className="input scan-input"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="ID сотрудника (штрихкод)"
                autoComplete="off"
              />
              <button type="submit" className="btn btn-primary" disabled={!scanInput.trim() || !scanPvz}>
                Отметить
              </button>
            </form>
            {scanResult && (
              <div className={`scan-result ${scanResult.ok ? 'ok' : 'err'}`}>
                {scanResult.msg}
              </div>
            )}
            {attendanceToday.length > 0 && (
              <div className="scan-log">
                <span className="field-label">Отметились сегодня ({attendanceToday.length}):</span>
                <div className="scan-log-list">
                  {attendanceToday.map((r) => (
                    <span key={r.id} className="scan-log-item">
                      {empName(r.employeeId)}
                      <span className="scan-time">{format(r.checkedInAt, 'HH:mm')}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="schedule-wrap">
        <table className="schedule-table">
          <thead>
            <tr>
              <th className="emp-col">Сотрудник</th>
              {days.map((d) => (
                <th
                  key={dateKey(d)}
                  className={[
                    isToday(d) ? 'today-col' : '',
                    isWeekend(d) ? 'weekend-col' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <div className="date-head">
                    <span className="date-day">{format(d, 'EEE', { locale: ru })}</span>
                    <span className="date-num">{format(d, 'd')}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeEmployees.map((emp) => {
              const checkedIn = isCheckedIn(emp.id);
              return (
                <tr key={emp.id}>
                  <td className="emp-col">
                    <button
                      className="sched-emp-btn"
                      style={{ borderLeftColor: ROLE_COLORS[emp.role ?? 'employee'] }}
                      onClick={() => openEmpModal(emp)}
                      title="Добавить смены на несколько дней"
                    >
                      <div className="sched-emp-name">{emp.name.split(' ')[0]}</div>
                      <div className="sched-emp-sub">{emp.name.split(' ')[1] ?? ''}</div>
                      {checkedIn && <span className="checkin-dot" title="Сегодня на смене" />}
                    </button>
                  </td>
                  {days.map((d) => {
                    const dk = dateKey(d);
                    const slot = slotMap.get(emp.id)?.get(dk);
                    return (
                      <td
                        key={dk}
                        className={[
                          'slot-cell',
                          isToday(d) ? 'today-col' : '',
                          isWeekend(d) ? 'weekend-col' : '',
                        ].filter(Boolean).join(' ')}
                      >
                        {slot ? (
                          <div className="slot-filled">
                            <div className="slot-info">
                              <span className="slot-pvz">{pvzName(slot.pvzId)}</span>
                              <span className="slot-time">{slot.timeStart}–{slot.timeEnd}</span>
                            </div>
                            <button className="slot-del" onClick={() => deleteSlot(slot.id)}>
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="slot-add"
                            onClick={() => {
                              setCellModal({ emp, date: d });
                              setCellPvz(emp.primaryPvzId || activePoints[0]?.id || '');
                              setCellStart(DEFAULT_START);
                              setCellEnd(DEFAULT_END);
                            }}
                          >
                            <Plus size={11} />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cell modal — single day */}
      {cellModal && (
        <Modal
          title={`Смена — ${format(cellModal.date, 'd MMMM', { locale: ru })}`}
          onClose={() => setCellModal(null)}
        >
          <form onSubmit={handleCellAdd} className="form-grid">
            <label className="field-label">Сотрудник</label>
            <input className="input" disabled value={cellModal.emp.name} />

            <label className="field-label">ПВЗ точка</label>
            <select className="input" required value={cellPvz}
              onChange={(e) => setCellPvz(e.target.value)}>
              <option value="">— Выберите точку —</option>
              {activePoints.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <label className="field-label">Время работы</label>
            <div className="time-range-row">
              <span className="field-label" style={{ minWidth: 28 }}>с</span>
              <input className="input" type="time" value={cellStart}
                onChange={(e) => setCellStart(e.target.value)} />
              <span className="field-label" style={{ minWidth: 28 }}>до</span>
              <input className="input" type="time" value={cellEnd}
                onChange={(e) => setCellEnd(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
              Добавить
            </button>
          </form>
        </Modal>
      )}

      {/* Employee modal — multiple days */}
      {empModal && (
        <Modal
          title={`Смены — ${empModal.name}`}
          onClose={() => { setEmpModal(null); setSelectedDays(new Set()); }}
        >
          <form onSubmit={handleEmpAdd} className="form-grid">
            <label className="field-label">ПВЗ точка</label>
            <select className="input" required value={empPvz}
              onChange={(e) => setEmpPvz(e.target.value)}>
              <option value="">— Выберите точку —</option>
              {activePoints.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <label className="field-label">Время работы</label>
            <div className="time-range-row">
              <span className="field-label" style={{ minWidth: 28 }}>с</span>
              <input className="input" type="time" value={empStart}
                onChange={(e) => setEmpStart(e.target.value)} />
              <span className="field-label" style={{ minWidth: 28 }}>до</span>
              <input className="input" type="time" value={empEnd}
                onChange={(e) => setEmpEnd(e.target.value)} />
            </div>

            <label className="field-label">
              Выберите дни ({selectedDays.size} выбрано)
            </label>
            <div className="day-picker-grid">
              {days.map((d) => {
                const dk = dateKey(d);
                const hasSlot = !!slotMap.get(empModal.id)?.get(dk);
                const selected = selectedDays.has(dk);
                return (
                  <button
                    key={dk}
                    type="button"
                    disabled={hasSlot}
                    className={[
                      'day-pick-btn',
                      selected ? 'selected' : '',
                      isWeekend(d) ? 'weekend' : '',
                      isToday(d) ? 'today' : '',
                      hasSlot ? 'has-slot' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => toggleDay(dk)}
                  >
                    <span className="dp-weekday">{format(d, 'EEEEE', { locale: ru })}</span>
                    <span className="dp-num">{format(d, 'd')}</span>
                    {hasSlot && <X size={8} className="dp-x" />}
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: 8 }}
              disabled={selectedDays.size === 0 || !empPvz}
            >
              Добавить {selectedDays.size > 0 ? `${selectedDays.size} смен` : 'смены'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
