# Stripe 本番モードへの移行メモ

テストモード（`sk_test_...`）から本番モード（`sk_live_...`）へ切り替え、**実際のクレジットカード決済**を受け付けるための手順です。

関連ドキュメント:

- 決済の全体像: [決済の仕組みメモ.md](./決済の仕組みメモ.md)
- Webhook の詳しい設定: [docs/Stripe Webhook 本番設定の手順.md](./docs/Stripe%20Webhook%20本番設定の手順.md)
- 自動引き落としの実装: [docs/協会入会・自動継続決済_実装メモ.md](./docs/協会入会・自動継続決済_実装メモ.md)

---

## テストモードと本番モードの違い

| 項目 | テストモード | 本番モード |
|------|-------------|-----------|
| API キー | `sk_test_...` / `pk_test_...` | `sk_live_...` / `pk_live_...` |
| 決済 | テストカード番号のみ。実際の引き落としなし | **実カードで実際に課金される** |
| Webhook | テスト用エンドポイントと `whsec_...`（別物） | 本番用エンドポイントと `whsec_...`（別物） |
| Stripe Customer ID | `cus_...`（テスト環境） | `cus_...`（本番環境。**テストの ID は使えない**） |
| ダッシュボード | 右上スイッチで「テストモード」 | 右上スイッチで「本番モード」 |

**重要:** テストモードで登録したカード情報・Customer ID は本番に引き継がれません。本番切替後、会員は改めてカード登録または決済を行う必要があります（現状、カード登録済み会員がいない場合は影響なし）。

---

## 移行前の準備（Stripe 側）

