#!/usr/bin/env node
/**
 * StoryLog Supabase health check (anon key is enough for schema probes).
 * Usage: node --env-file=.env.local scripts/check-supabase.mjs
 *    or: set -a && source .env.local && set +a && node scripts/check-supabase.mjs
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`
};

async function probe(label, path) {
  const res = await fetch(`${url}/rest/v1/${path}`, { headers });
  const body = await res.text();
  let ok = res.status === 200;
  let note = body.slice(0, 160);

  // 200 with empty array is fine (RLS may hide rows)
  if (res.status === 401 || res.status === 403) {
    // schema exists but RLS blocked without user — treat as OK for table existence
    ok = true;
    note = "auth/RLS (table exists)";
  }

  if (res.status === 404 || body.includes("PGRST205")) {
    ok = false;
    note = "table missing";
  }

  if (body.includes("42703") || body.includes("does not exist")) {
    ok = false;
    note = body.slice(0, 160);
  }

  return { label, status: res.status, ok, note };
}

async function probeBucket(name) {
  // GET /bucket/{id} often 404s for anon even when the bucket exists.
  // Probing a missing public object is more reliable:
  // - NoSuchKey / Object not found → bucket exists (public)
  // - NoSuchBucket → bucket missing
  // - InvalidMimeType on upload also implies the bucket exists
  const res = await fetch(
    `${url}/storage/v1/object/public/${name}/__storylog_probe__.jpg`,
    { headers }
  );
  const body = await res.text();

  if (body.includes("NoSuchKey") || body.includes("Object not found") || body.includes("not_found")) {
    return {
      label: `storage:${name}`,
      status: res.status,
      ok: true,
      note: "ok (bucket reachable via public object API)"
    };
  }

  if (body.includes("NoSuchBucket") || body.includes("Bucket not found")) {
    // Fallback: authenticated upload probe (bucket may be private)
    const up = await fetch(`${url}/storage/v1/object/${name}/__storylog_probe__.jpg`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "image/jpeg",
        "x-upsert": "true"
      },
      body: Buffer.alloc(0)
    });
    const upBody = await up.text();

    if (
      upBody.includes("InvalidMimeType") ||
      upBody.includes("Unauthorized") ||
      upBody.includes("new row violates") ||
      upBody.includes("row-level security") ||
      up.status === 200 ||
      up.status === 400
    ) {
      // 400 without NoSuchBucket usually means bucket exists but policy/auth blocked
      if (!upBody.includes("NoSuchBucket") && !upBody.includes("Bucket not found")) {
        return {
          label: `storage:${name}`,
          status: up.status,
          ok: true,
          note: "ok (bucket exists; set Public ON for open reads if needed)"
        };
      }
    }

    return {
      label: `storage:${name}`,
      status: res.status,
      ok: false,
      note: body.slice(0, 160)
    };
  }

  // 200 would mean a probe object exists (unexpected but fine)
  if (res.status === 200) {
    return {
      label: `storage:${name}`,
      status: res.status,
      ok: true,
      note: "ok"
    };
  }

  return {
    label: `storage:${name}`,
    status: res.status,
    ok: false,
    note: body.slice(0, 160)
  };
}

const checks = [
  await probe("phase1:works", "works?select=id&limit=1"),
  await probe("phase1:episodes", "episodes?select=id&limit=1"),
  await probe("phase1:characters", "characters?select=id&limit=1"),
  await probe("phase1:user_progress", "user_progress?select=id&limit=1"),
  await probe("cover:works.cover_image_url", "works?select=cover_image_url&limit=1"),
  await probe("phase2:community_spaces", "community_spaces?select=id&limit=1"),
  await probe("phase2:community_posts", "community_posts?select=id&limit=1"),
  await probe("phase2:community_comments", "community_comments?select=id&limit=1"),
  await probeBucket("work-covers")
];

console.log(`Supabase: ${url}\n`);
console.log("Check                              Status  OK   Note");
console.log("-".repeat(90));

let failed = 0;
for (const c of checks) {
  const mark = c.ok ? "yes" : "NO ";
  if (!c.ok) failed += 1;
  console.log(
    `${c.label.padEnd(34)} ${String(c.status).padEnd(7)} ${mark}  ${c.note}`
  );
}

console.log("-".repeat(90));
if (failed === 0) {
  console.log("\nAll checks passed.");
  process.exit(0);
}

console.log(`\n${failed} check(s) failed.`);

const onlyStorage =
  failed === 1 && checks.some((c) => c.label === "storage:work-covers" && !c.ok);

if (onlyStorage) {
  console.log("\nOnly the Storage bucket is missing. Create it in the Dashboard:");
  console.log("  1. Supabase → Storage → New bucket");
  console.log("  2. Name: work-covers");
  console.log("  3. Public bucket: ON");
  console.log("  4. Create");
  console.log("  5. SQL Editor → run APPLY_STORAGE_policies_only.sql");
  console.log("Then re-run: npm run check:supabase");
} else {
  console.log("Apply pending SQL:");
  console.log("  supabase/migrations/APPLY_PENDING_phase2_and_cover.sql");
  console.log("in Supabase Dashboard → SQL Editor → Run");
}

process.exit(1);
