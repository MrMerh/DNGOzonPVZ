import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, deleteDoc,
  doc, query, where, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ScheduleSlot } from '../types';
import { toDate } from '../utils/dateHelpers';
import { addDays, startOfDay } from 'date-fns';

const COL = collection(db, 'schedule');

export function useSchedule(daysAhead = 14) {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const from = startOfDay(new Date());
  const to = addDays(from, daysAhead);

  useEffect(() => {
    const q = query(
      COL,
      where('date', '>=', Timestamp.fromDate(from)),
      where('date', '<', Timestamp.fromDate(to)),
    );
    return onSnapshot(q, (snap) => {
      setSlots(snap.docs.map((d) => ({
        ...(d.data() as Omit<ScheduleSlot, 'id' | 'date' | 'createdAt'>),
        id: d.id,
        date: toDate(d.data().date as Timestamp),
        createdAt: toDate(d.data().createdAt as Timestamp),
      })));
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addSlot(data: Omit<ScheduleSlot, 'id' | 'createdAt'>) {
    await addDoc(COL, {
      ...data,
      date: Timestamp.fromDate(data.date),
      createdAt: Timestamp.now(),
    });
  }

  async function deleteSlot(id: string) {
    await deleteDoc(doc(db, 'schedule', id));
  }

  return { slots, loading, addSlot, deleteSlot };
}
