-- 018 と同内容の再保証（リモートで 018 の一部だけ適用された場合など）
INSERT INTO storage.buckets (id, name, public)
VALUES ('competition_transfer_receipts', 'competition_transfer_receipts', false)
ON CONFLICT (id) DO NOTHING;
