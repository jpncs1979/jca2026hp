-- 第19回クラリネット・アンサンブルコンクール（2027）
INSERT INTO competitions (slug, name, year, reference_date, category_options) VALUES
  (
    'ensemble-2027',
    '第19回クラリネット・アンサンブルコンクール',
    2027,
    '2027-01-01'::DATE,
    '["小・中学生部門", "高校生部門", "専門部門", "一般部門"]'::JSONB
  )
ON CONFLICT (slug) DO NOTHING;
