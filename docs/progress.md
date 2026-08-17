# StoryLog 작업 진행사항

> 최종 업데이트: 2026-08-12  
> 브랜치: `main`  
> 저장소: https://github.com/kyujinjung/StoryLog

---

## 1. 한 줄 요약

**스포일러 안전 스토리 메모 웹앱(StoryLog)** 의 Phase 1 MVP · AI 초안 · Phase 2 커뮤니티 라운지 · CGV 스타일 UI · 대표 포스터까지 구현하고 `main`에 푸시했다.

---

## 2. 제품 목표 (재확인)

| 항목 | 내용 |
|------|------|
| 문제 | 긴 작품에서 인물/사건/관계가 기억나지 않음. 위키는 스포 위험 |
| 핵심 가치 | **어디까지 봤는지 기준으로** 인물·사건·관계·용어를 안전하게 보여 줌 |
| 스택 | Next.js (App Router) + Supabase + Tailwind + React Flow + SpaceXAI(xAI) |
| 배포 전 상태 | 로컬 + Supabase 클라우드 연동. Vercel 배포는 미진행 |

원본 기획: `docs/app_idea.md`

---

## 3. 완료된 기능

### 3.1 Phase 1 MVP (개인 메모)

| 기능 | 경로 / 위치 | 비고 |
|------|-------------|------|
| 작품 CRUD 목록 | `/works`, `/works/new` | 유형·장르·메모 |
| 회차 추가/수정/삭제 | 작품 상세 | `reveal_order` 유니크, 자동 할당 |
| 현재 감상 위치(진행도) | 작품 상세 Progress | 서버에서 회차 기준 재계산 |
| 인물·사건·용어·메모 | 작품 상세 Lore | 공개 회차 필수 |
| 스포일러 필터 | `src/lib/spoiler-filter.ts` | 공개 회차의 `reveal_order` ≤ 진행도 |
| 빠른 복습 | `/works/[id]/review` | 진행도 이하만 + 검색 |
| 인물 관계도 | `/works/[id]/graph` | React Flow, 양 끝 공개 시만 |
| 로그인 | `/login` + `/auth/callback` | Supabase 매직 링크 |

### 3.2 AI 초안 정리

| 항목 | 내용 |
|------|------|
| 프로바이더 | SpaceXAI (xAI) — `XAI_API_KEY`, `https://api.x.ai/v1` |
| 모델 | 기본 `grok-4.5` (`XAI_MODEL`로 변경 가능) |
| 흐름 | 메모 입력 → 초안 생성 → **체크한 항목만** 저장 (자동 저장 없음) |
| 추출 대상 | 인물, 사건, 용어, 메모, 관계 |
| 코드 | `src/lib/ai/*`, `src/app/works/ai-actions.ts`, `src/components/ai/lore-draft-panel.tsx` |

### 3.3 Phase 2 커뮤니티 라운지

| 항목 | 내용 |
|------|------|
| 경로 | `/works/[id]/lounge` |
| 공유 키 | 작품 **제목 정규화** (`title_key`) — 같은 제목 = 같은 라운지 |
| 글/댓글 | 유형 + **스포 범위(회차)** 필수 |
| 필터 | `spoiler_reveal_order ≤ 내 진행도` 만 표시 (미설정 시 order 0만) |
| 메모 저장 | 보이는 글을 개인 `notes`로 복사 |
| 마이그레이션 | `supabase/migrations/20260812010000_phase2_community.sql` |

### 3.4 UI / UX (CGV 스타일)

| 항목 | 내용 |
|------|------|
| 테마 | 다크 배경 + 레드 액센트(`#E71A0F`) |
| 폰트 | Noto Sans KR + Black Han Sans |
| 헤더 | 상단 레드 라인, sticky 블러 네비 |
| 하단 탭 | 홈 · 내 작품 · 등록 · MY |
| 작품 목록 | 포스터 그리드 + 검색/유형 필터 |
| 회차 목록 | 상영 회차표(EP 티켓 UI, NOW 뱃지, 접어 수정) |
| 코드 | `src/app/globals.css`, `layout.tsx`, `components/layout/bottom-nav.tsx` 등 |

### 3.5 대표 이미지(포스터)

| 항목 | 내용 |
|------|------|
| 입력 | 파일 업로드 또는 이미지 URL |
| 저장 | `works.cover_image_url` 컬럼 **또는** `metadata.cover_image_url` (마이그레이션 폴백) |
| Storage | 버킷 `work-covers` (공개 읽기). 없으면 1.5MB 이하 data URL 폴백 |
| 표시 | 내 작품 포스터 카드, 상세 헤더 |
| 마이그레이션 | `supabase/migrations/20260812020000_work_cover_image.sql` |
| 유틸 | `src/lib/work-cover.ts` — `getWorkCoverUrl()` |

---

