# 🔄 Переход с демо на реальную версию

## 📋 Что изменится

| Демо-режим | Реальная версия |
|------------|-----------------|
| Захардкоженные данные (85000₽) | Данные из Supabase |
| Все пользователи видят одно | Каждый видит свои данные |
| Изменения не сохраняются | Всё сохраняется в БД |
| Работает без настройки | Требует настройки Edge Function |

---

## 🎯 Пошаговая инструкция

### ШАГ 1: Настройка Edge Function в Supabase

#### 1.1 Откройте Supabase Dashboard

1. Перейдите на [supabase.com](https://supabase.com)
2. Выберите ваш проект `financebot`

#### 1.2 Создайте Edge Function

1. В левом меню нажмите **Edge Functions** (иконка ⚡)
2. Нажмите **"New Function"**
3. Name: `verify-telegram`
4. Скопируйте код из файла `supabase/functions/verify-telegram/index.ts`
5. Вставьте в редактор
6. Нажмите **"Deploy"**

#### 1.3 Добавьте секрет (BOT_TOKEN)

1. Перейдите в **Settings** → **Secrets** (или **Edge Functions** → **Secrets**)
2. Нажмите **"New Secret"**
3. Заполните:
   - **Name**: `BOT_TOKEN`
   - **Value**: токен вашего бота из @BotFather
   
   Пример:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

4. Нажмите **"Save"**

⚠️ **Важно**: Если у вас ещё нет бота, создайте его:
1. Откройте [@BotFather](https://t.me/BotFather)
2. `/newbot` → укажите имя и username
3. Скопируйте токен

---

### ШАГ 2: Обновление фронтенда для работы с авторизацией

Теперь нужно обновить код, чтобы он использовал реальную авторизацию через Telegram.

#### 2.1 Обновите файл `src/lib/supabase.ts`

Откройте файл и замените содержимое на:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Функция для верификации Telegram и получения сессии
export async function authenticateWithTelegram() {
  const tg = window.Telegram?.WebApp;
  
  if (!tg?.initData) {
    console.log('Not in Telegram, using demo mode');
    return null;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/verify-telegram`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ initData: tg.initData }),
      }
    );

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const { user, session } = await response.json();

    // Устанавливаем сессию в Supabase
    if (session?.access_token) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }

    return user;
  } catch (error) {
    console.error('Telegram auth error:', error);
    return null;
  }
}
```

#### 2.2 Обновите файл `src/context/AuthContext.tsx`

Замените функцию `fetchUser` на:

```typescript
const fetchUser = async () => {
  try {
    setLoading(true);
    setError(null);

    // Пытаемся авторизоваться через Telegram
    const { authenticateWithTelegram } = await import('../lib/supabase');
    const tgUser = await authenticateWithTelegram();

    if (tgUser) {
      // Успешная авторизация — используем реального пользователя
      setUser(tgUser);
    } else {
      // Не в Telegram или ошибка — используем демо-режим
      console.log('Using demo mode');
      const demoUser: User = {
        id: 'demo-user',
        tg_id: 123456789,
        username: 'demo_user',
        first_name: 'Демо',
        monthly_income: 85000,
        created_at: new Date().toISOString(),
      };
      setUser(demoUser);
    }
  } catch (err: any) {
    console.error('Error fetching user:', err);
    setError(err.message);
    
    // Fallback на демо-режим
    const demoUser: User = {
      id: 'demo-user',
      tg_id: 123456789,
      username: 'demo_user',
      first_name: 'Демо',
      monthly_income: 85000,
      created_at: new Date().toISOString(),
    };
    setUser(demoUser);
  } finally {
    setLoading(false);
  }
};
```

---

### ШАГ 3: Пересборка и деплой

#### 3.1 Локально

```bash
npm run dev
```

Откройте http://localhost:3000 — приложение должно работать в демо-режиме.

#### 3.2 Деплой на Vercel

```bash
git add .
git commit -m "Add Telegram authentication"
git push origin main
```

Vercel автоматически пересоберёт и задеплоит.

---

### ШАГ 4: Тестирование в Telegram

#### 4.1 Откройте Mini App через бота

1. Найдите вашего бота в Telegram
2. Нажмите **Start** или `/start`
3. Нажмите кнопку **"💰 Финансы"**
4. Приложение откроется

#### 4.2 Проверьте авторизацию

Откройте консоль браузера (F12) и посмотрите логи:

**Если видите:**
```
Not in Telegram, using demo mode
```
→ Приложение работает в демо-режиме (нормально для браузера)

**Если видите:**
```
Using demo mode
```
→ Edge Function не настроена или ошибка авторизации

**Если видите:**
```
User authenticated: { id: '...', tg_id: 123456789 }
```
→ ✅ Авторизация работает!

---

### ШАГ 5: Проверка реальных данных

#### 5.1 Добавьте данные через Telegram

1. Откройте Mini App в Telegram
2. Укажите зарплату (например, 100000₽)
3. Добавьте расход (например, 500₽ в категорию "Кафе")
4. Создайте цель (например, "Новый телефон" на 50000₽)

#### 5.2 Проверьте в Supabase

1. Откройте Supabase Dashboard
2. Перейдите в **Table Editor**
3. Проверьте таблицы:
   - **users** — должен быть ваш пользователь
   - **transactions** — должны быть ваши расходы
   - **goals** — должны быть ваши цели

#### 5.3 Проверьте в браузере

1. Откройте приложение в браузере (не через Telegram)
2. Должны увидеть демо-данные (85000₽)
3. Это нормально — в браузере нет Telegram initData

---

## 🔧 Решение проблем

### Проблема: "Invalid signature"

**Причина**: Неправильный BOT_TOKEN

**Решение**:
1. Проверьте секрет в Supabase → Settings → Secrets
2. Убедитесь, что токен точно такой же, как у @BotFather
3. Пересоздайте Edge Function

### Проблема: "No user in initData"

**Причина**: Telegram не передаёт данные пользователя

**Решение**:
1. Убедитесь, что бот настроен правильно (`/setmenubutton`)
2. Попробуйте закрыть и снова открыть Mini App
3. Проверьте, что используете последнюю версию Telegram

### Проблема: Данные не сохраняются

**Причина**: RLS политики блокируют запись

**Решение**:
1. Откройте Supabase → Authentication → Policies
2. Проверьте, что политики созданы для всех таблиц
3. Убедитесь, что SQL-миграция выполнена полностью

### Проблема: Белый экран в Telegram

**Причина**: Ошибка JavaScript

**Решение**:
1. Откройте консоль (F12)
2. Посмотрите ошибки
3. Проверьте, что Environment Variables добавлены на Vercel
4. Пересоберите проект

---

## 📊 Сравнение режимов

### Демо-режим (браузер)

✅ Работает без настройки  
✅ Быстрый старт  
❌ Все видят одинаковые данные  
❌ Изменения не сохраняются  
❌ Нет реальной авторизации  

### Реальная версия (Telegram)

✅ Каждый пользователь видит свои данные  
✅ Всё сохраняется в Supabase  
✅ Настоящая авторизация через Telegram  
✅ Haptic feedback работает  
✅ Темы Telegram применяются  
⚠️ Требует настройки Edge Function  

---

## 🎯 Итоговый чек-лист

- [ ] Edge Function `verify-telegram` создана
- [ ] Секрет `BOT_TOKEN` добавлен
- [ ] Файл `src/lib/supabase.ts` обновлён
- [ ] Файл `src/context/AuthContext.tsx` обновлён
- [ ] Код запушен на GitHub
- [ ] Vercel пересобрал проект
- [ ] В Telegram видны реальные данные (не 85000₽)
- [ ] В Supabase → Table Editor видны ваши транзакции
- [ ] Добавление расходов работает
- [ ] Создание целей работает

---

## 🚀 Что дальше?

После успешного перехода на реальную версию:

1. **Протестируйте все функции** в Telegram
2. **Поделитесь ботом** с друзьями
3. **Соберите feedback** и улучшайте приложение
4. **Добавьте новые функции**:
   - Уведомления о превышении бюджета
   - Экспорт данных в Excel
   - Совместные цели с друзьями
   - Аналитика по неделям

---

**Напишите, когда настроите Edge Function — помогу с тестированием!** 🚀

---

## 📝 Быстрая шпаргалка

```bash
# 1. Создать Edge Function в Supabase
# Settings → Edge Functions → New Function → verify-telegram

# 2. Добавить секрет
# Settings → Secrets → New Secret → BOT_TOKEN = ваш_токен

# 3. Обновить код локально
# Измените src/lib/supabase.ts и src/context/AuthContext.tsx

# 4. Запушить
git add .
git commit -m "Add Telegram auth"
git push origin main

# 5. Проверить в Telegram
# Откройте бота → нажмите кнопку → проверьте консоль
```

Готово! Теперь ваше приложение работает с реальными данными! 🎉
