import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Shift } from '../types';
import { toDate } from '../utils/dateHelpers';

const COL = collection(db, 'shifts');

export function useShifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(COL, orderBy('date', 'desc'));
    return onSnapshot(q, (snap) => {
      setShifts(snap.docs.map((d) => ({
        ...(d.data() as Omit<Shift, 'id' | 'date' | 'createdAt'>),
        id: d.id,
        date: toDate(d.data().date as Timestamp),
        createdAt: toDate(d.data().createdAt as Timestamp),
      })));
      setLoading(false);
    });
  }, []);

  async function addShift(data: Omit<Shift, 'id' | 'createdAt'>) {
    await addDoc(COL, { ...data, date: Timestamp.fromDate(data.date), createdAt: Timestamp.now() });
  }

  async function updateShift(id: string, data: Partial<Omit<Shift, 'id' | 'createdAt'>>) {
    const payload: Record<string, unknown> = { ...data };
    if (data.date) payload.date = Timestamp.fromDate(data.date);
    await updateDoc(doc(db, 'shifts', id), payload);
  }

  async function deleteShift(id: string) {
    await deleteDoc(doc(db, 'shifts', id));
  }

  return { shifts, loading, addShift, updateShift, deleteShift };
}
