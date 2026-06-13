import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PACKAGE_NAME = 'com.dailymath.app'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function b64url(input: string | Uint8Array): string {
  let binary = ''
  if (typeof input === 'string') {
    binary = input
  } else {
    for (let i = 0; i < input.length; i++) binary += String.fromCharCode(input[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function getGoogleAccessToken(): Promise<string> {
  const sa = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON') ?? '{}')
  const pemBody = (sa.private_key as string)
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')

  const keyDer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'pkcs8', keyDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  )

  const now = Math.floor(Date.now() / 1000)
  const header  = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))

  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key,
    new TextEncoder().encode(`${header}.${payload}`),
  )
  const jwt = `${header}.${payload}.${b64url(new Uint8Array(sig))}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`Google token error: ${JSON.stringify(data)}`)
  return data.access_token as string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

  try {
    const { token, sku } = await req.json()
    if (!token || !sku) return json({ error: 'token and sku required' }, 400)

    // ── 1. 사용자 인증 ──────────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? ''
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    // ── 2. Google Play API로 구매 토큰 검증 ─────────────────────
    const accessToken = await getGoogleAccessToken()
    const baseUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptions/${sku}/tokens/${token}`

    const verifyRes = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const purchase = await verifyRes.json()

    if (!verifyRes.ok) {
      return json({ error: 'Google Play verification failed', detail: purchase }, 400)
    }

    // paymentState: 1=결제완료, 2=무료체험
    if (purchase.paymentState !== 1 && purchase.paymentState !== 2) {
      return json({ error: 'Payment not completed', paymentState: purchase.paymentState }, 400)
    }

    const periodEnd = new Date(parseInt(purchase.expiryTimeMillis, 10))

    // ── 3. DB 업데이트 (service role로 RLS 우회) ─────────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { error: dbErr } = await supabaseAdmin.from('subscriptions').upsert({
      user_id: user.id,
      status: 'active',
      plan: 'pro',
      period_end: periodEnd.toISOString(),
      purchase_token: token,
      sku,
    }, { onConflict: 'user_id' })

    if (dbErr) return json({ error: 'DB update failed', detail: dbErr }, 500)

    // ── 4. 구매 확인 처리 (3일 내 acknowledge 안 하면 자동 환불) ──
    await fetch(`${baseUrl}:acknowledge`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: '{}',
    })

    return json({ ok: true, periodEnd: periodEnd.toISOString() })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})
