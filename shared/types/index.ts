export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  notes?: string;
  receiptImageUrl?: string;
  month?: string;
  notionId?: string;
}

export interface Income {
  id: string;
  source: string;
  amount: number;
  date: string;
  type: 'Salary' | 'Side Hustle';
  month?: string;
  notionId?: string;
}

export interface BudgetLimit {
  id: string;
  category: string;
  monthlyLimit: number;
  alertThreshold: number;
  notionId?: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  dayOfMonth: number;
  active: boolean;
  notionId?: string;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
  preview: string[];
}

export interface SideHustleMapping {
  dbId: string;
  amountField: string;
  dateField: string;
  sourceField?: string;
}

export interface NotionConfig {
  apiKey: string;
  parentPageId: string;
  expensesDbId?: string;
  incomeDbId?: string;
  budgetDbId?: string;
  recurringDbId?: string;
  sideHustleMapping?: SideHustleMapping;
}

export interface MonthStats {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsPercent: number;
  categoryBreakdown: Record<string, number>;
}
