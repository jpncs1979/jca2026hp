-- =============================================================================
-- 会員データ一括削除（管理者プロフィールは残す）
-- =============================================================================
-- Supabase ダッシュボード → SQL Editor で実行してください。
-- 本番・開発いずれも取り消しできません。実行前にバックアップ推奨。
--
-- 削除されるもの:
--   - is_admin が true でない全 profiles
--   - それに紐づく memberships / payments（CASCADE）
-- applications の profile_id は NULL に更新（外部キー SET NULL）
--
-- 残るもの:
--   - is_admin = true の profiles（会員管理に入れる管理者）
--   - member_contents / competitions / applications（申込行そのもの）/ news など
--
-- 会員番号:
--   DB は整数 1, 2, …（画面・CSV は 0001 等4桁ゼロ埋め）。
--   管理者 is_admin は member_number = NULL（0001 は一般会員から）。
--   非管理者のみ 1 から連番。scripts/renumber-member-numbers-4digit.sql も参照。
-- =============================================================================

BEGIN;

-- 管理者以外の会員プロフィール（子テーブルは CASCADE で削除）
DELETE FROM public.profiles
WHERE COALESCE(is_admin, false) = false;

UPDATE public.profiles
SET member_number = NULL,
    updated_at = now()
WHERE COALESCE(is_admin, false) = true;

-- 会員番号を 1 から振り直す（非管理者のみ・UNIQUE 回避のため負値 → 正の連番）
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at NULLS LAST, id)::integer AS rn
  FROM public.profiles
  WHERE COALESCE(is_admin, false) = false
)
UPDATE public.profiles p
SET member_number = -o.rn,
    updated_at = now()
FROM ordered o
WHERE p.id = o.id;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at NULLS LAST, id)::integer AS rn
  FROM public.profiles
  WHERE COALESCE(is_admin, false) = false
)
UPDATE public.profiles p
SET member_number = o.rn,
    updated_at = now()
FROM ordered o
WHERE p.id = o.id;

-- シーケンス: 非管理者が 0 人なら次は 1、それ以外は max(member_number) の次
SELECT setval(
  'public.member_number_seq',
  GREATEST(COALESCE((SELECT MAX(member_number) FROM public.profiles), 0), 1),
  (SELECT COUNT(*) > 0 FROM public.profiles WHERE member_number IS NOT NULL)
);

COMMIT;

-- =============================================================================
-- 任意: 会員用のログイン（auth.users）も整理する
-- =============================================================================
-- profiles に紐づいていないユーザは削除します。管理者用アカウントは
-- profiles.user_id と紐づいていれば残ります。
-- コメントを外して別バッチで実行してください。

-- BEGIN;
-- DELETE FROM auth.users au
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.profiles p WHERE p.user_id = au.id
-- );
-- COMMIT;
