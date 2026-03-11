# Stripe Webhook 本番設定の手順（入会完了メールを届けるため）

入会申し込みでクレジットカード決済が完了したときに、本人と事務局にメールを送るには、**Stripe が「決済が終わったよ」とあなたのサイトに通知する仕組み（Webhook）** を本番用に設定する必要があります。

ここでは「Vercel にデプロイしたサイト」を前提に、**Stripe の Webhook URL を本番の URL に設定する手順**を説明します。

---

## 前提

- サイトはすでに **Vercel** にデプロイしてあり、**本番の URL**（`https://jca2026hp.vercel.app` または独自ドメイン）で公開されていること。
- **Stripe** のアカウントがあり、本番用のキー（シークレットキー・Webhook 用の秘密）を使う準備ができていること。

---

## 手順の流れ（2つ）

1. **Vercel に環境変数を入れる**（Stripe の秘密の値とメール設定）
2. **Stripe の管理画面で「Webhook」を追加し、本番の URL を登録する**

---

## 手順 1：Vercel に環境変数を設定する

Vercel にデプロイしたサイトが、Stripe とメール送信で使う「秘密の値」を読み込めるようにします。

1. ブラウザで **Vercel** にログインし、このプロジェクト（日本クラリネット協会のサイト）を開く。
2. 画面上方の **「Settings」** をクリック。
3. 左メニューから **「Environment Variables」** を選ぶ。
4. 次の変数を **1つずつ** 追加する。  
   （ローカルの `.env.local` に書いている値と同じものを入れます。）

   | 名前（Name） | 値（Value） | 備考 |
   |-------------|-------------|------|
   | `STRIPE_SECRET_KEY` | `sk_live_...` またはテストなら `sk_test_...` | Stripe の「開発者」→「API キー」でコピー |
   | `STRIPE_WEBHOOK_SECRET` | （手順 2 のあとで入れる） | 後述の「Webhook の署名シークレット」 |
   | `EMAIL_USER` | 送信に使う Gmail アドレス | 例：`jpncs1979@gmail.com` |
   | `EMAIL_APP_PASSWORD` | Gmail の「アプリ パスワード」 | 2段階認証を有効にしたうえで発行 |
   | `EMAIL_FROM` | 送信元の表示（任意） | 例：`日本クラリネット協会 <jpncs1979@gmail.com>` |
   | `NEXT_PUBLIC_SITE_URL` | 本番の URL | 例：`https://jca2026hp.vercel.app` |
   | `NEXT_PUBLIC_SUPABASE_URL` | （既存の Supabase の URL） | そのまま |
   | `SUPABASE_SERVICE_ROLE_KEY` | （既存の Supabase のキー） | そのまま |

5. 各変数で **Environment** は **Production**（本番）にチェックを入れて保存する。
6. 環境変数を追加・変更したあとは、**「Deployments」** から最新のデプロイを「Redeploy」して、設定を反映させる。

※ `STRIPE_WEBHOOK_SECRET` は、次の手順 2 で Stripe に Webhook を追加したあとで表示される `whsec_...` をコピーして、ここに貼り付ける。

---

## 手順 2：Stripe の管理画面で Webhook を本番 URL に設定する

Stripe に「決済が完了したら、この URL に通知して」と伝えます。

### 2-1. Stripe のダッシュボードを開く

1. ブラウザで [https://dashboard.stripe.com](https://dashboard.stripe.com) を開く。
2. ログインする。
3. 本番で使う場合は画面上部の **「本番モード」**、テストだけの場合は **「テストモード」** を選んでおく。

### 2-2. Webhook を追加する

1. 画面右上の **「開発者」**（Developer）をクリック。
2. 左メニューから **「Webhook」**（Webhooks）を選ぶ。
3. **「エンドポイントを追加」**（Add endpoint）または **「+ エンドポイントを追加」** をクリック。

### 2-3. ステップ1：イベントを選択する（ここでは URL を入力しない）

1. 最初の画面は **「イベントを選択」** です。  
   **注意：この画面の検索欄に Webhook の URL は入力しません。** 検索欄は「イベント名」を検索するためのものです。URL を入れると「イベントが見つかりません」になり、次に進めません。
2. 検索欄を **空** にするか、**「checkout」** と入力してイベント一覧を絞り込む。
3. 一覧から **`checkout.session.completed`** を探し、**チェックを入れる**。  
   （チェックアウトが完了したときのイベント。入会決済完了でメールを送るために必須）
4. **「続行 →」** をクリックして次のステップへ進む。

### 2-4. ステップ2以降：送信先のタイプ・送信先を設定する

1. 表示に従って **送信先のタイプ** を選び、次へ進む。
2. **「送信先を設定する」**（または「エンドポイント URL」を入力する画面）で、初めて **URL を入力** する。

   ```
   https://jca2026hp.vercel.app/api/webhooks/stripe
   ```

   ※ 独自ドメインを使う場合は、そのドメインに読み替えてください（例：`https://jp-clarinet.org/api/webhooks/stripe`）。

   ※ `https://` まで含め、末尾は `/api/webhooks/stripe` にすること。

3. **「エンドポイントを追加」**（または「作成」）をクリックして保存する。

### 2-5. 「署名シークレット」をコピーして Vercel に入れる

1. 追加した Webhook の行をクリックして、詳細を開く。
2. **「署名シークレット」**（Signing secret）の **「表示」** または **「Reveal」** をクリックする。
3. 表示された **`whsec_` で始まる長い文字列** をコピーする。
4. **Vercel** の **Settings → Environment Variables** に戻る。
5. **`STRIPE_WEBHOOK_SECRET`** の値を、今コピーした `whsec_...` に設定（新規追加または上書き）する。
6. 必要なら **Redeploy** して反映させる。

---

## 動作確認のしかた

1. 本番のサイトで **入会申し込み** のページを開く。
2. テスト用のクレジットカード（Stripe のテスト番号など）で決済まで完了する。
3. 申し込み時に入力した **本人のメールアドレス** に「ご入会手続きが完了しました」が届くか確認する。
4. 事務局用に設定した **`OFFICE_NOTIFY_EMAIL`**（未設定なら `EMAIL_USER`）に「【事務局】新規入会の通知」が届くか確認する。

届かない場合は、Vercel の **「Deployments」→ 該当デプロイ → 「Functions」** や **「Logs」** で、`/api/webhooks/stripe` が呼ばれているか・エラーが出ていないかを確認してください。

---

## まとめ

| やること | どこで |
|----------|--------|
| 本番用の Stripe キー・メール設定・Webhook 用の秘密を入れる | Vercel の **Settings → Environment Variables** |
| 「決済完了したらこの URL に通知する」と登録する | Stripe の **開発者 → Webhook → エンドポイントを追加** |
| エンドポイント URL | `https://jca2026hp.vercel.app/api/webhooks/stripe` |
| イベント | `checkout.session.completed` にチェック |
| 表示された署名シークレット `whsec_...` | Vercel の `STRIPE_WEBHOOK_SECRET` にそのまま貼り付け |

これで、本番で入会申し込みの決済が完了したタイミングで、Stripe があなたのサイトに通知し、本人・事務局へメールが送信されるようになります。
