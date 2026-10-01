import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Функция для верификации Telegram через Edge Function
export async function authenticateWithTelegram(): Promise<any | null> {
  console.log('🔍 [Auth] authenticateWithTelegram called');
  
  const tg = window.Telegram?.WebApp;
  console.log('📱 [Auth] Telegram WebApp:', tg ? 'present' : 'missing');
  console.log('📱 [Auth] initData:', tg?.initData ? 'EXISTS' : 'MISSING');
  
  if (!tg?.initData) {
    console.log('📱 [Auth] Not in Telegram - using demo mode');
    return null;
  }

  try {
    console.log('🔐 [Auth] Verifying Telegram initData...');
    console.log('🔐 [Auth] Supabase URL:', supabaseUrl);
    
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

    console.log('📥 [Auth] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [Auth] HTTP error:', response.status, errorData);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('📥 [Auth] Response:', result);
    
    if (result.success && result.user) {
      console.log('✅ [Auth] User authenticated:', result.user);
      return result.user;
    }

    throw new Error('Invalid response from Edge Function');
  } catch (error: any) {
    console.error('❌ [Auth] Error:', error.message);
    return null;
  }
}
