import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, deleteDoc,
  doc, query, where, Timestamp, writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ScheduleSlot } from '../types';
import { toDate } from '../utils/dateHelpers';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';

const COL = collection(db, 'schedule');

export function useSchedule(month: Date) {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const from = startOfMonth(month);
  const to = endOfMonth(month);

  useEffect(() => {
    setLoading(true);
    const q = query(
      COL,
      where('date', '>=', Timestamp.fromDate(from)),
      where('date', '<=', Timestamp.fromDate(to)),
    );
    return onSnapshot(q, (snap) => {
      setSlots(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            ...(data as Omit<ScheduleSlot, 'id' | 'date' | 'createdAt'>),
            id: d.id,
            date: toDate(data.date as Timestamp),
            timeStart: data.timeStart ?? '09:00',
            timeEnd: data.timeEnd ?? '21:00',
            createdAt: toDate(data.createdAt as Timestamp),
          };
        }),
      );
      setLoading(false);
    });
  // re-subscribe when month changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from.getTime()]);

  /** Add a single slot */
  async function addSlot(data: Omit<ScheduleSlot, 'id' | 'createdAt'>) {
    await addDoc(COL, {
      ...data,
      date: Timestamp.fromDate(data.date),
      createdAt: Timestamp.now(),
    });
  }

  /** Bulk-add slots for one employee on multiple days */
  async function addSlots(items: Omit<ScheduleSlot, 'id' | 'createdAt'>[]) {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const ref = doc(COL);
      batch.set(ref, {
        ...item,
        date: Timestamp.fromDate(item.date),
        createdAt: Timestamp.now(),
      });
    });
    await batch.commit();
  }

  async function deleteSlot(id: string) {
    await deleteDoc(doc(db, 'schedule', id));
  }

  return { slots, loading, addSlot, addSlots, deleteSlot, addMonths };
}
