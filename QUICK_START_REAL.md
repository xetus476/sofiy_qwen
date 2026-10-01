# 🚀 Быстрый переход на реальную версию

## ✅ Что уже сделано

Код обновлён и готов к работе с реальными данными:
- ✅ AuthContext — авторизация через Telegram
- ✅ AppContext — загрузка данных из Supabase
- ✅ Edge Function — верификация Telegram initData
- ✅ Оптимистичные обновления UI
- ✅ Fallback на демо-режим при ошибках

---

## 📋 Что нужно сделать (5 минут)

### 1️⃣ Создайте Edge Function в Supabase

1. Откройте [supabase.com](https://supabase.com) → ваш проект
2. **Edge Functions** → **"New Function"**
3. Name: `verify-telegram`
4. Скопируйте код из `supabase/functions/verify-telegram/index.ts`
5. Вставьте → **Deploy**

### 2️⃣ Добавьте секрет BOT_TOKEN

1. **Settings** → **Secrets** → **"New Secret"**
2. Name: `BOT_TOKEN`
3. Value: токен вашего бота из @BotFather
4. **Save**

⚠️ Если нет бота — создайте через @BotFather: `/newbot`

### 3️⃣ Запушьте код на GitHub

```bash
git add .
git commit -m "Add Telegram authentication"
git push origin main
```

Vercel автоматически пересоберёт проект.

### 4️⃣ Проверьте в Telegram

1. Откройте бота
2. Нажмите кнопку **"💰 Финансы"**
3. Откройте консоль (F12) → посмотрите логи:
   - `✅ User authenticated: {...}` — работает!
   - `📱 Using demo mode` — Edge Function не настроена

### 5️⃣ Добавьте данные

1. Укажите зарплату (например, 100000₽)
2. Добавьте расход
3. Создайте цель
4. Проверьте в Supabase → **Table Editor** — данные должны появиться!

---

## 🎯 Как проверить, что работает

### В Telegram:
- ✅ Видны ваши реальные данные (не 85000₽)
- ✅ Добавленные расходы сохраняются
- ✅ Созданные цели отображаются
- ✅ При перезапуске данные не пропадают

### В Supabase:
- **Table Editor** → **users** — ваш пользователь
- **Table Editor** → **transactions** — ваши расходы
- **Table Editor** → **goals** — ваши цели

### В браузере (не через Telegram):
- ✅ Видны демо-данные (85000₽)
- ✅ Это нормально — нет Telegram initData

---

## 🔧 Решение проблем

### "Invalid signature"
→ Проверьте BOT_TOKEN в Supabase Secrets

### "No user in initData"
→ Закройте и откройте Mini App заново

### Данные не сохраняются
→ Проверьте RLS политики в Supabase (должны быть созданы SQL-миграцией)

### Белый экран
→ Проверьте Environment Variables на Vercel

---

## 📊 Сравнение

| | Демо | Реальная версия |
|---|---|---|
| **Где работает** | Браузер | Telegram |
| **Данные** | 85000₽ (захардкожено) | Ваши реальные данные |
| **Сохранение** | ❌ Нет | ✅ В Supabase |
| **Пользователи** | Все видят одно | Каждый видит своё |
| **Настройка** | Не нужна | Edge Function + BOT_TOKEN |

---

## 🎉 Готово!

После настройки Edge Function приложение будет работать с реальными данными. Каждый пользователь Telegram будет видеть свои собственные финансы, цели и статистику.

**Подробная инструкция**: см. файл `REAL_VERSION_SETUP.md`
