import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key';

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
