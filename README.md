# 🌟 매일수학 (Daily Math)

초등 기초연산 수학 앱 — React 애니메이션 기반 개념학습 + 매일 덧셈/뺄셈 연습

## 개발 환경 설정

### 1. Node.js 설치 (18+ 권장)
https://nodejs.org

### 2. 의존성 설치
```bash
cd C:\AI kg\daily-math
npm install
```

### 3. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 http://localhost:3000 접속

### 4. 빌드 (배포용)
```bash
npm run build
```

---

## 폴더 구조

```
src/
├── components/
│   ├── MathColumnProblem.tsx   ← 세로셈 표시 컴포넌트
│   ├── NumPad.tsx               ← 숫자 키패드
│   ├── ProfileSelector.tsx      ← 자녀 프로필 선택/추가
│   └── RewardBadge.tsx          ← 보상 팝업/미니 배지
├── features/
│   └── daily-practice/
│       └── problemGenerator.ts  ← 문제 생성 로직 (레벨별)
├── lib/
│   ├── types.ts                 ← 타입 정의
│   ├── storage.ts               ← localStorage 헬퍼
│   ├── rewards.ts               ← 보상 계산 로직
│   └── streak.ts                ← 연속 학습 로직
├── pages/
│   ├── ProfilePage.tsx          ← 프로필 선택 화면
│   ├── Home.tsx                 ← 메인 홈
│   ├── PracticePage.tsx         ← 문제 풀기 (20문제)
│   ├── ResultPage.tsx           ← 결과 화면
│   ├── ReviewPage.tsx           ← 오답 복습
│   ├── ConceptPage.tsx          ← 개념 배우기 (애니메이션)
│   └── RewardsPage.tsx          ← 보상함
├── styles/
│   └── index.css                ← 전역 스타일 (파스텔 테마)
├── App.tsx                      ← 라우팅
└── main.tsx                     ← 엔트리 포인트
```

---

## 1차 MVP 구현 현황

| 기능 | 상태 |
|------|------|
| 멀티 프로필 (자녀 추가/선택) | ✅ |
| 메인 홈 (오늘의 학습, 메뉴) | ✅ |
| 덧셈/뺄셈 레벨별 문제 생성 | ✅ |
| 세로셈 문제 풀기 (숫자 키패드) | ✅ |
| 정답/오답 피드백 애니메이션 | ✅ |
| 결과 화면 (정답률, 오답 목록) | ✅ |
| 오답 복습 | ✅ |
| 별/스티커 보상 시스템 | ✅ |
| 연속 학습 스트릭 | ✅ |
| 개념 배우기 (4가지 애니메이션) | ✅ |
| localStorage 데이터 저장 | ✅ |
| 모바일 최적화 UI | ✅ |

## 2차 개발 예정

- [ ] Supabase 연동 (로그인, 데이터 동기화)
- [ ] TTS 음성 안내 (Web Speech API)
- [ ] Canvas 손글씨 풀이장
- [ ] 레벨 자동 진급 알림
- [ ] 부모 리포트 페이지
- [ ] PWA 설치 지원

---

## 기술 스택

- **React 18** + **Vite** — 빠른 개발 환경
- **TypeScript** — 타입 안전성
- **Tailwind CSS** — 파스텔 UI 스타일링
- **Framer Motion** — 세로셈 애니메이션
- **React Router v6** — 페이지 라우팅
- **localStorage** — 1차 오프라인 데이터 저장

## 설계 원칙 (선생님 관점)

1. **자릿수 강조**: 세로셈에서 일의 자리 → 십의 자리 순서를 색상으로 명확히 구분
2. **받아올림/내림**: 작은 숫자로 시각적 표시, 개념 애니메이션에서 단계별 설명
3. **음수 결과 방지**: 뺄셈 시 항상 num1 ≥ num2 보장
4. **중복 문제 없음**: 동일 세션 내 같은 문제 재출제 금지
5. **아이 눈높이 피드백**: 오류 코드/기술 용어 절대 미사용
6. **터치 영역**: 모든 버튼 최소 44×44px (Apple HIG 기준)
