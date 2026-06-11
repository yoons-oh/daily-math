# 매일수학 유료화 설계서 (국내 + 해외 결제)

---

## 1. 플랜 구조

| 구분 | 무료 | 유료 (Pro) |
|------|------|------------|
| 일일 문제 수 | 2문제 | 20문제 |
| 가격 (국내) | 무료 | ₩2,000 / 월 |
| 가격 (해외) | 무료 | $1.99 USD / 월 |
| 오답 복습 | ✅ | ✅ |
| 개념 배우기 | ✅ | ✅ |
| 보상/스티커 | ✅ | ✅ |
| 학습 히스토리 | ❌ | ✅ |

---

## 2. 결제 시스템 구성

### 국내 + 해외 동시 지원 전략

```
사용자 접속
    │
    ├── 국내 (브라우저 locale / 직접 선택)
    │       └── 토스페이먼츠
    │               · 국내 카드
    │               · 카카오페이 / 네이버페이
    │               · 정기결제 (빌링키)
    │
    └── 해외
            └── Stripe
                    · Visa / Mastercard / AMEX
                    · Apple Pay / Google Pay
                    · 구독 자동화 (Subscription API)
```

### 각 PG 비교

| 항목 | 토스페이먼츠 | Stripe |
|------|------------|--------|
| 대상 | 국내 사용자 | 해외 사용자 |
| 수수료 | ~3.3% | 3.4% + $0.05 |
| 구독 방식 | 빌링키 직접 관리 | Subscription 자동 관리 |
| 통화 | KRW | USD / 다중통화 |
| 간편결제 | 카카오페이, 네이버페이 | Apple Pay, Google Pay |
| 자동 재결제 | 직접 구현 (cron) | Stripe가 자동 처리 |
| 영수증/세금 | 직접 처리 | 자동 생성 |

> **핵심:** Stripe는 구독 관리가 내장돼 있어 해외용으로 개발 공수가 훨씬 적음.
> 국내는 토스페이먼츠가 카카오페이 등 지원으로 전환율이 높음.

---

## 3. 데이터베이스 설계

### 추가 테이블 (2개)

#### subscriptions
```sql
CREATE TABLE subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'free',
    -- 'free' | 'active' | 'cancelled' | 'past_due'
  gateway           TEXT,
    -- 'toss' | 'stripe'
  -- 토스페이먼츠 전용
  toss_billing_key  TEXT,            -- 서버에만 보관, 절대 클라이언트 노출 금지
  toss_customer_key TEXT,
  -- Stripe 전용
  stripe_customer_id       TEXT,     -- cus_xxx
  stripe_subscription_id   TEXT,     -- sub_xxx (Stripe가 자동 관리)
  -- 공통
  currency          TEXT DEFAULT 'KRW',   -- 'KRW' | 'USD'
  amount            INTEGER,              -- 2000 (KRW) or 199 (USD cents)
  period_start      TIMESTAMPTZ,
  period_end        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can read own subscription"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);
```

#### payment_logs
```sql
CREATE TABLE payment_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  gateway       TEXT NOT NULL,        -- 'toss' | 'stripe'
  payment_key   TEXT,                 -- 토스 paymentKey 또는 Stripe charge_id
  order_id      TEXT NOT NULL,        -- 고유 주문번호
  amount        INTEGER NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'KRW',
  status        TEXT NOT NULL,        -- 'success' | 'failed' | 'cancelled'
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. Edge Function 설계

### 공통 구조
```
supabase/functions/
  toss-register-billing/     ← 토스 카드 등록 + 첫 결제
  toss-charge-subscription/  ← 토스 월별 자동 결제 (cron)
  stripe-create-checkout/    ← Stripe 구독 세션 생성
  stripe-webhook/            ← Stripe 이벤트 수신 (결제 성공/실패/취소)
  cancel-subscription/       ← 공통 구독 취소
  get-subscription/          ← 구독 상태 조회 (클라이언트 호출)
```

---

### 4-1. `toss-register-billing` (국내)
```
POST /functions/v1/toss-register-billing
Body: { authKey, customerKey }

1. 토스 API: POST /v1/billing/authorizations/issue → billingKey 발급
2. 즉시 첫 결제: POST /v1/billing/{billingKey} (₩2,000)
3. DB: subscriptions.gateway='toss', status='active', period_end=+30일
4. payment_logs 기록
```

### 4-2. `toss-charge-subscription` (국내 자동 결제)
```
매월 cron으로 호출 (Supabase pg_cron)

