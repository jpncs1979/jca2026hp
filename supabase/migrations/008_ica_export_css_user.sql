-- ============================================
-- ICA連携出力用・CSS/カード切替用
-- ============================================

-- ICA: 希望フラグと出力済みトラッキング（is_ica_member は「ICA会員として登録済み」、ica_requested は「ICA希望」）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ica_requested BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ica_exported BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ica_exported_at TIMESTAMPTZ;

-- CSS（口座振替）対象者フラグ。true=CSS対象、false=カード等に切替済みでCSS対象外
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_css_user BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_ica_requested_exported ON profiles(ica_requested, ica_exported) WHERE ica_requested = true;
CREATE INDEX IF NOT EXISTS idx_profiles_ica_exported_at ON profiles(ica_exported_at) WHERE ica_exported_at IS NOT NULL;
