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
  noTax: boolean;   // если true — налог не начисляется
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
  timeStart: string;   // "09:00"
  timeEnd: string;     // "21:00"
  confirmed: boolean;
  requestedByEmp: boolean;
  createdAt: Date;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface Attendance {
  id: string;
  employeeId: string;
  pvzId: string;
  date: Date;           // calendar date (start of day)
  checkedInAt: Date;    // exact timestamp of scan
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

// ─── Daily Codes (одноразовые коды для мобильного приложения) ─────────────────

export type DailyCodeSource = 'telegram' | 'admin';

export interface DailyCode {
  id: string;
  code: string;            // 6-значный код
  employeeId: string;
  employeeName: string;    // денормализация для удобства
  createdAt: Date;
  usedAt: Date | null;     // null = ещё не использован
  expiresAt: Date;         // конец дня (23:59:59)
  active: boolean;         // false после 24:00 или после использования
  source: DailyCodeSource; // откуда сгенерирован код
}

// ─── Sessions (активные сессии моб./ПК приложений) ───────────────────────────

export type SessionType = 'mobile' | 'desktop';

export interface Session {
  id: string;
  employeeId: string;
  employeeName: string;
  pvzId: string;
  type: SessionType;
  startedAt: Date;
  expiresAt: Date;         // 24:00 текущего дня
  active: boolean;
  codeId: string;          // ссылка на DailyCode (для mobile)
}

// ─── Checklists (шаблоны чек-листов) ─────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  text: string;
  order: number;
}

export interface Checklist {
  id: string;
  title: string;
  description: string;
  items: ChecklistItem[];
  pvzIds: string[];        // для каких ТТ (пустой = все)
  isActive: boolean;
  createdAt: Date;
}

// ─── Checklist Results (заполненные чек-листы) ───────────────────────────────

export interface ChecklistResult {
  id: string;
  checklistId: string;
  checklistTitle: string;
  employeeId: string;
  employeeName: string;
  pvzId: string;
  date: Date;
  completedItems: string[];  // id'шники отмеченных пунктов
  totalItems: number;
  completedAt: Date | null;  // null = не завершён
  createdAt: Date;
}

// ─── Chat (чат между админом и сотрудником на смене) ─────────────────────────

export type ChatMessageSender = 'admin' | 'employee';

export interface ChatMessage {
  id: string;
  chatId: string;          // sessionId или `admin_${employeeId}`
  senderId: string;        // 'admin' или employeeId
  senderName: string;
  senderType: ChatMessageSender;
  text: string;
  readAt: Date | null;
  createdAt: Date;
}

export interface Chat {
  id: string;              // = sessionId
  employeeId: string;
  employeeName: string;
  pvzId: string;
  sessionType: SessionType;
  lastMessage: string;
  lastMessageAt: Date | null;
  unreadAdmin: number;     // непрочитанные для админа
  unreadEmployee: number;  // непрочитанные для сотрудника
  active: boolean;
  createdAt: Date;
}

// ─── Telegram Bot ────────────────────────────────────────────────────────────

export interface TelegramLink {
  id: string;
  employeeId: string;
  tgChatId: number;        // Telegram chat ID
  tgUsername: string;
  linkedAt: Date;
  active: boolean;
}