## 4. 주요 버그 수정 이력

| 이슈 | 원인 | 해결 |
|------|------|------|
| 회차 2개 이상 저장 실패 | `reveal_order` 중복 + 폼 `defaultValue` 미갱신 | 서버 자동 할당 + 폼 동기화 |
| 1화 진행인데 2화 인물 노출 | 진행도/엔티티 `reveal_order` 불일치 | 회차 링크 기준 필터, 진행도 서버 재조회 |
| 진행도 저장 후 드롭다운이 “아직 시작 전” | 클라이언트 state와 서버 props 미동기화 | `useEffect` + form key + `useActionState` |
| 대표 이미지 목록 미표시 | DB에 `cover_image_url` 컬럼 없음(마이그레이션 미적용) | metadata 폴백 + 이중 저장/이중 조회 |

---

## 5. 커밋 타임라인 (`main`)

| 커밋 | 메시지 요약 |
|------|-------------|
| `c385123` | Phase 1 web MVP + 스포 필터 기반 |
| `b0e3056` | Step1 버그수정 (회차/진행도/스포 등) |
| `f6d2480` | AI lore draft (SpaceXAI, 승인 후 저장) |
| `fd99420` | Phase 2 커뮤니티 라운지 |
| `b74d1c7` | CGV 다크 시네마 테마 |
| `ab1fb73` | 작품 포스터 업로드/목록 |
| `372063c` | 하단 탭 · 검색 · 회차표 |
| `f08bd7b` | 커버 컬럼 없을 때 metadata 폴백 |

---

## 6. 저장소 구조 (앱 코드)

```
src/
  app/                 # 라우트 (home, login, works/*, auth)
  components/          # UI, works, ai, community, graph, layout
  lib/                 # data, spoiler-filter, ai, work-cover, supabase
  types/database.ts    # 도메인 타입
supabase/migrations/   # Phase1 foundation, Phase2 community, cover image
docs/
  app_idea.md          # 기획 원본
  progress.md          # 본 문서 (진행사항)
```

---

## 7. 환경 변수

```bash
# 필수
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# 선택
SUPABASE_SERVICE_ROLE_KEY=
XAI_API_KEY=                 # AI 초안
XAI_MODEL=grok-4.5           # 선택
```

- 템플릿: `.env.local.example`
- 시크릿은 커밋하지 않음 (`.gitignore`에 `.env*.local`)

---

## 8. Supabase 마이그레이션 체크리스트

로컬/클라우드에 순서대로 적용했는지 확인:

1. `20260812000000_phase1_foundation.sql` — 작품·회차·로어·RLS  
2. `20260812010000_phase2_community.sql` — 라운지 spaces/posts/comments  
3. `20260812020000_work_cover_image.sql` — `cover_image_url` + `work-covers` 버킷  

Auth URL (로컬):

- Site URL: `http://localhost:3000`
- Redirect: `http://localhost:3000/auth/callback`

---

## 9. 로컬 실행

```bash
npm i
cp .env.local.example .env.local   # 값 채우기
npm run dev
```

- 앱: http://localhost:3000  
- 빌드 검증: `npm run build`

---

## 10. 남은 일 / 다음 후보

| 우선 | 항목 | 상태 |
|------|------|------|
| 1 | Supabase 마이그레이션 3종 프로덕션 적용 확인 | **점검 완료 → Phase2·커버 미적용**. `docs/deploy.md` + `APPLY_PENDING_phase2_and_cover.sql` 참고 |
| 2 | Vercel 배포 + 환경 변수 | **가이드 작성** (`docs/deploy.md`). CLI 로그인/대시보드 배포는 운영자 실행 |
| 3 | 라운지 신고/운영, 닉네임 표시 | 미착수 |
| 4 | 자연어 검색(기획 6.2) | 미착수 |
| 5 | React Native 모바일 확장 | 장기 |

헬스체크: `node --env-file=.env.local scripts/check-supabase.mjs`

---

## 11. 설계 원칙 (유지)

1. 정보마다 **공개 시점(회차 / reveal_order)** 을 붙인다.  
2. 사용자 진행도보다 앞선 정보는 숨긴다.  
3. AI는 **초안 + 사용자 승인**, 자동 저장 금지.  
4. 커뮤니티는 자유 게시판보다 **스포 범위가 있는 작품 라운지**.  
5. MVP는 스포 없는 복습 경험을 우선 검증한다.

---

## 12. 관련 문서

| 파일 | 설명 |
|------|------|
| `docs/app_idea.md` | 앱 아이디어·MVP 범위·우선순위 원본 |
| `docs/app_idea.txt` | 아이디어 초안 대화 기록 |
| `docs/storylog_app_concept.pptx` | 컨셉 발표 자료 |
| `README.md` | 실행·환경·주요 플로우 요약 |
| `docs/progress.md` | **본 진행사항 문서** |
