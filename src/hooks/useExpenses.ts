import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Expense } from '../types';
import { toDate } from '../utils/dateHelpers';

const COL = collection(db, 'expenses');

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(COL, orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map((d) => ({
        ...(d.data() as Omit<Expense, 'id' | 'date' | 'createdAt'>),
        id: d.id,
        date: toDate(d.data().date as Timestamp),
        createdAt: toDate(d.data().createdAt as Timestamp),
      })));
      setLoading(false);
    }, (err) => { setError(err); setLoading(false); });
    return unsub;
  }, []);

  async function addExpense(data: Omit<Expense, 'id' | 'createdAt'>) {
    await addDoc(COL, { ...data, date: Timestamp.fromDate(data.date), createdAt: Timestamp.now() });
  }

  async function updateExpense(id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) {
    const payload: Record<string, unknown> = { ...data };
    if (data.date) payload.date = Timestamp.fromDate(data.date);
    await updateDoc(doc(db, 'expenses', id), payload);
  }

  async function deleteExpense(id: string) {
    await deleteDoc(doc(db, 'expenses', id));
  }

  return { expenses, loading, error, addExpense, updateExpense, deleteExpense };
}