1. [Stripe ダッシュボード](https://dashboard.stripe.com) にログインする。
2. **本番モード**に切り替え、画面の案内に従いアカウントを有効化する。
   - 事業者情報の登録
   - 銀行口座の登録（売上の入金先）
   - 必要書類の提出（審査がある場合あり）
3. 有効化が完了するまで、本番用の `sk_live_...` は使えない、または制限付きのことがあります。

---

## 変更する環境変数

このサイトが Stripe で参照する主な変数は次のとおりです。

| 変数名 | 本番での値 | 備考 |
|--------|-----------|------|
| `STRIPE_SECRET_KEY` | `sk_live_...` | **必須**。サーバー側の決済・Webhook 検証に使用 |
| `STRIPE_WEBHOOK_SECRET` | 本番 Webhook の `whsec_...` | **必須**。テスト用の値とは別 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | `.env.example` に記載あり。現状コードでは未使用（Checkout リダイレクト方式）だが、設定しておくとよい |

その他、決済完了メール等に必要な変数（本番でも同様に Production に設定）:

- `NEXT_PUBLIC_SITE_URL` … 本番 URL（例: `https://japan-clarinet-association.jp`）
- `EMAIL_USER` / `EMAIL_APP_PASSWORD` / `EMAIL_FROM`
- `OFFICE_NOTIFY_EMAIL`（省略時は `EMAIL_USER`）
- `CRON_SECRET` … 1月22日の自動引き落とし Cron 用（本番でも必須）

**秘密情報は Git にコミットしない。** `.env.local` と Vercel の Environment Variables のみで管理する。

---

## 手順 1: 本番 API キーを取得する

1. Stripe ダッシュボード右上を **「本番モード」** にする。
2. **開発者 → API キー** を開く。
3. **公開可能キー**（`pk_live_...`）と **シークレットキー**（`sk_live_...`）をコピーする。
   - シークレットキーは「表示」を押してからコピー。

---

## 手順 2: Vercel（本番）の環境変数を更新する

1. Vercel → 対象プロジェクト → **Settings → Environment Variables**。
2. **Environment: Production** にチェックを入れて、次を設定・更新する。

   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=（手順 3 で取得）
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

3. `NEXT_PUBLIC_SITE_URL` が本番ドメインを指しているか確認する。
4. 保存後、**Deployments → 最新デプロイを Redeploy** して反映する。

※ Preview / Development 用には、引き続き `sk_test_...` を入れておくと、プレビュー環境でテスト決済ができます。

---

## 手順 3: 本番 Webhook を登録する

テスト用 Webhook とは **別エンドポイント・別 `whsec_...`** として本番用を追加します。

1. Stripe ダッシュボードを **本番モード** のまま、**開発者 → Webhook** を開く。
2. **エンドポイントを追加** をクリック。
3. **イベントを選択** 画面で、検索欄に URL は入れない（イベント名の検索用）。
4. **`checkout.session.completed`** にチェックを入れ、次へ進む。
5. **エンドポイント URL** に本番 URL を入力する。

   ```
   https://（本番ドメイン）/api/webhooks/stripe
   ```

   例:

   - `https://japan-clarinet-association.jp/api/webhooks/stripe`
   - または `https://jca2026hp.vercel.app/api/webhooks/stripe`

6. 作成後、**署名シークレット**（`whsec_...`）を表示してコピーする。
7. Vercel の `STRIPE_WEBHOOK_SECRET`（Production）に貼り付け、**Redeploy** する。

詳細・トラブル時の確認方法は [docs/Stripe Webhook 本番設定の手順.md](./docs/Stripe%20Webhook%20本番設定の手順.md) を参照。

---

## 手順 4: ローカル開発用 `.env.local`（任意）

本番キーをローカルに置く必要は通常ありません。ローカルではテストキーのまま開発することを推奨します。

| 用途 | 推奨設定 |
|------|---------|
| 日常の開発 | `sk_test_...` + Stripe CLI の `whsec_...` |
| 本番と同じ動作の最終確認 | 一時的に `sk_live_...` に差し替え（**実課金に注意**） |

ローカルで Webhook を試す場合（テストモード）:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

表示された `whsec_...` を `.env.local` の `STRIPE_WEBHOOK_SECRET` に設定する。

---

## 本番切替後の動作確認チェックリスト

本番モードでは **実際にお金が動きます**。少額・本人カードで、次の4経路を順に確認してください。

### 1. 入会決済（`/membership/join`）

- [ ] Checkout 画面が本番 Stripe（テストバナーなし）で開く
- [ ] 決済完了後、会員登録・入会完了メールが届く
- [ ] Stripe → Webhook → `checkout.session.completed` が **200**
- [ ] Supabase の `profiles.stripe_customer_id` が保存される

### 2. マイページ・カード登録のみ（決済なし）

- [ ] 「会費お支払いカードの登録」から登録できる
- [ ] Webhook 後、`payment_channel` がカード扱いになる
- [ ] その場では課金されない

### 3. マイページ・未納分の支払い

- [ ] 未納会員で Checkout が開き、支払い後に入金記録が付く

### 4. 1月22日の自動引き落とし（事前確認）

- [ ] Vercel に `CRON_SECRET` が Production に設定済み
- [ ] `vercel.json` の Cron（`/api/cron/membership-january-charge`）が有効
- [ ] 本番の `STRIPE_SECRET_KEY` が `sk_live_...` であること（Cron も同じキーを使用）

※ 自動引き落としの本番初回は、対象会員が少ない時間帯に手動テスト API を叩くなど、運用で余裕を持って確認する。

### 5. コンクール申込のカード決済（該当する場合）

- [ ] 申込完了メール・事務局通知が届く

---

## よくあるトラブル

| 症状 | 原因の例 | 対処 |
|------|---------|------|
| Webhook が 400 | `STRIPE_WEBHOOK_SECRET` の不一致（テスト用を本番に入れている等） | 本番 Webhook の `whsec_...` を Vercel Production に再設定して Redeploy |
| 決済は成功するが DB が更新されない | Webhook URL 誤り、イベント未選択 | Stripe の「最近のイベント」で 200 か確認 |
| カード登録済みなのに自動引き落とし失敗 | テスト時の `stripe_customer_id` が残っている | 本番で再登録。または管理画面で ID をクリアして再登録 |
| メールが届かない | `EMAIL_*` 未設定 | `/api/admin/email-test` で送信テスト（管理者ログイン後） |
| テストカードが使えない | 本番モードでは正常 | 実カードで確認。開発はテストモードに戻す |

---

## 本番移行のタイミング（運用上の目安）

- サイトを一般公開し、Basic 認証（`SITE_ACCESS_PASSWORD`）を外したあと
- 事務局が入会・カード登録の問い合わせ対応体制を整えたあと
- Supabase の本番データのバックアップを取得したあと（[Supabaseバックアップ・復元手順.md](./Supabaseバックアップ・復元手順.md)）

---

## 作業の流れ（まとめ）

```
1. Stripe アカウント本番有効化
      ↓
2. 本番 API キー取得（sk_live / pk_live）
      ↓
3. Vercel Production の STRIPE_SECRET_KEY を更新
      ↓
4. 本番 Webhook 追加 → whsec を STRIPE_WEBHOOK_SECRET に設定
      ↓
5. Redeploy
      ↓
6. 入会・カード登録・未納支払いを実カードで確認
      ↓
7. Webhook 200・メール・DB を確認して運用開始
```

テストモードの Webhook・キーは、開発用として残しておいて問題ありません。本番とテストは Stripe ダッシュボード上で完全に分離されています。
