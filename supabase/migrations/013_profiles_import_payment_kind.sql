-- Excel 会費支払い方法の区分（一覧の支払い方法表示・絞り込み用）
-- legacy_credit=旧クレジット, other=その他, web_transfer=口座振替WEB, css=CSS, blank=空欄（「-」表示）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS import_payment_kind TEXT;

COMMENT ON COLUMN profiles.import_payment_kind IS
  '会費支払い区分: legacy_credit | other | web_transfer | css | blank（Excel 取り込み・CSV 一括で設定）';
