import { Timestamp } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

export function toDate(value: Timestamp | Date | string): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return parseISO(value);
}

export function formatDate(date: Date): string {
  return format(date, 'dd.MM.yyyy', { locale: ru });
}

export function formatMonthLabel(isoMonth: string): string {
  const d = parseISO(`${isoMonth}-01`);
  return format(d, 'LLLL yyyy', { locale: ru });
}

export function toISOMonth(date: Date): string {
  return format(date, 'yyyy-MM');
}
