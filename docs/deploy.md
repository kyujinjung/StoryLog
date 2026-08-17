# StoryLog 1순위: 마이그레이션 + Vercel 배포

## A. Supabase 마이그레이션 점검 결과 (2026-08-12 기준)

| 항목 | 상태 |
|------|------|
| Phase 1 (`works`, `episodes`, `characters` …) | ✅ 존재 |
| Phase 2 (`community_spaces/posts/comments`) | ❌ 없음 |
| `works.cover_image_url` | ❌ 없음 |
| Storage `work-covers` | ❌ 없음 |

### 지금 할 일 (필수, 약 1분)

1. [Supabase SQL Editor](https://supabase.com/dashboard/project/yblsvtjcutfpxlsjkfgj/sql/new) 열기  
2. 아래 파일 **전체** 붙여넣기 후 **Run**  
   - `supabase/migrations/APPLY_PENDING_phase2_and_cover.sql`  
   - (Phase 2 라운지 + 커버 컬럼 + storage 버킷 한 번에)  
   - **Phase 1 foundation SQL은 다시 실행하지 마세요.**  
     (`work_status already exists` 는 Phase 1을 재실행했을 때 나는 정상 오류입니다.)
3. 로컬에서 검증:

```bash
# 프로젝트 루트, .env.local 로드된 상태
set -a && source .env.local && set +a
node scripts/check-supabase.mjs
```

또는:

```bash
node --env-file=.env.local scripts/check-supabase.mjs
```

모두 `yes` 이면 마이그레이션 완료.

### Storage 버킷만 실패할 때 (`work-covers` 404)

테이블/컬럼은 OK인데 버킷만 없으면 — **대시보드 생성이 더 확실**합니다.
(일부 프로젝트는 SQL로 `storage.buckets` insert가 막혀 있습니다.)

**방법 B — 대시보드 (권장)**

1. https://supabase.com/dashboard/project/yblsvtjcutfpxlsjkfgj/storage/buckets  
2. **New bucket**  
3. 설정:
   - **Name:** `work-covers` (철자 정확히)
   - **Public bucket:** **ON** (토글)
   - File size limit: 5 MB (선택)
   - Allowed MIME: image/* (선택)
4. **Create bucket**  
5. 목록에 `work-covers`가 보이는지 확인  
6. SQL Editor에서 `supabase/migrations/APPLY_STORAGE_policies_only.sql` 실행 (업로드 RLS)  
7. `npm run check:supabase`

**방법 A — SQL (막히면 B로)**

`supabase/migrations/APPLY_STORAGE_work_covers_only.sql` 실행

### Auth URL (로컬 + 배포 후)

**Authentication → URL Configuration**

| 환경 | Site URL | Redirect URLs에 추가 |
|------|----------|----------------------|
| 로컬 | `http://localhost:3000` | `http://localhost:3000/auth/callback` |
| Vercel | `https://<your-app>.vercel.app` | `https://<your-app>.vercel.app/auth/callback` |

여러 개를 동시에 등록해도 됩니다.

**중요:** Redirect URL은 경로까지 일치해야 합니다.  
`/auth/callback` 이 빠지면 매직 링크 클릭 후 로그인이 안 됩니다.

앱 코드는 세션 쿠키를 콜백 응답에 심고, `middleware`로 세션을 갱신합니다.
로그인 실패 시 `/login?error=...&message=...` 로 사유가 표시됩니다.

---

## B. Vercel 배포

### Framework / Output Directory (중요)

Next.js 앱이므로:

| 설정 | 올바른 값 |
|------|-----------|
| **Framework Preset** | **Next.js** |
| **Output Directory** | **비워 두기** (또는 기본값, `public` 넣지 말 것) |
| **Build Command** | `npm run build` |
| **Install Command** | `npm install` |

`Output Directory = public` 이면  
`No Output Directory named "public" found` 오류가 납니다.  
repo에 `public/` 폴더와 `vercel.json`(`framework: nextjs`)을 넣어 두었습니다.

Settings → General → **Build & Development Settings** 에서  
Framework가 Next.js인지, Output Directory가 비어 있는지 확인하세요.

### 사전 조건

- GitHub `main` 최신 푸시 완료
- Vercel 계정 (GitHub 연동 권장)
- 로컬 `.env.local`에 넣을 값 준비:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `XAI_API_KEY` (AI 초안용, 선택)

### 방법 1: 대시보드 (권장)

1. https://vercel.com/new  
2. **Import** `kyujinjung/StoryLog`  
3. Framework: Next.js (자동 감지)  
4. **Environment Variables** 추가:

| Name | Value | Environments |
|------|--------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key | Production, Preview, Development |
| `XAI_API_KEY` | xAI API key | Production, Preview |
| `XAI_MODEL` | `grok-4.5` (선택) | Production, Preview |

5. **Deploy**  
6. 배포 URL 확인 후 Supabase Redirect URL에  
   `https://<project>.vercel.app/auth/callback` 추가  
7. 브라우저에서 `/login` → 매직 링크 → `/works` 스모크 테스트

### 방법 2: CLI

```bash
# 1회 로그인 (브라우저)
vercel login

# 프로젝트 루트
cd /Users/kyujin/Documents/GitHub/StoryLog

# 프로젝트 연결 + 프로덕션 배포
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add XAI_API_KEY
vercel --prod
```

---

## C. 배포 후 체크리스트

- [ ] `node scripts/check-supabase.mjs` 전부 yes  
- [ ] Vercel 빌드 성공  
- [ ] 홈/로그인 로드  
- [ ] 매직 링크 로그인 (리다이렉트 URL 등록 여부)  
- [ ] 작품 목록 · 포스터 업로드  
- [ ] 회차/진행도 · 스포 필터  
- [ ] AI 초안 (키 넣은 경우)  
- [ ] 작품 라운지 글 작성  

---

## D. 관련 파일

| 파일 | 용도 |
|------|------|
| `supabase/migrations/APPLY_PENDING_phase2_and_cover.sql` | 미적용 마이그레이션 묶음 |
| `scripts/check-supabase.mjs` | 스키마/버킷 헬스체크 |
| `docs/progress.md` | 전체 진행사항 |
| `.env.local.example` | 환경 변수 템플릿 |
