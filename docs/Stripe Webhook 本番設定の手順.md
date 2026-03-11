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

届かない場合は、次の2つを順に確認してください。

### 入会メールが届かないときの確認（2段階）

**1. Stripe 側：Webhook が届いているか・応答は成功か**

1. Stripe の **開発者 → Webhook** を開く。
2. 登録したエンドポイント（`https://jca2026hp.vercel.app/api/webhooks/stripe`）の行をクリックして詳細を開く。
3. **「最近のイベント」**（Recent events）を確認する。
   - 入会決済のあと、**`checkout.session.completed`** が一覧に出ているか。
   - 各イベントの **応答コード** が **200** か、**4xx / 5xx** かを見る。
     - **200**：サイト側で受け取り成功。この場合は「2. Vercel のログ」へ。
     - **4xx / 5xx**：サイト側でエラー（例：`STRIPE_WEBHOOK_SECRET` の不一致で 400 になることが多い）。Vercel の環境変数と、Stripe の「署名シークレット」が一致しているか確認する。
   - 一覧に **イベント自体がない**：Stripe がこのエンドポイントに送っていない。イベントが `checkout.session.completed` にチェックされているか、本番モード/テストモードの切り替えが正しいか確認する。

**2. Vercel 側：Webhook 処理がどこまで進んでいるか**

1. Vercel の **Deployments → 該当デプロイ → 「Logs」** または **「Functions」** を開く。
2. 入会決済をした **時刻前後** のログで、`/api/webhooks/stripe` を探す。
3. 次のログが出ているか順に確認する。
   - **`[Stripe Webhook] checkout.session.completed`** … イベント受信・metadata あり
   - **`[入会Webhook] 処理開始`** … 入会処理に入った
   - **`[入会Webhook] プロフィール・会員契約・入金記録作成済み、メール送信へ`** … DB まで成功
   - **`[入会Webhook] 本人宛メール送信完了`** … 本人メール送信済み
   - **`[入会Webhook] 事務局宛メール送信完了`** … 事務局メール送信済み

どこまで出ているかで、**Webhook が呼ばれていない／署名エラー／DB エラー／メール送信エラー** のどれかが切り分けられます。

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
