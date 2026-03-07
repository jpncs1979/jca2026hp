# Supabase マイグレーション

## ファイル命名規則

```
001_概要.sql
002_概要.sql
...
```

- **番号 (001, 002, ...)**: 実行順序。既に本番で実行済みのファイルは**変更・リネームしない**
- **概要**: マイグレーションの内容を簡潔に（英語推奨）
- 新規コンクール追加時は `002_add_xxx_competition.sql` のように新しいファイルを追加

## コンクール追加の手順

新しいコンクール（例: 第16回ヤングコンクール 2027）を追加する場合:

```sql
-- 002_add_young_competition_2027.sql
INSERT INTO competitions (slug, name, year, reference_date, category_options) VALUES
  ('young-2027', '第16回ヤングコンクール', 2027, '2027-04-01'::DATE, '["ジュニアA", "ジュニアB", "ヤング"]'::JSONB);
```

カテゴリや条件が異なるコンクールの場合は、`category_options` を適宜変更してください。
