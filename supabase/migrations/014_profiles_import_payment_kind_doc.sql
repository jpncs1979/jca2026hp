-- import_payment_kind の想定値（会費支払い方法列・互換）
COMMENT ON COLUMN profiles.import_payment_kind IS
  '会費支払い方法（Excel「会費支払い方法」列）: css | shikuminet | furikomi | blank | credit_card 。互換: legacy_credit | other | web_transfer | online_stripe_ok | online_stripe_pending';