1. gateway='toss', status='active', period_end < now() 인 row 조회
2. 각 사용자 toss_billing_key로 결제 요청
3. 성공: period_end +30일
4. 실패: status='past_due', 사용자 이메일 알림
```

### 4-3. `stripe-create-checkout` (해외)
```
POST /functions/v1/stripe-create-checkout
Body: { successUrl, cancelUrl }

1. Stripe Customer 생성 또는 기존 조회
2. Stripe Checkout Session 생성 (mode: 'subscription')
3. session.url 반환 → 클라이언트가 Stripe 결제 페이지로 이동
```

### 4-4. `stripe-webhook` (해외 — 가장 중요)
```
Stripe가 자동으로 POST 호출 (결제 성공/실패/취소 시)

처리하는 이벤트:
  customer.subscription.created  → status='active', period_end 설정
  customer.subscription.updated  → period_end 갱신
  customer.subscription.deleted  → status='cancelled'
  invoice.payment_failed         → status='past_due'
  invoice.paid                   → period_end 연장, payment_logs 기록

* Stripe Webhook Secret으로 서명 검증 필수
```

### 4-5. `cancel-subscription` (공통)
```
POST /functions/v1/cancel-subscription

gateway === 'stripe':
  → Stripe API: subscriptions.cancel(stripe_subscription_id)
  → Stripe가 webhook으로 deleted 이벤트 전송 → DB 자동 업데이트

gateway === 'toss':
  → DB: status='cancelled' (period_end까지 Pro 유지)
  → cron에서 만료 시 자동 free 전환
```

---

## 5. 결제 플로우

### 국내 (토스페이먼츠)
```
사용자          프론트엔드             Edge Function          토스 API
  │                │                      │                     │
  │ Pro 구독 클릭   │                      │                     │
  │──────────────▶│                      │                     │
  │               │ toss.requestBillingAuth()                   │
  │               │────────────────────────────────────────────▶│
  │ 카드 등록       │                      │                     │
  │◀──────────────────────────────────────────────────────────│
  │ authKey 콜백   │                      │                     │
  │──────────────▶│                      │                     │
  │               │ toss-register-billing(authKey)              │
  │               │─────────────────────▶│                     │
  │               │                      │ 빌링키 발급 + 즉시 결제│
  │               │                      │────────────────────▶│
  │               │                      │ 성공                  │
  │               │                      │◀───────────────────│
  │               │                      │ DB 업데이트           │
  │ Pro 활성 완료  │◀─────────────────────│                     │
```

### 해외 (Stripe)
```
사용자          프론트엔드             Edge Function          Stripe
  │                │                      │                     │
  │ Pro 구독 클릭   │                      │                     │
  │──────────────▶│                      │                     │
  │               │ stripe-create-checkout()                    │
  │               │─────────────────────▶│                     │
  │               │                      │ Checkout Session 생성│
  │               │                      │────────────────────▶│
  │               │                      │ session.url 반환     │
  │               │◀─────────────────────│                     │
  │               │ window.location = session.url              │
  │ Stripe 결제 페이지에서 카드 입력                             │
  │◀──────────────────────────────────────────────────────────│
  │ 결제 성공 → successUrl 리다이렉트                            │
  │──────────────▶│                      │                     │
  │               │                      │◀─── Webhook 수신 ──│
  │               │                      │ DB 업데이트           │
  │ Pro 활성 확인  │◀─────────────────────│                     │
```

---

## 6. 프론트엔드 설계

### 신규 파일
```
src/
  lib/
    subscription.ts         ← useSubscription 훅, isPro 체크
  pages/
    SubscribePage.tsx        ← 결제 방법 선택 + 결제 UI
    MyPlanPage.tsx           ← 현재 플랜, 취소 버튼
  components/
    UpgradeModal.tsx         ← 한도 초과 시 업그레이드 모달
    PaymentGatewaySelect.tsx ← 국내/해외 결제 선택 UI
```

### SubscribePage 흐름
```
[구독 페이지 진입]
        │
        ▼
[결제 수단 선택]
  ┌─────────────────┐   ┌─────────────────┐
  │  🇰🇷 국내 결제   │   │  🌐 해외 결제    │
  │  ₩2,000/월      │   │  $1.99/월        │
  │  카드/카카오페이  │   │  Visa/Mastercard │
  │  (토스페이먼츠)  │   │  Apple/Google Pay│
  └─────────────────┘   └─────────────────┘
        │                       │
        ▼                       ▼
  토스 카드 등록 팝업      Stripe Checkout 페이지
        │                       │
        └──────────┬────────────┘
                   ▼
            구독 활성화 완료
