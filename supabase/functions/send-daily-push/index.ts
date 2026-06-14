import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// base64url → Uint8Array
function b64ToUint8(base64: string): Uint8Array {
  const pad = base64.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(pad)
  return Uint8Array.from(bin, c => c.charCodeAt(0))
}

async function buildVapidHeaders(endpoint: string) {
  const vapidPublic  = Deno.env.get('VAPID_PUBLIC_KEY')!
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!
  const subject      = Deno.env.get('VAPID_SUBJECT')!
  const url          = new URL(endpoint)
  const audience     = `${url.protocol}//${url.host}`
  const now          = Math.floor(Date.now() / 1000)
  const exp          = now + 43200

  const header  = { alg: 'ES256', typ: 'JWT' }
  const payload = { aud: audience, exp, sub: subject }
  const enc = (obj: unknown) => btoa(JSON.stringify(obj)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')
  const sigInput = `${enc(header)}.${enc(payload)}`

  const privateKeyBytes = b64ToUint8(vapidPrivate)
  const cryptoKey = await crypto.subtle.importKey(
    'raw', privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign'],
  )
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(sigInput),
  )
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')

  const jwt = `${sigInput}.${sigB64}`
  return {
    Authorization: `vapid t=${jwt},k=${vapidPublic}`,
    'Content-Type': 'application/octet-stream',
    'TTL': '86400',
  }
}

async function encryptPayload(payload: string, p256dh: string, auth: string): Promise<Uint8Array> {
  const serverKeys = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const clientKey  = await crypto.subtle.importKey('raw', b64ToUint8(p256dh), { name: 'ECDH', namedCurve: 'P-256' }, false, [])

  const sharedBits = await crypto.subtle.deriveBits({ name: 'ECDH', public: clientKey }, serverKeys.privateKey, 256)
  const authInfo   = new TextEncoder().encode('Content-Encoding: auth\0')
  const salt       = crypto.getRandomValues(new Uint8Array(16))
  const authBytes  = b64ToUint8(auth)

  const ikm = await crypto.subtle.importKey('raw', sharedBits, { name: 'HKDF' }, false, ['deriveBits'])
  const prk = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: authBytes, info: authInfo }, ikm, 256)
  const prkKey = await crypto.subtle.importKey('raw', prk, { name: 'HKDF' }, false, ['deriveBits'])

  const serverPub = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeys.publicKey))
  const clientPub = b64ToUint8(p256dh)
  const keyInfo   = new Uint8Array([...new TextEncoder().encode('Content-Encoding: aesgcm\0'), 0, ...clientPub.slice(0,65), 0, ...serverPub.slice(0,65)])
  const nonceInfo = new Uint8Array([...new TextEncoder().encode('Content-Encoding: nonce\0'),  0, ...clientPub.slice(0,65), 0, ...serverPub.slice(0,65)])

  const contentKey = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: keyInfo  }, prkKey, 128)
  const nonceBits  = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: nonceInfo}, prkKey, 96)

  const aesKey = await crypto.subtle.importKey('raw', contentKey, { name: 'AES-GCM' }, false, ['encrypt'])
  const data   = new TextEncoder().encode(JSON.stringify({ title: '매일수학', body: payload, icon: '/icons/icon-192.png' }))
  const padded = new Uint8Array([0, 0, ...data])
  const ct     = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: new Uint8Array(nonceBits), tagLength: 128 }, aesKey, padded)

  const out = new Uint8Array(salt.length + 4 + 1 + serverPub.length + new Uint8Array(ct).length)
  let offset = 0
  out.set(salt, offset); offset += salt.length
  const rs = new DataView(new ArrayBuffer(4)); rs.setUint32(0, 4096, false)
  out.set(new Uint8Array(rs.buffer), offset); offset += 4
  out.set([serverPub.length], offset); offset += 1
  out.set(serverPub, offset); offset += serverPub.length
  out.set(new Uint8Array(ct), offset)
  return out
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { message } = await req.json().catch(() => ({ message: '오늘의 수학 연습을 시작해요! 🌟' }))

    const { data: subs } = await supabase.from('push_subscriptions').select('*')
    if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const results = await Promise.allSettled(subs.map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
      const headers  = await buildVapidHeaders(sub.endpoint)
      const body     = await encryptPayload(message, sub.p256dh, sub.auth)
      const res = await fetch(sub.endpoint, { method: 'POST', headers, body })
      if (res.status === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      }
      return res.status
    }))

    const sent = results.filter(r => r.status === 'fulfilled').length
    return new Response(JSON.stringify({ sent, total: subs.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
