import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

  try {
    const { token, sku } = await req.json()
    if (!token || !sku) return json({ error: 'token and sku required' }, 400)

    // ── 1. 사용자 인증 ────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? ''
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    // ── 2. Google Play API 검증 (서비스 계정 설정 시 활성화) ────────
    const saJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
    if (saJson) {
      try {
        const accessToken = await getGoogleAccessToken(saJson)
        const PACKAGE_NAME = 'com.dailymath.app'
        const verifyUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptions/${sku}/tokens/${token}`
        const verifyRes = await fetch(verifyUrl, { headers: { Authorization: `Bearer ${accessToken}` } })
        const purchase = await verifyRes.json()

        if (!verifyRes.ok) return json({ error: 'Google Play verification failed', detail: purchase }, 400)
        if (purchase.paymentState !== 1 && purchase.paymentState !== 2) {
          return json({ error: 'Payment not completed', paymentState: purchase.paymentState }, 400)
        }

        const periodEnd = new Date(parseInt(purchase.expiryTimeMillis, 10))
        await upsertSubscription(user.id, token, sku, periodEnd)

        // acknowledge (3일 내 안 하면 자동 환불)
        await fetch(`${verifyUrl}:acknowledge`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: '{}',
        })

        return json({ ok: true, periodEnd: periodEnd.toISOString() })
      } catch (e) {
        return json({ error: `Google verification error: ${e}` }, 500)
      }
    }

    // ── 3. 서비스 계정 미설정 시 — 토큰만 저장하고 1개월 Pro 부여 ──
    //      (개발/테스트 단계용. 실서비스 전 Google API 연동 필요)
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + 1)
    await upsertSubscription(user.id, token, sku, periodEnd)

    return json({ ok: true, periodEnd: periodEnd.toISOString(), mode: 'dev' })

  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

// ── 헬퍼: DB upsert ──────────────────────────────────────────────
async function upsertSubscription(userId: string, token: string, sku: string, periodEnd: Date) {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const { error } = await supabaseAdmin.from('subscriptions').upsert({
    user_id: userId,
    status: 'active',
    plan: 'pro',
    period_end: periodEnd.toISOString(),
    purchase_token: token,
    sku,
  }, { onConflict: 'user_id' })
  if (error) throw new Error(`DB upsert failed: ${JSON.stringify(error)}`)
}

// ── 헬퍼: Google 서비스 계정 → access token ──────────────────────
async function getGoogleAccessToken(saJson: string): Promise<string> {
  const sa = JSON.parse(saJson)
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

  const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const now = Math.floor(Date.now() / 1000)
  const header  = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }))

  const sigBuf = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key,
    new TextEncoder().encode(`${header}.${payload}`),
  )
  let sigBinary = ''
  new Uint8Array(sigBuf).forEach(b => { sigBinary += String.fromCharCode(b) })
  const jwt = `${header}.${payload}.${b64url(sigBinary)}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`Google token error: ${JSON.stringify(data)}`)
  return data.access_token as string
}
