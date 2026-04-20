import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Checklist, ChecklistItem } from '../types';
import { toDate } from '../utils/dateHelpers';

const COL = collection(db, 'checklists');

function generateItemId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function useChecklists() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(COL, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setChecklists(snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title ?? '',
          description: data.description ?? '',
          items: (data.items ?? []) as ChecklistItem[],
          pvzIds: data.pvzIds ?? [],
          isActive: data.isActive ?? true,
          createdAt: toDate(data.createdAt as Timestamp),
        };
      }));
      setLoading(false);
    });
  }, []);

  async function addChecklist(data: {
    title: string;
    description: string;
    items: { text: string }[];
    pvzIds: string[];
  }) {
    const items: ChecklistItem[] = data.items.map((item, i) => ({
      id: generateItemId(),
      text: item.text,
      order: i,
    }));
    await addDoc(COL, {
      title: data.title,
      description: data.description,
      items,
      pvzIds: data.pvzIds,
      isActive: true,
      createdAt: Timestamp.now(),
    });
  }

  async function updateChecklist(
    id: string,
    data: Partial<Omit<Checklist, 'id' | 'createdAt'>>,
  ) {
    await updateDoc(doc(db, 'checklists', id), data as Record<string, unknown>);
  }

  async function deleteChecklist(id: string) {
    await deleteDoc(doc(db, 'checklists', id));
  }

  const activeChecklists = checklists.filter((c) => c.isActive);

  return {
    checklists,
    activeChecklists,
    loading,
    addChecklist,
    updateChecklist,
    deleteChecklist,
  };
}
