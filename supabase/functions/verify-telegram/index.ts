import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { createHMAC } from 'https://deno.land/x/hmac@v2.0.1/mod.ts'

const BOT_TOKEN = Deno.env.get('BOT_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Верификация Telegram WebApp initData
async function verifyTelegramData(initData: string): Promise<any> {
  if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN not configured')
  }

  const urlParams = new URLSearchParams(initData)
  const hash = urlParams.get('hash')
  
  if (!hash) {
    throw new Error('No hash in initData')
  }

  // Удаляем hash из параметров
  urlParams.delete('hash')

  // Сортируем параметры и создаём data-check-string
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  // Создаём HMAC-SHA256
  const encoder = new TextEncoder()
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const secret = await crypto.subtle.sign(
    'HMAC',
    secretKey,
    encoder.encode(BOT_TOKEN)
  )

  const key = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  // Конвертируем hash из hex в Uint8Array
  const hashArray = new Uint8Array(hash.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))

  // Верифицируем подпись
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    hashArray,
    encoder.encode(dataCheckString)
  )

  if (!isValid) {
    throw new Error('Invalid signature')
  }

  // Парсим user из auth_date
  const userJson = urlParams.get('user')
  if (!userJson) {
    throw new Error('No user in initData')
  }

  return JSON.parse(userJson)
}

serve(async (req) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    const { initData } = await req.json()

    if (!initData) {
      throw new Error('No initData provided')
    }

    // Верифицируем Telegram данные
    const tgUser = await verifyTelegramData(initData)

    // Создаём Supabase client с service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Создаём или обновляем пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        tg_id: tgUser.id,
        username: tgUser.username || null,
        first_name: tgUser.first_name || null,
      }, {
        onConflict: 'tg_id'
      })
      .select()
      .single()

    if (userError) {
      throw userError
    }

    // Генерируем JWT для пользователя
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: `tg_${tgUser.id}@telegram.local`,
      password: BOT_TOKEN!, // Используем BOT_TOKEN как пароль (безопасно, т.к. это service role)
    })

    // Если пользователь не существует в auth, создаём его
    if (sessionError) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `tg_${tgUser.id}@telegram.local`,
        password: crypto.randomUUID(),
      })

      if (authError) {
        throw authError
      }

      // Возвращаем данные пользователя
      return new Response(
        JSON.stringify({
          user: user,
          session: {
            access_token: authData.session?.access_token,
            refresh_token: authData.session?.refresh_token,
          }
        }),
        { headers, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({
        user: user,
        session: {
          access_token: sessionData.session?.access_token,
          refresh_token: sessionData.session?.refresh_token,
        }
      }),
      { headers, status: 200 }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers, status: 400 }
    )
  }
})