```

### useSubscription 훅
```typescript
interface Subscription {
  status: 'free' | 'active' | 'cancelled' | 'past_due'
  gateway: 'toss' | 'stripe' | null
  currency: 'KRW' | 'USD' | null
  periodEnd: Date | null
  isPro: boolean
  dailyLimit: number  // isPro ? 20 : 2
}
```

### PracticePage 수정 (한도 체크)
```typescript
const todayCount = getTodayQuestionCount(profile.id)

if (todayCount >= subscription.dailyLimit) {
  if (!subscription.isPro) {
    setShowUpgradeModal(true)   // 업그레이드 모달
  } else {
    setShowDoneMessage(true)    // "오늘 학습 완료!"
  }
  return
}
```

---

## 7. 환경변수 (Supabase Secrets)

```bash
# 토스페이먼츠
TOSS_SECRET_KEY=sk_live_...
TOSS_CLIENT_KEY=ck_live_...   # 클라이언트용 (VITE_ 접두사로 노출 가능)

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...     # Stripe 대시보드에서 생성한 구독 상품 ID

# 프론트엔드 (Vercel 환경변수)
VITE_TOSS_CLIENT_KEY=ck_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 8. 보안 고려사항

| 항목 | 처리 방법 |
|------|-----------|
| 토스 빌링키 | Edge Function에서만 보관, DB에 암호화 저장 권장 |
| Stripe Secret Key | Edge Function secret으로만 관리 |
| Stripe Webhook 검증 | `stripe.webhooks.constructEvent()`로 서명 검증 필수 |
| 결제 금액 검증 | 서버에서 PG API로 직접 확인, 클라이언트 값 신뢰 금지 |
| 한도 우회 방지 | `get-subscription` Edge Function에서 서버사이드 검증 |
| 구독 만료 처리 | period_end 기준으로 서버에서 isPro 판단 (클라이언트 캐시 신뢰 X) |

---

## 9. 개발 순서 (추정 공수)

### Phase 1 — 무료 제한 로직 (1~2일)
- [ ] `subscriptions` 테이블 생성 (SQL 마이그레이션)
- [ ] `getTodayQuestionCount()` 구현
- [ ] `PracticePage` 한도 체크 추가
- [ ] `UpgradeModal` 컴포넌트 제작
- [ ] `useSubscription` 훅 기본 구현

### Phase 2 — 국내 결제 (토스페이먼츠) (2~3일)
- [ ] 토스페이먼츠 계정 + 테스트 키 발급
- [ ] `toss-register-billing` Edge Function
- [ ] `SubscribePage` 국내 결제 UI
- [ ] `toss-charge-subscription` + pg_cron 설정

### Phase 3 — 해외 결제 (Stripe) (2~3일)
- [ ] Stripe 계정 + 구독 상품(Price) 생성
- [ ] `stripe-create-checkout` Edge Function
- [ ] `stripe-webhook` Edge Function (이벤트 처리)
- [ ] Stripe Webhook 엔드포인트 등록
- [ ] `SubscribePage` 해외 결제 UI 추가

### Phase 4 — 구독 관리 (1~2일)
- [ ] `MyPlanPage` (플랜 확인, 취소 버튼)
- [ ] `cancel-subscription` Edge Function
- [ ] past_due 처리 (이메일 알림)

### Phase 5 — 배포 및 검증 (1~2일)
- [ ] 토스/Stripe 실제 키 전환
- [ ] Vercel + Supabase 환경변수 등록
- [ ] 전체 결제 → 한도 변경 → 취소 시나리오 테스트
- [ ] 해외 카드로 실결제 테스트

**총 예상 공수: 7~12일**

---

## 10. 월 수익 시뮬레이션

| 유료 사용자 | 국내 (₩2,000) | 해외 ($1.99) | 합산 월 순수익 |
|-----------|--------------|-------------|-------------|
| 국내 100 + 해외 50 | ₩194,000 | ~₩130,000 | **₩324,000** |
| 국내 500 + 해외 100 | ₩967,000 | ~₩260,000 | **₩1,227,000** |
| 국내 1,000 + 해외 300 | ₩1,934,000 | ~₩780,000 | **₩2,714,000** |

> 해외 수수료: Stripe 3.4% + $0.05/건, 환율 1,350원 기준 계산

---

## 11. 참고 링크

- 토스페이먼츠 정기결제: https://docs.tosspayments.com/guides/billing
- Stripe Checkout (구독): https://stripe.com/docs/billing/subscriptions/checkout
- Stripe Webhook 처리: https://stripe.com/docs/webhooks
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase pg_cron: https://supabase.com/docs/guides/database/extensions/pg_cron
