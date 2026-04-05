import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc,
  doc, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { DailyCode } from '../types';
import { toDate } from '../utils/dateHelpers';

const COL = collection(db, 'dailyCodes');

function generateDailyCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function useDailyCodes() {
  const [codes, setCodes] = useState<DailyCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(COL, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setCodes(snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          code: data.code,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          createdAt: toDate(data.createdAt as Timestamp),
          usedAt: data.usedAt ? toDate(data.usedAt as Timestamp) : null,
          expiresAt: toDate(data.expiresAt as Timestamp),
          active: data.active ?? false,
        };
      }));
      setLoading(false);
    });
  }, []);

  /** Генерация нового одноразового кода для сотрудника */
  async function generateCode(employeeId: string, employeeName: string): Promise<string> {
    const code = generateDailyCode();
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    await addDoc(COL, {
      code,
      employeeId,
      employeeName,
      createdAt: Timestamp.now(),
      usedAt: null,
      expiresAt: Timestamp.fromDate(endOfDay),
      active: true,
    });

    return code;
  }

  /** Деактивировать код */
  async function deactivateCode(id: string) {
    await updateDoc(doc(db, 'dailyCodes', id), { active: false });
  }

  /** Использовать код (при входе в моб. приложение) */
  async function markCodeUsed(id: string) {
    await updateDoc(doc(db, 'dailyCodes', id), {
      usedAt: Timestamp.now(),
      active: false,
    });
  }

  const todayCodes = codes.filter((c) => {
    const today = new Date();
    return c.createdAt.toDateString() === today.toDateString();
  });

  const activeCodes = todayCodes.filter((c) => c.active);

  return {
    codes,
    todayCodes,
    activeCodes,
    loading,
    generateCode,
    deactivateCode,
    markCodeUsed,
  };
}
