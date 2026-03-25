import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AppSettings } from '../types';

const DEFAULT_SETTINGS: AppSettings = { taxRate: 0.06, breakevenTarget: 100000 };
const SETTINGS_DOC = doc(db, 'settings', 'global');

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(SETTINGS_DOC, (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as AppSettings);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function updateSettings(partial: Partial<AppSettings>) {
    await setDoc(SETTINGS_DOC, { ...settings, ...partial }, { merge: true });
  }

  return { settings, loading, updateSettings };
}
