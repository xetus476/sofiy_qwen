-- ═══════════════════════════════════════════════════════
-- ВРЕМЕННОЕ отключение RLS для быстрого тестирования
-- ═══════════════════════════════════════════════════════

-- ⚠️ ВНИМАНИЕ: Это отключает защиту данных!
-- Используйте ТОЛЬКО для тестирования.
-- Для продакшена включите RLS обратно (см. 001_initial_schema.sql)

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;

-- Категории остаются публичными (RLS не нужен)
-- ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Проверка
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Должно быть:
-- users          | f
-- transactions   | f
-- budgets        | f
-- goals          | f
-- categories     | t (или f, не важно)
