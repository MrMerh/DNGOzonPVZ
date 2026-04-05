import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { IncomeEntry } from '../types';
import { toDate } from '../utils/dateHelpers';

const COL = collection(db, 'income');

export function useIncome() {
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(COL, orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => {
        const data = d.data();
        return {
          ...(data as Omit<IncomeEntry, 'id' | 'date' | 'createdAt'>),
          id: d.id,
          date: toDate(data.date as Timestamp),
          createdAt: toDate(data.createdAt as Timestamp),
          showNet: data.showNet ?? false,
          noTax: data.noTax ?? false,
        };
      }));
      setLoading(false);
    }, (err) => { setError(err); setLoading(false); });
    return unsub;
  }, []);

  async function addEntry(data: Omit<IncomeEntry, 'id' | 'createdAt'>) {
    await addDoc(COL, { ...data, date: Timestamp.fromDate(data.date), createdAt: Timestamp.now() });
  }

  async function updateEntry(id: string, data: Partial<Omit<IncomeEntry, 'id' | 'createdAt'>>) {
    const payload: Record<string, unknown> = { ...data };
    if (data.date) payload.date = Timestamp.fromDate(data.date);
    await updateDoc(doc(db, 'income', id), payload);
  }

  async function deleteEntry(id: string) {
    await deleteDoc(doc(db, 'income', id));
  }

  return { entries, loading, error, addEntry, updateEntry, deleteEntry };
}
