-- ============================================
-- 会員システム: profiles, memberships, applications拡張, payments
-- ============================================

-- 会員番号シーケンス
CREATE SEQUENCE IF NOT EXISTS member_number_seq START 1;

-- ============================================
-- profiles: 会員基本情報
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  member_number INTEGER UNIQUE DEFAULT nextval('member_number_seq'),
  name TEXT NOT NULL,
  name_kana TEXT NOT NULL,
  email TEXT NOT NULL,
  zip_code TEXT,
  address TEXT,
  phone TEXT,
  affiliation TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'student', 'professional')),
  membership_type TEXT NOT NULL DEFAULT 'regular' CHECK (membership_type IN ('regular', 'student', 'supporting')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired')),
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_member_number ON profiles(member_number);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィールのみ閲覧・更新可能
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 管理者は全会員を閲覧・更新可能（後で is_admin チェック用の関数を追加）
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true)
  );

-- 新規登録時は service role またはトリガーで挿入（RLS では INSERT を制限）
CREATE POLICY "Allow insert for signup" ON profiles
  FOR INSERT WITH CHECK (true);

-- ============================================
-- memberships: 契約・有効期限管理
-- ============================================
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('stripe', 'css', 'transfer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memberships_profile_id ON memberships(profile_id);
CREATE INDEX IF NOT EXISTS idx_memberships_expiry_date ON memberships(expiry_date);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own memberships" ON memberships
  FOR SELECT USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage memberships" ON memberships
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "Allow insert for memberships" ON memberships
  FOR INSERT WITH CHECK (true);

-- ============================================
-- applications: profile_id, amount を追加（既存カラム維持）
-- ============================================
ALTER TABLE applications ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS amount INTEGER;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS selected_piece TEXT;

-- selected_piece は既存の selected_piece_preliminary/final と併用可能
CREATE INDEX IF NOT EXISTS idx_applications_profile_id ON applications(profile_id);

-- applications RLS を拡張: 自分の申込のみ閲覧
DROP POLICY IF EXISTS "Allow public read for applications" ON applications;
CREATE POLICY "Allow read own applications" ON applications
  FOR SELECT USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

-- 管理者は全申込を閲覧
CREATE POLICY "Admins can read all applications" ON applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true)
  );

-- ============================================
-- payments: 入金履歴
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('membership_fee', 'competition_fee')),
  method TEXT CHECK (method IN ('stripe', 'css', 'transfer')),
  transaction_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_profile_id ON payments(profile_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payments" ON payments
  FOR SELECT USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage payments" ON payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "Allow insert for payments" ON payments
  FOR INSERT WITH CHECK (true);

-- ============================================
-- サインアップ時プロフィール自動作成
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, name_kana, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), '（登録後に入力）'),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name_kana'), ''), '（登録後に入力）'),
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- member_contents: 会員限定コンテンツ（Storage連携用メタデータ）
-- ============================================
CREATE TABLE IF NOT EXISTS member_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  content_type TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE member_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active members can read member_contents" ON member_contents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN memberships m ON m.profile_id = p.id
      WHERE p.user_id = auth.uid()
        AND p.status = 'active'
        AND m.expiry_date >= CURRENT_DATE
    )
  );

CREATE POLICY "Admins can manage member_contents" ON member_contents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true)
  );

-- ============================================
-- auth.users 新規作成時に profiles を自動作成
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, name_kana, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'name_kana', ''),
    'pending'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
