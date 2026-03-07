-- ============================================
-- コンクールマスタ（複数コンクール対応）
-- ============================================
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  reference_date DATE NOT NULL,
  category_options JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 例: 第15回ヤングコンクール 2026
INSERT INTO competitions (slug, name, year, reference_date, category_options) VALUES
  ('young-2026', '第15回ヤングコンクール', 2026, '2026-04-01'::DATE, '["ジュニアA", "ジュニアB", "ヤング"]'::JSONB)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 申込テーブル（コンクール共通）
-- ============================================
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  furigana TEXT NOT NULL,
  birth_date DATE NOT NULL,
  age_at_reference INTEGER NOT NULL,
  member_type TEXT NOT NULL CHECK (member_type IN ('会員', '非会員', '同時入会')),
  member_number TEXT,
  category TEXT NOT NULL,
  selected_piece_preliminary TEXT,
  selected_piece_final TEXT,
  video_url TEXT,
  accompanist_info TEXT,
  payment_date TIMESTAMPTZ,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for applications" ON applications
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for applications" ON applications
  FOR INSERT WITH CHECK (true);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_applications_competition_id ON applications(competition_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_category ON applications(category);
CREATE INDEX IF NOT EXISTS idx_applications_payment_status ON applications(payment_status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);

-- ============================================
-- 協会お知らせテーブル
-- ============================================
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  publish_date DATE NOT NULL,
  is_important BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for news" ON news
  FOR SELECT USING (publish_date <= CURRENT_DATE);

CREATE INDEX IF NOT EXISTS idx_news_publish_date ON news(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_is_important ON news(is_important);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
