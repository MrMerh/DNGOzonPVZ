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
