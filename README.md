# FinanceBot Mini App

Telegram Mini App для управления личными финансами: сбережения, планирование бюджета и отслеживание расходов.

## 📱 Возможности

- **🏠 Главная** — учёт расходов по категориям, управление доходом, создание целей
- **📊 Статистика** — бюджет по категориям с план/факт, прогресс-бары, остатки
- **🎯 Цели** — создание финансовых целей, отслеживание прогресса
- **📈 Аналитика** — графики доходов/расходов, распределение по категориям

## 🛠 Технологический стек

- **Frontend:** React 18 + TypeScript + Vite
- **Стилизация:** Tailwind CSS
- **Графики:** Recharts
- **Анимации:** Framer Motion
- **Роутинг:** React Router v6
- **База данных:** Supabase (PostgreSQL)
- **Интеграция:** Telegram Web App API

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Выполните SQL-миграцию из `supabase/migrations/001_initial_schema.sql` в SQL Editor
3. Скопируйте URL и Anon Key из Settings → API
4. Создайте файл `.env` в корне проекта:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Запуск в режиме разработки

```bash
npm run dev
```

### 4. Сборка для продакшена

```bash
npm run build
```

## 📁 Структура проекта

```
src/
├── main.tsx                    # Точка входа
├── App.tsx                     # Главный компонент с роутингом
├── index.css                   # Глобальные стили + CSS-переменные Telegram
├── context/
│   └── AppContext.tsx          # Глобальное состояние приложения
├── lib/
│   ├── supabase.ts            # Инициализация Supabase client
│   ├── telegram.ts            # Обёртки над Telegram WebApp API
│   └── utils.ts               # Форматирование, утилиты
├── components/
│   ├── Layout.tsx             # Обёртка с Bottom Navigation
│   ├── BottomSheet.tsx        # Переиспользуемая шторка снизу
│   ├── CategoryCard.tsx       # Карточка категории расходов
│   ├── ProgressBar.tsx        # Прогресс-бар
│   ├── GoalCard.tsx           # Карточка цели
│   └── IncomeBlock.tsx        # Блок зарплаты
├── pages/
│   ├── Home.tsx               # Главная страница
│   ├── Stats.tsx              # Статистика бюджета
│   ├── Goals.tsx              # Финансовые цели
│   └── Analytics.tsx          # Графики и аналитика
└── types/
    └── index.ts               # TypeScript интерфейсы
```

## 🤖 Настройка Telegram Bot

### 1. Создание бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot`
3. Укажите имя и username бота
4. Сохраните токен бота

### 2. Настройка Web App

1. Отправьте `/setmenubutton` боту
2. Выберите вашего бота
3. Укажите URL вашего приложения (должен быть HTTPS)
4. Укажите текст кнопки (например: "💰 Финансы")

### 3. Код бота (Node.js + grammY)

```typescript
import { Bot, Keyboard } from 'grammy';

const bot = new Bot('YOUR_BOT_TOKEN');

bot.command('start', (ctx) => {
  ctx.reply('Привет! Я помогу тебе управлять финансами 💰', {
    reply_markup: new Keyboard()
      .webApp('💰 Открыть приложение', { url: 'https://your-app-url.com' })
      .resize()
  });
});

bot.start();
```

## 🔐 Аутентификация

Приложение использует Telegram Web App initData для аутентификации:

1. Фронтенд получает `initData` от Telegram
2. Данные отправляются на Supabase Edge Function
3. Сервер верифицирует HMAC-SHA256 подпись
4. Создаётся/обновляется пользователь в БД
5. Генерируется Supabase JWT для дальнейших запросов

### Edge Function для верификации

```typescript
// supabase/functions/verify-telegram/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BOT_TOKEN = Deno.env.get('BOT_TOKEN');

async function verifyTelegramInitData(initData: string): Promise<boolean> {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  
  const dataCheckString = [...urlParams.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  const secretKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const secret = await crypto.subtle.sign('HMAC', secretKey, new TextEncoder().encode(BOT_TOKEN));
  
  const key = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  return await crypto.subtle.verify(
    'HMAC',
    key,
    hexToUint8Array(hash!),
    new TextEncoder().encode(dataCheckString)
  );
}

serve(async (req) => {
  const { initData } = await req.json();
  const isValid = await verifyTelegramInitData(initData);
  
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid' }), { status: 401 });
  }
  
  // Create/update user and return session
  // ...
});
```

## 🎨 Telegram Theme Integration

Приложение автоматически подстраивается под тему Telegram:
- Светлая/тёмная тема
- Цвета кнопок, текста, фона
- Safe area для iOS

CSS-переменные устанавливаются через Telegram WebApp API:
```css
--tg-theme-bg-color
--tg-theme-text-color
--tg-theme-button-color
--tg-theme-secondary-bg-color
--tg-theme-hint-color
```

## 📦 Деплой

### Frontend (Vercel)

```bash
npm install -g vercel
vercel --prod
```

### Bot (Railway)

1. Создайте проект на [railway.app](https://railway.app)
2. Подключите репозиторий
3. Добавьте переменные окружения: `BOT_TOKEN`, `APP_URL`

## 📄 SQL-миграция

Полный SQL-скрипт для Supabase находится в `supabase/migrations/001_initial_schema.sql`

## 📱 Демо-режим

Приложение работает в демо-режиме без подключения к Supabase, с предзаполненными данными для демонстрации функциональности.

## 📝 Лицензия

MIT
