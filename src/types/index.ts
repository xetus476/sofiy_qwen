export interface User {
  id: string;
  tg_id: number;
  username: string | null;
  first_name: string | null;
  monthly_income: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  type: 'expense' | 'income';
  note: string | null;
  date: string;
  created_at: string;
  category?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: number;
  year: number;
  planned_amount: number;
  category?: Category;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  icon: string;
  is_completed: boolean;
  created_at: string;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryExpense {
  category: Category;
  amount: number;
  percentage: number;
}
