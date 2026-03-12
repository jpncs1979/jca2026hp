# クラリネット相談室 テーブル作成

**マイグレーション**: `supabase/migrations/009_consultation_questions.sql`

- ローカルで Supabase CLI を使っている場合は `supabase db push` などで適用できます。
- 手動で実行する場合は、上記マイグレーションファイルの内容を Supabase の SQL Editor にコピーして実行してください。

※ フォーム送信は `/api/consultation`（サーバー・サービスロール）で insert します。事務局の「回答・公開」も API 経由のため、上記 RLS のままです。
