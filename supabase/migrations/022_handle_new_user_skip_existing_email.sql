-- Auth 新規ユーザー作成時、既に同じメールの profiles があれば INSERT しない。
-- （事務局の「復活」で createUser した際に、pending の二重行ができて user_id UNIQUE で復活失敗するのを防ぐ）

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE lower(trim(COALESCE(p.email, ''))) = lower(trim(COALESCE(NEW.email, '')))
      AND trim(COALESCE(NEW.email, '')) <> ''
  ) THEN
    RETURN NEW;
  END IF;

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

COMMENT ON FUNCTION public.handle_new_user() IS 'auth.users INSERT 後: 未登録メールのみ profiles を pending で作成。既存メールはスキップ（復活・紐付けはアプリ側で実施）。';
