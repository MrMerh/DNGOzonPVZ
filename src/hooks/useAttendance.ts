import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, query,
  where, Timestamp, orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Attendance } from '../types';
import { toDate } from '../utils/dateHelpers';
import { startOfDay, endOfDay } from 'date-fns';

const COL = collection(db, 'attendance');

/** Returns today's attendance records and a checkIn function */
export function useAttendance(date: Date = new Date()) {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  const from = startOfDay(date);
  const to = endOfDay(date);

  useEffect(() => {
    setLoading(true);
    const q = query(
      COL,
      where('date', '>=', Timestamp.fromDate(from)),
      where('date', '<=', Timestamp.fromDate(to)),
      orderBy('date', 'asc'),
      orderBy('checkedInAt', 'asc'),
    );
    return onSnapshot(q, (snap) => {
      setRecords(snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          employeeId: data.employeeId as string,
          pvzId: data.pvzId as string,
          date: toDate(data.date as Timestamp),
          checkedInAt: toDate(data.checkedInAt as Timestamp),
          createdAt: toDate(data.createdAt as Timestamp),
        };
      }));
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from.getTime()]);

  async function checkIn(employeeId: string, pvzId: string) {
    const now = new Date();
    await addDoc(COL, {
      employeeId,
      pvzId,
      date: Timestamp.fromDate(startOfDay(now)),
      checkedInAt: Timestamp.fromDate(now),
      createdAt: Timestamp.now(),
    });
  }

  /** Check if employee already checked in today */
  function isCheckedIn(employeeId: string) {
    return records.some((r) => r.employeeId === employeeId);
  }

  return { records, loading, checkIn, isCheckedIn };
}
