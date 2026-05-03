-- 住所を都道府県・市区町村・番地・建物名に分割して保持

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_prefecture TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_building TEXT;

COMMENT ON COLUMN profiles.address_prefecture IS '住所：都道府県';
COMMENT ON COLUMN profiles.address_city IS '住所：市区町村';
COMMENT ON COLUMN profiles.address_street IS '住所：番地';
COMMENT ON COLUMN profiles.address_building IS '住所：建物名・部屋番号等';
COMMENT ON COLUMN profiles.address IS '住所：連結表示用（互換・入会時は4項目から自動生成可）';
