-- ═══════════════════════════════════════════════════════
-- FinanceBot Mini App — SQL миграция для Supabase
-- ═══════════════════════════════════════════════════════

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tg_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  monthly_income NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица категорий расходов (предзаполненная)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  sort_order INT DEFAULT 0
);

-- Начальные категории
INSERT INTO categories (name, icon, color, sort_order) VALUES
  ('Жильё',           '🏠', '#6366F1', 1),
  ('ЖКХ',             '💡', '#F59E0B', 2),
  ('Продукты',        '🛒', '#10B981', 3),
  ('Кафе и доставка', '🍔', '#EF4444', 4),
  ('Косметика',       '💄', '#EC4899', 5),
  ('Транспорт',       '🚌', '#3B82F6', 6),
  ('Маркетплейсы',    '📦', '#8B5CF6', 7)
ON CONFLICT DO NOTHING;

-- Таблица транзакций (расходы и доходы)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица бюджетов (планы по категориям на месяц)
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  planned_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  UNIQUE(user_id, category_id, month, year)
);

-- Таблица целей
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL,
  current_amount NUMERIC(12,2) DEFAULT 0,
  icon TEXT DEFAULT '🎯',
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Политики: пользователь видит только свои данные
CREATE POLICY "Users can manage own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own budgets" ON budgets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own goals" ON goals
  FOR ALL USING (auth.uid() = user_id);

-- Категории доступны всем на чтение
CREATE POLICY "Categories are readable by all" ON categories
  FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════
-- Индексы для производительности
-- ═══════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_users_tg_id ON users(tg_id);
