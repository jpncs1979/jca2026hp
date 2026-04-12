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
--   DB は整数（1, 2, …）。画面・CSV ではアプリが 4 桁ゼロ埋め（0001）で表示します。
--   残った profiles は 1 から連番に振り直し、member_number_seq も次の新規が
--   重複しないようリセットします（新規会員は「最後の番号 + 1」から）。
-- =============================================================================

BEGIN;

-- 管理者以外の会員プロフィール（子テーブルは CASCADE で削除）
DELETE FROM public.profiles
WHERE COALESCE(is_admin, false) = false;

-- 会員番号を 1 から振り直す（UNIQUE 回避のため負値 → 正の連番の 2 段階）
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at NULLS LAST, id)::integer AS rn
  FROM public.profiles
)
UPDATE public.profiles p
SET member_number = -o.rn,
    updated_at = now()
FROM ordered o
WHERE p.id = o.id;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at NULLS LAST, id)::integer AS rn
  FROM public.profiles
)
UPDATE public.profiles p
SET member_number = o.rn,
    updated_at = now()
FROM ordered o
WHERE p.id = o.id;

-- シーケンス: 残件が 0 なら次は 1、それ以外は max(member_number) の次から
SELECT CASE
  WHEN NOT EXISTS (SELECT 1 FROM public.profiles) THEN
    setval('public.member_number_seq', 1, false)
  ELSE
    setval(
      'public.member_number_seq',
      (SELECT MAX(member_number)::bigint FROM public.profiles),
      true
    )
END;

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
