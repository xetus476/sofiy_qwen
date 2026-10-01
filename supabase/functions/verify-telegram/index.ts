// Supabase Edge Function для верификации Telegram WebApp initData
// Использует ТОЛЬКО встроенные Web Crypto API (не требует внешних библиотек)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_TOKEN = Deno.env.get('BOT_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Конвертация hex строки в Uint8Array
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

// Создание HMAC-SHA256 с использованием Web Crypto API
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

// Верификация подписи HMAC-SHA256
async function verifyHMAC(
  key: Uint8Array,
  data: Uint8Array,
  signature: Uint8Array
): Promise<boolean> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )
  return await crypto.subtle.verify('HMAC', cryptoKey, signature, data)
}

// Основная функция верификации Telegram initData
async function verifyTelegramData(initData: string): Promise<any> {
  if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN not configured in Edge Function secrets')
  }

  const encoder = new TextEncoder()

  // Парсим initData как URL параметры
  const urlParams = new URLSearchParams(initData)
  const hash = urlParams.get('hash')

  if (!hash) {
    throw new Error('No hash found in initData')
  }

  // Удаляем hash из параметров для проверки
  urlParams.delete('hash')

  // Создаём data-check-string: все параметры отсортированы по алфавиту
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  // Шаг 1: Создаём secret_key = HMAC-SHA256(key="WebAppData", message=BOT_TOKEN)
  const secretKey = await createHMAC(
    encoder.encode('WebAppData'),
    encoder.encode(BOT_TOKEN)
  )

  // Шаг 2: Создаём подпись = HMAC-SHA256(key=secret_key, message=data_check_string)
  const expectedHash = await createHMAC(
    secretKey,
    encoder.encode(dataCheckString)
  )

  // Шаг 3: Сравниваем с hash из initData
  const actualHash = hexToUint8Array(hash)

  // Проверяем, что длины совпадают
  if (expectedHash.length !== actualHash.length) {
    throw new Error('Hash length mismatch')
  }

  // Побайтовое сравнение (защита от timing attacks)
  let isValid = true
  for (let i = 0; i < expectedHash.length; i++) {
    if (expectedHash[i] !== actualHash[i]) {
      isValid = false
    }
  }

  if (!isValid) {
    throw new Error('Invalid Telegram signature')
  }

  // Парсим данные пользователя
  const userJson = urlParams.get('user')
  if (!userJson) {
    throw new Error('No user data in initData')
  }

  return JSON.parse(decodeURIComponent(userJson))
}

// CORS заголовки
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Обработка CORS preflight запроса
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { initData } = await req.json()

    if (!initData) {
      throw new Error('No initData provided in request body')
    }

    // 1. Верифицируем подпись Telegram
    const tgUser = await verifyTelegramData(initData)

    console.log('✅ Telegram user verified:', tgUser.id, tgUser.first_name)

    // 2. Создаём Supabase client с service role key
    //    (обходит RLS для создания/обновления пользователя)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 3. Создаём или обновляем пользователя в таблице users
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          tg_id: tgUser.id,
          username: tgUser.username || null,
          first_name: tgUser.first_name || null,
        },
        { onConflict: 'tg_id' }
      )
      .select()
      .single()

    if (userError) {
      console.error('❌ Error creating/updating user:', userError)
      throw userError
    }

    console.log('✅ User saved to database:', user.id)

    // 4. Возвращаем данные пользователя
    //    Фронтенд будет использовать user.id для всех запросов
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          tg_id: user.tg_id,
          username: user.username,
          first_name: user.first_name,
          monthly_income: user.monthly_income,
          created_at: user.created_at,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Edge Function error:', error.message)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
