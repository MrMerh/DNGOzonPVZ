// ─── Financial ───────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | 'реклама'
  | 'аренда'
  | 'зарплата'
  | 'оборудование'
  | 'расходники'
  | 'прочее';

export interface Expense {
  id: string;
  date: Date;
  category: ExpenseCategory;
  amount: number;
  description: string;
  createdAt: Date;
}

export interface IncomeEntry {
  id: string;
  date: Date;
  amount: number;
  description: string;
  showNet: boolean;
  createdAt: Date;
}

export interface AppSettings {
  taxRate: number;
  breakevenTarget: number;
}

export interface IncomeRowViewModel extends IncomeEntry {
  taxAmount: number;
  netAmount: number;
}

export interface MonthlyAggregate {
  month: string;
  label: string;
  grossIncome: number;
  taxAmount: number;
  netIncome: number;
  totalExpenses: number;
  profit: number;
}

export interface RecentTransaction {
  id: string;
  type: 'income' | 'expense';
  date: Date;
  amount: number;
  label: string;
}

// ─── PVZ Points ───────────────────────────────────────────────────────────────

export interface PVZPoint {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  createdAt: Date;
}

// ─── Employees ────────────────────────────────────────────────────────────────

export type EmployeeRole = 'owner' | 'manager' | 'employee';

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  owner: 'Владелец',
  manager: 'Менеджер',
  employee: 'Сотрудник',
};

export const ROLE_COLORS: Record<EmployeeRole, string> = {
  owner: '#f59e0b',
  manager: '#3b82f6',
  employee: '#6b7280',
};

export interface Employee {
  id: string;
  name: string;
  tgUsername: string;
  primaryPvzId: string;
  role: EmployeeRole;
  hourlyRate: number;   // ₽/час
  accessCode: string;
  codeUsed: boolean;
  isActive: boolean;
  pvzAccess: string[];
  createdAt: Date;
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export interface ScheduleSlot {
  id: string;
  employeeId: string;
  pvzId: string;
  date: Date;
  confirmed: boolean;
  requestedByEmp: boolean;
  createdAt: Date;
}

// ─── Shifts ───────────────────────────────────────────────────────────────────

export interface Shift {
  id: string;
  employeeId: string;
  pvzId: string;
  date: Date;
  hours: number;        // продолжительность смены в часах
  parcelsIn: number;
  parcelsOut: number;
  returns: number;
  incident: boolean;
  bonus: number;
  bonusComment: string;
  fine: number;
  fineComment: string;
  checklistCompleted: boolean;
  notes: string;
  createdAt: Date;
}

// ─── Announcements ────────────────────────────────────────────────────────────

export interface Announcement {
  id: string;
  text: string;
  isActive: boolean;
  createdAt: Date;
}
