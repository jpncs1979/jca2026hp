-- ============================================
-- インポート会員（user_id 未設定）がログイン時にプロフィール・会員情報を閲覧できるようにする
-- ============================================
-- Excel インポートで作成された profiles は user_id = null のため、
-- 「Users can read own profile」(auth.uid() = user_id) では読めない。
-- メールアドレスが一致する場合に閲覧を許可するポリシーを追加。

CREATE POLICY "Users can read profile by matching email" ON profiles
  FOR SELECT USING (
    user_id IS NULL
    AND LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
  );

-- memberships: メール一致で読める profile の有効期限も閲覧可能に
CREATE POLICY "Users can read memberships for profile by email" ON memberships
  FOR SELECT USING (
    profile_id IN (
      SELECT id FROM profiles
      WHERE user_id IS NULL
      AND LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
    )
  );

-- applications: メール一致で読める profile の申込履歴も閲覧可能に
CREATE POLICY "Users can read applications for profile by email" ON applications
  FOR SELECT USING (
    profile_id IN (
      SELECT id FROM profiles
      WHERE user_id IS NULL
      AND LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
    )
  );
