-- 過去データ: ICA希望のみ true で is_ica_member が false の行を ICA会員に揃える
UPDATE profiles
SET is_ica_member = true, updated_at = now()
WHERE ica_requested = true AND is_ica_member = false;
