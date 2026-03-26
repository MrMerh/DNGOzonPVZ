import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { PVZPoint } from '../types';
import { toDate } from '../utils/dateHelpers';

const COL = collection(db, 'pvz_points');

export function usePVZPoints() {
  const [points, setPoints] = useState<PVZPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(COL, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      setPoints(snap.docs.map((d) => ({
        ...(d.data() as Omit<PVZPoint, 'id' | 'createdAt'>),
        id: d.id,
        createdAt: toDate(d.data().createdAt as Timestamp),
      })));
      setLoading(false);
    });
  }, []);

  async function addPoint(data: Omit<PVZPoint, 'id' | 'createdAt'>) {
    await addDoc(COL, { ...data, createdAt: Timestamp.now() });
  }

  async function updatePoint(id: string, data: Partial<Omit<PVZPoint, 'id' | 'createdAt'>>) {
    await updateDoc(doc(db, 'pvz_points', id), data as Record<string, unknown>);
  }

  async function deletePoint(id: string) {
    await deleteDoc(doc(db, 'pvz_points', id));
  }

  const activePoints = points.filter((p) => p.isActive);

  return { points, activePoints, loading, addPoint, updatePoint, deletePoint };
}
