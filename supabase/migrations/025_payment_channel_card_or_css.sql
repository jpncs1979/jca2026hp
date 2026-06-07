-- ============================================
-- 支払い経路を「カード」か「CSS」の2種類に統一
-- ============================================
-- 方針:
--   - 会費の支払い方法は card（クレジットカード）か CSS（口座振替）の2種類のみ。
--   - しくみネット・振込（payment_channel='other' で note が 'CSS' 以外）などの旧経路は廃止し、
--     カードに統一する（マイページからカード登録を促す）。
--   - CSS（payment_channel_note='CSS' または is_css_user=true）はそのまま残す
--     （CSS の今後の扱いは別途相談）。

-- 1) CSS 以外（=しくみネット・振込・行き止まり等）をすべて card に正規化
UPDATE profiles
SET
  payment_channel = 'card',
  payment_channel_note = NULL,
  is_css_user = false,
  updated_at = now()
WHERE COALESCE(payment_channel_note, '') <> 'CSS'
  AND COALESCE(is_css_user, false) <> true
  AND (
    payment_channel IS DISTINCT FROM 'card'
    OR payment_channel_note IS NOT NULL
    OR is_css_user IS DISTINCT FROM false
  );

-- 2) CSS は payment_channel='other' + note='CSS' + is_css_user=true に揃える（表記ゆれ吸収）
UPDATE profiles
SET
  payment_channel = 'other',
  payment_channel_note = 'CSS',
  is_css_user = true,
  updated_at = now()
WHERE (payment_channel_note = 'CSS' OR is_css_user = true)
  AND (
    payment_channel IS DISTINCT FROM 'other'
    OR COALESCE(payment_channel_note, '') IS DISTINCT FROM 'CSS'
    OR is_css_user IS DISTINCT FROM true
  );

COMMENT ON COLUMN profiles.payment_channel IS
  '会費継続の支払い経路: card=Stripeカード, other=CSS口座振替（payment_channel_note=''CSS''）。この2種類のみ。';
