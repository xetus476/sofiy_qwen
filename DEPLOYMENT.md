# 🚀 Подробная инструкция по запуску FinanceBot Mini App

## 📋 Что вам понадобится

- Компьютер с Node.js 18+ установленным
- Аккаунт GitHub
- Аккаунт Telegram
- 15-20 минут свободного времени

---

## 🗄️ ШАГ 1: Настройка базы данных Supabase (БЕСПЛАТНО)

### 1.1 Регистрация на Supabase

1. Перейдите на [https://supabase.com](https://supabase.com)
2. Нажмите **"Start your project"**
3. Войдите через GitHub (рекомендуется) или email
4. Подтвердите email

### 1.2 Создание проекта

1. Нажмите **"New Project"**
2. Заполните форму:
   - **Name**: `financebot` (или любое другое)
   - **Database Password**: придумайте надёжный пароль (сохраните его!)
   - **Region**: выберите ближайший (например, Frankfurt для Европы)
   - **Pricing Plan**: Free (бесплатный)
3. Нажмите **"Create new project"**
4. Подождите 1-2 минуты, пока база данных создастся

### 1.3 Выполнение SQL-миграции

1. В левом меню нажмите на иконку **SQL Editor** (📝)
2. Нажмите **"New query"**
3. Откройте файл `supabase/migrations/001_initial_schema.sql` из проекта
4. Скопируйте **весь** SQL-код
5. Вставьте в SQL Editor
6. Нажмите **"Run"** (или Ctrl+Enter)
7. Должно появиться: **"Success. No rows returned"**

✅ Проверка: в левом меню нажмите **Table Editor** — вы должны увидеть таблицы:
- `users`
- `categories` (с 7 предзаполненными категориями)
- `transactions`
- `budgets`
- `goals`

### 1.4 Получение API ключей

1. В левом меню нажмите **Settings** (⚙️) → **API**
2. Найдите раздел **"Project API keys"**
3. Скопируйте два значения:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: длинная строка (начинается с `eyJ...`)

⚠️ **Важно**: Сохраните эти значения — они понадобятся дальше!

---

## 💻 ШАГ 2: Запуск проекта локально

### 2.1 Клонирование/скачивание проекта

```bash
# Если проект на GitHub:
git clone https://github.com/your-username/financebot.git
cd financebot

# Или просто распакуйте архив с проектом
```

### 2.2 Установка зависимостей

```bash
npm install
```

Это установит все необходимые пакеты (React, Supabase, Recharts и т.д.)

### 2.3 Настройка переменных окружения

1. Создайте файл `.env` в корне проекта:

```bash
# На Mac/Linux:
touch .env

# На Windows:
echo. > .env
```

2. Откройте `.env` и вставьте:

```env
VITE_SUPABASE_URL=https://ваш-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=ваш-anon-public-key
```

Замените значения на те, что вы скопировали из Supabase (Шаг 1.4).

### 2.4 Запуск в режиме разработки

```bash
npm run dev
```

Вы увидите:
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

3. Откройте в браузере **http://localhost:3000**

✅ Приложение должно работать в демо-режиме с предзаполненными данными!

---

## 🌐 ШАГ 3: Деплой фронтенда на Vercel (БЕСПЛАТНО)

### 3.1 Регистрация на Vercel

1. Перейдите на [https://vercel.com](https://vercel.com)
2. Нажмите **"Sign Up"**
3. Войдите через GitHub (рекомендуется)

### 3.2 Загрузка проекта на GitHub

Если ещё не загрузили:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/financebot.git
git push -u origin main
```

### 3.3 Деплой на Vercel

1. На Vercel нажмите **"Add New..."** → **"Project"**
2. Найдите ваш репозиторий `financebot` → нажмите **"Import"**
3. Vercel автоматически определит Vite
4. В разделе **"Environment Variables"** добавьте:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: `https://ваш-project-id.supabase.co`
   
   Нажмите **"Add"** и добавьте вторую:
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: `ваш-anon-public-key`

5. Нажмите **"Deploy"**
6. Подождите 1-2 минуты

✅ Через 1-2 минуты получите URL вида: `https://financebot-xxxx.vercel.app`

### 3.4 Альтернатива: Netlify (тоже бесплатно)

1. Перейдите на [https://netlify.com](https://netlify.com)
2. **"Add new site"** → **"Import an existing project"**
3. Выберите GitHub репозиторий
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Добавьте Environment Variables (как в Vercel)
7. Нажмите **"Deploy site"**

---

## 🤖 ШАГ 4: Создание Telegram бота

### 4.1 Создание бота через BotFather

1. Откройте Telegram
2. Найдите **@BotFather** (официальный бот для создания ботов)
3. Отправьте команду `/start`
4. Отправьте `/newbot`
5. BotFather спросит имя бота — введите: `FinanceBot` (или любое)
6. BotFather спросит username — введите уникальное имя, например: `my_finance_bot` (должно заканчиваться на `bot`)
7. ✅ BotFather выдаст **токен** вида: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

⚠️ **Сохраните токен!** Он нужен для下一步.

### 4.2 Настройка Web App кнопки

1. В том же чате с @BotFather отправьте: `/setmenubutton`
2. Выберите вашего бота из списка
3. Отправьте URL вашего приложения:
   ```
   https://financebot-xxxx.vercel.app
   ```
   (URL из Шага 3.3)
4. Отправьте текст кнопки: `💰 Финансы`

✅ Готово! Теперь при открытии бота появится кнопка для запуска Mini App.

### 4.3 Настройка описания бота (опционально)

```
/setdescription → Описание: "Помощник по управлению личными финансами"
/setabouttext → About: "FinanceBot — учёт расходов, бюджет, цели"
/setuserpic → Загрузите аватарку для бота
```

---

## 🔐 ШАГ 5: Настройка аутентификации (опционально)

Для полноценной работы с реальными пользователями нужна Edge Function.

### 5.1 Создание Edge Function

1. В Supabase → **Edge Functions** → **"New Function"**
2. Name: `verify-telegram`
3. Вставьте код из файла `supabase/functions/verify-telegram/index.ts`
4. Добавьте секрет: **Settings** → **Secrets** → **New Secret**
   - Name: `BOT_TOKEN`
   - Value: ваш токен бота из BotFather
5. Нажмите **"Deploy"**

### 5.2 Обновление фронтенда

В файле `src/lib/supabase.ts` замените демо-режим на реальную аутентификацию:

```typescript
// Получить initData от Telegram
const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

if (tgUser) {
  // Вызвать Edge Function для верификации
  const response = await fetch(
    'https://ваш-project-id.supabase.co/functions/v1/verify-telegram',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: window.Telegram.WebApp.initData })
    }
  );
  
  const { session } = await response.json();
  supabase.auth.setSession(session);
}
```

---

## 📱 ШАГ 6: Тестирование в Telegram

### 6.1 Тест через Telegram Desktop

1. Откройте Telegram Desktop
2. Найдите вашего бота по username
3. Нажмите **Start** или `/start`
4. Нажмите кнопку **"💰 Финансы"**
5. ✅ Mini App откроется внутри Telegram!

### 6.2 Тест на мобильном

1. Откройте Telegram на телефоне
2. Найдите бота
3. Нажмите кнопку Web App
4. Приложение откроется на весь экран

### 6.3 Тест через прямую ссылку

Вы также можете открыть приложение напрямую:
```
https://t.me/your_bot_name/app
```

---

## 🎨 ШАГ 7: Кастомизация (опционально)

### 7.1 Изменение категорий

В Supabase → **Table Editor** → **categories**:
- Добавьте новые категории
- Измените иконки и цвета
- Удалите ненужные

### 7.2 Изменение цветовой схемы

В файле `src/index.css` измените CSS-переменные:

```css
:root {
  --tg-theme-button-color: #6366F1; /* ваш основной цвет */
}
```

### 7.3 Добавление новых функций

Создайте новые компоненты в `src/components/` и страницы в `src/pages/`.

---

## 🐛 Решение проблем

### Проблема: "Application failed to load"

**Решение**: Убедитесь, что URL в BotFather начинается с `https://`

### Проблема: Белый экран

**Решение**: Проверьте консоль браузера (F12) на ошибки. Убедитесь, что `.env` настроен правильно.

### Проблема: Данные не сохраняются

**Решение**: Проверьте:
1. Правильность `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`
2. Что SQL-миграция выполнена успешно
3. В Supabase → **Authentication** → **Policies** включены RLS политики

### Проблема: Приложение не открывается в Telegram

**Решение**:
1. Убедитесь, что бот настроен правильно (`/setmenubutton`)
2. URL должен быть HTTPS
3. Попробуйте очистить кэш Telegram

---

## 📊 Бесплатные лимиты Supabase

На бесплатном тарифе вы получаете:
- ✅ 500 МБ база данных
- ✅ 1 ГБ хранилище файлов
- ✅ 50,000 активных пользователей/месяц
- ✅ 500,000 вызовов Edge Functions
- ✅ 2 бесплатных проекта

Этого более чем достаточно для начала!

---

## 🎯 Чек-лист запуска

- [ ] Supabase проект создан
- [ ] SQL-миграция выполнена
- [ ] API ключи скопированы
- [ ] Локально проект запускается (`npm run dev`)
- [ ] `.env` настроен с правильными ключами
- [ ] Проект загружен на GitHub
- [ ] Задеплоен на Vercel/Netlify
- [ ] Telegram бот создан через BotFather
- [ ] Web App кнопка настроена
- [ ] Приложение открывается в Telegram
- [ ] Тестирование на Desktop и Mobile

---

## 📞 Поддержка

Если что-то не работает:
1. Проверьте консоль браузера (F12 → Console)
2. Проверьте логи Supabase (Dashboard → Logs)
3. Проверьте логи Vercel (Dashboard → Deployments → Functions)

Удачи с вашим FinanceBot! 🚀💰
