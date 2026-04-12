-- 承認フロー廃止: 既存の承認待ち会員を有効会員にそろえる
UPDATE profiles
SET status = 'active', updated_at = now()
WHERE status = 'pending';
