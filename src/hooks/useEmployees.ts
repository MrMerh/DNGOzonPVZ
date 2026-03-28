import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Employee, EmployeeRole } from '../types';
import { toDate } from '../utils/dateHelpers';

const COL = collection(db, 'employees');

function generateCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(COL, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      setEmployees(snap.docs.map((d) => {
        const data = d.data();
        return {
          ...(data as Omit<Employee, 'id' | 'createdAt'>),
          id: d.id,
          // backward-compat: old docs had `salary`, new have `hourlyRate`
          hourlyRate: data.hourlyRate ?? data.salary ?? 0,
          role: (data.role as EmployeeRole) ?? 'employee',
          createdAt: toDate(data.createdAt as Timestamp),
        };
      }));
      setLoading(false);
    });
  }, []);

  async function addEmployee(
    data: Omit<Employee, 'id' | 'createdAt' | 'accessCode' | 'codeUsed'>,
  ) {
    await addDoc(COL, {
      ...data,
      accessCode: generateCode(),
      codeUsed: false,
      createdAt: Timestamp.now(),
    });
  }

  async function updateEmployee(
    id: string,
    data: Partial<Omit<Employee, 'id' | 'createdAt'>>,
  ) {
    await updateDoc(doc(db, 'employees', id), data as Record<string, unknown>);
  }

  async function regenCode(id: string) {
    await updateDoc(doc(db, 'employees', id), {
      accessCode: generateCode(),
      codeUsed: false,
    });
  }

  async function deleteEmployee(id: string) {
    await deleteDoc(doc(db, 'employees', id));
  }

  const activeEmployees = employees.filter((e) => e.isActive);

  return {
    employees,
    activeEmployees,
    loading,
    addEmployee,
    updateEmployee,
    regenCode,
    deleteEmployee,
  };
}
