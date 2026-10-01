# 🔧 Исправление ошибки Edge Function и полный деплой

## ❌ Проблема

```
Failed to deploy edge function: Failed to bundle the function 
(reason: Requires import access to "denopkg.com:443", 
run again with the --allow-import flag)
```

**Причина**: Библиотека `deno.land/x/hmac` требует дополнительных разрешений, которых нет у Supabase Edge Functions.

**Решение**: Переписана Edge Function с использованием **только встроенных Web Crypto API** (уже доступны в Deno).

---

## ✅ Что исправлено

### Старая версия (с ошибкой):
```typescript
import { createHMAC } from 'https://deno.land/x/hmac@v2.0.1/mod.ts'
// ❌ Требует внешних разрешений
```

### Новая версия (работает):
```typescript
// Используем встроенный Web Crypto API
const cryptoKey = await crypto.subtle.importKey(
  'raw',
  key,
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign']
)
const signature = await crypto.subtle.sign('HMAC', cryptoKey, data)
// ✅ Работает без внешних библиотек
```

---

## 🚀 Пошаговая инструкция деплоя

### ШАГ 1: Обновите Edge Function в Supabase

1. Откройте [supabase.com](https://supabase.com) → ваш проект
2. Перейдите в **Edge Functions**
3. Найдите функцию `verify-telegram`
4. Нажмите **"Edit"** (или удалите и создайте новую)
5. **Удалите весь старый код**
6. Скопируйте **весь код** из файла `supabase/functions/verify-telegram/index.ts`
7. Вставьте в редактор
8. Нажмите **"Deploy"**

✅ Должно появиться: **"Function deployed successfully"**

---

### ШАГ 2: Проверьте секреты

1. Перейдите в **Settings** → **Secrets** (или **Edge Functions** → **Secrets**)
2. Убедитесь, что есть секрет **`BOT_TOKEN`**
3. Значение должно быть токеном вашего бота из @BotFather:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

Если секрета нет:
1. Нажмите **"New Secret"**
2. Name: `BOT_TOKEN`
3. Value: токен бота
4. Нажмите **"Save"**

---

### ШАГ 3: Отключите RLS для тестирования

⚠️ **Важно**: RLS блокирует запросы без авторизации. Для быстрого тестирования отключим его.

1. Откройте **SQL Editor** в Supabase
2. Скопируйте код из файла `supabase/migrations/002_disable_rls_for_testing.sql`
3. Вставьте и нажмите **"Run"**
4. Должно появиться: **"Success. No rows returned"**

**Проверка**:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Должно быть:
```
users          | f  (RLS отключён)
transactions   | f
budgets        | f
goals          | f
categories     | t (или f)
```

---

### ШАГ 4: Обновите код локально

Убедитесь, что у вас последняя версия кода:

```bash
# Если код на GitHub:
git pull origin main

# Или скопируйте обновлённые файлы:
# - src/lib/supabase.ts
# - src/context/AuthContext.tsx
# - src/context/AppContext.tsx
# - supabase/functions/verify-telegram/index.ts
```

---

### ШАГ 5: Запушьте изменения на GitHub

```bash
git add .
git commit -m "Fix Edge Function: use Web Crypto API instead of external library"
git push origin main
```

Vercel автоматически пересоберёт проект.

---

### ШАГ 6: Протестируйте в Telegram

1. Откройте вашего бота в Telegram
2. Нажмите кнопку **"💰 Финансы"**
3. Откройте консоль браузера (F12 → Console)
4. Вы должны увидеть:

```
🔐 Verifying Telegram initData...
✅ Telegram user verified: 123456789 Иван
✅ User saved to database: uuid-123-456-789
✅ User authenticated: { id: 'uuid-...', tg_id: 123456789, ... }
📥 Loading transactions for user: uuid-...
✅ Loaded transactions: 0
```

5. Добавьте расход (например, 500₽ в категорию "Кафе")
6. Проверьте в Supabase → **Table Editor** → **transactions**
7. Должна появиться новая строка с вашим `user_id`

---

## 🔍 Решение проблем

### Проблема: "Function deployed successfully", но данные не загружаются

**Причина**: RLS всё ещё включён

**Решение**:
1. Выполните SQL из `supabase/migrations/002_disable_rls_for_testing.sql`
2. Проверьте: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
3. Все таблицы должны иметь `rowsecurity = f`

---

### Проблема: "Invalid Telegram signature"

**Причина**: Неправильный BOT_TOKEN

**Решение**:
1. Проверьте секрет в Supabase → Settings → Secrets
2. Убедитесь, что токен точно такой же, как у @BotFather
3. Пересоздайте Edge Function

---

### Проблема: "No hash found in initData"

**Причина**: Telegram не передаёт initData

**Решение**:
1. Закройте Mini App полностью
2. Откройте заново
3. Проверьте, что бот настроен правильно (`/setmenubutton`)

---

### Проблема: "BOT_TOKEN not configured"

**Причина**: Секрет не добавлен в Edge Function

**Решение**:
1. Settings → Secrets → New Secret
2. Name: `BOT_TOKEN`
3. Value: токен бота
4. Пересоздайте Edge Function

---

### Проблема: Белый экран в Telegram

**Причина**: Ошибка JavaScript

**Решение**:
1. Откройте консоль (F12)
2. Посмотрите ошибки
3. Проверьте Environment Variables на Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Пересоберите проект: `git push origin main`

---

## 📊 Проверка работы

### В Supabase Table Editor:

**Таблица `users`**:
```
┌──────┬─────────────┬──────────┬────────────┐
│ id   │ tg_id       │ username │ first_name │
├──────┼─────────────┼──────────┼────────────┤
│ uuid │ 123456789   │ ivan     │ Иван       │
└──────┴─────────────┴──────────┴────────────┘
```

**Таблица `transactions`** (после добавления расхода):
```
┌──────┬──────────┬─────────────┬────────┬───────┐
│ id   │ user_id  │ category_id │ amount │ type  │
├──────┼──────────┼─────────────┼────────┼───────┤
│ uuid │ uuid     │ cat-uuid    │ 500    │ expense│
└──────┴──────────┴─────────────┴────────┴───────┘
```

### В консоли браузера:

```
🔐 Verifying Telegram initData...
✅ Telegram user verified: 123456789 Иван
✅ User saved to database: uuid-123-456-789
✅ User authenticated: { id: 'uuid-...', ... }
📥 Loading transactions for user: uuid-...
✅ Loaded transactions: 1
```

---

## 🔄 Включение RLS обратно (для продакшена)

После успешного тестирования включите RLS для безопасности:

```sql
-- Включите RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Создайте политики (из 001_initial_schema.sql)
CREATE POLICY "Users can manage own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own budgets" ON budgets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own goals" ON goals
  FOR ALL USING (auth.uid() = user_id);
```

⚠️ **Важно**: После включения RLS нужно настроить Supabase Auth для генерации JWT токенов. Это сложнее, но безопаснее.

---

## ✅ Итоговый чек-лист

- [ ] Edge Function `verify-telegram` обновлена (новый код без внешних библиотек)
- [ ] Секрет `BOT_TOKEN` добавлен
- [ ] RLS отключён для тестирования (SQL из `002_disable_rls_for_testing.sql`)
- [ ] Код запушен на GitHub
- [ ] Vercel пересобрал проект
- [ ] В Telegram видны реальные данные (не 85000₽)
- [ ] Добавленные расходы сохраняются в Supabase
- [ ] В консоли видны логи: `✅ User authenticated`, `✅ Loaded transactions`

---

## 📝 Что изменилось в коде

### Edge Function (`supabase/functions/verify-telegram/index.ts`):

**Было** (с ошибкой):
```typescript
import { createHMAC } from 'https://deno.land/x/hmac@v2.0.1/mod.ts'
// ❌ Требует внешних разрешений
```

**Стало** (работает):
```typescript
// Используем встроенный Web Crypto API
async function createHMAC(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data)
  return new Uint8Array(signature)
}
// ✅ Работает без внешних библиотек
```

### Упрощена авторизация:

**Было**: Edge Function возвращала JWT токен + сессию
**Стало**: Edge Function возвращает только `user` (без JWT)

Это упрощает архитектуру и позволяет быстро протестировать приложение.

---

## 🎯 Следующие шаги

1. **Протестируйте все функции** в Telegram
2. **Проверьте сохранение данных** в Supabase Table Editor
3. **Поделитесь ботом** с друзьями для тестирования
4. **Соберите feedback** и улучшайте приложение
5. **Включите RLS** для продакшена (когда будете готовы)

---

**Готово! Edge Function должна задеплоиться без ошибок.** 🚀

Если возникнут проблемы — напишите, помогу разобраться!

---

## 📚 Дополнительные файлы

- `supabase/functions/verify-telegram/index.ts` — исправленная Edge Function
- `supabase/migrations/002_disable_rls_for_testing.sql` — отключение RLS
- `src/lib/supabase.ts` — обновлённая функция авторизации
- `src/context/AppContext.tsx` — логирование загрузки данных
