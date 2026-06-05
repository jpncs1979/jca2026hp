-- =============================================================================
-- 会員番号を 0001 から4桁連番に振り直す（管理者は番号なし）
-- =============================================================================
-- Supabase → SQL Editor で実行。取り消し不可のためバックアップ推奨。
--
-- 表示: アプリが 1 → 0001、2 → 0002 と4桁ゼロ埋めします。
-- DB には整数 1, 2, … を保存します。
-- =============================================================================

BEGIN;

-- 管理者は会員番号を持たない
UPDATE public.profiles
SET member_number = NULL,
    updated_at = now()
WHERE COALESCE(is_admin, false) = true;

-- 非管理者を 1 から連番（UNIQUE 回避のため負値 → 正の連番）
WITH ordered AS (
  SELECT id,
         ROW_NUMBER() OVER (
           ORDER BY member_number NULLS LAST, created_at NULLS LAST, id
         )::integer AS rn
  FROM public.profiles
  WHERE COALESCE(is_admin, false) = false
)
UPDATE public.profiles p
SET member_number = -o.rn,
    updated_at = now()
FROM ordered o
WHERE p.id = o.id;

WITH ordered AS (
  SELECT id,
         ROW_NUMBER() OVER (
           ORDER BY member_number NULLS LAST, created_at NULLS LAST, id
         )::integer AS rn
  FROM public.profiles
  WHERE COALESCE(is_admin, false) = false
)
UPDATE public.profiles p
SET member_number = o.rn,
    updated_at = now()
FROM ordered o
WHERE p.id = o.id;

-- 次の自動採番は max+1
SELECT setval(
  'public.member_number_seq',
  GREATEST(COALESCE((SELECT MAX(member_number) FROM public.profiles), 0), 1),
  (SELECT COUNT(*) > 0 FROM public.profiles WHERE member_number IS NOT NULL)
);

COMMIT;

-- 確認
SELECT member_number, name, email, is_admin
FROM public.profiles
ORDER BY member_number NULLS LAST
LIMIT 20;
