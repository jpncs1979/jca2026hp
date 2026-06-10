# 一般非公開（テスト運用）の設定

**目的**

- **サイト全体** … パスワードがないと見られない  
- **アンサンブル・ヤングだけ** … パスワードなしで見られる（申込ページ含む）

---

## いま全部見えてしまうとき（リセット手順）

次のどちらかが起きていると、**誰でもサイト全体が見えます**。

| 原因 | 対処 |
|------|------|
| `SITE_ACCESS_PASSWORD` が **未設定** または **削除** されている | 下記のとおり **必ず設定し直す** |
| 設定後に **Redeploy していない** | 環境変数保存後、必ず Redeploy |
| Vercel の **Deployment Protection** だけ外した | 問題なし（このサイトは下記の環境変数で制御） |

**やること（この順で）**

1. Vercel → **Settings** → **Environment Variables** を開く  
2. **Production** 用に、下記 **2つ** が入っているか確認（無ければ追加、値を修正）  
3. **Deployments** → 一番上（Production / main）→ **⋯** → **Redeploy**  
4. デプロイが **Ready** になってから、下の「確認チェックリスト」でテスト  

---

## Vercel で設定する環境変数（Production のみ）

[vercel.com](https://vercel.com) → プロジェクト → **Settings** → **Environment Variables**

**Environment** のチェックは **Production だけ** にしてください（Preview / Development は今回は触らなくてよいです）。

### 必ず設定する 2 つ

| Key（名前） | Value（値）の例 | 説明 |
|-------------|-----------------|------|
| `SITE_ACCESS_PASSWORD` | `JcaPreview2026!` など | **サイトの鍵**。これが空だと**全体が一般公開**になります |
| `SITE_ACCESS_PUBLIC_PATHS` | 下記をコピペ | パスワード**不要**で開けるページ |

**`SITE_ACCESS_PUBLIC_PATHS` に貼り付ける値（アンコン＋ヤング）:**

```
/events/ensemble,/events/young-2026
```

※ カンマの前後にスペースは**入れない**  
※ `/events` だけは書かない（イベント一覧まで公開されるため）

### 設定しないもの

| 変数 | 理由 |
|------|------|
| `SITE_ACCESS_USER` | **不要**。ユーザー名は常に `jca`（コード側の既定値） |

### 入力画面での操作

1. **Add New** をクリック  
2. **Key** に `SITE_ACCESS_PASSWORD`  
3. **Value** にパスワード（事務局だけが知る文字列）  
4. **Environments** で **Production** にだけチェック → Save  
5. もう一度 **Add New**  
6. **Key** に `SITE_ACCESS_PUBLIC_PATHS`  
7. **Value** に `/events/ensemble,/events/young-2026`  
8. **Production** にだけチェック → Save  
9. **Deployments** → 最新 Production → **Redeploy**

---

## パスワードなしで開く URL（一般公開の範囲）

`SITE_ACCESS_PUBLIC_PATHS` に書いたパス **とその下の階層** だけ公開されます。

### アンサンブル（`/events/ensemble`）

| URL | 内容 |
|-----|------|
| `/events/ensemble` | 案内 |
| `/events/ensemble/apply` | 申込 |
| `/events/ensemble/apply/confirm` | 確認 |
| `/events/ensemble/apply/complete` | 完了 |

### ヤング（`/events/young-2026`）

| URL | 内容 |
|-----|------|
| `/events/young-2026` | 案内 |
| `/events/young-2026/apply` | 申込 |
| `/events/young-2026/apply/confirm` | 確認 |
| `/events/young-2026/apply/complete` | 完了 |
| `/events/young-2026/apply/bank-transfer` | 振込証明アップロード |

---

## パスワードが必要な URL（非公開のまま）

| URL | 内容 |
|-----|------|
| `/`（トップ） | 協会トップ |
| `/membership` | 入会案内 |
| `/mypage` | 会員マイページ |
| `/admin` | 事務局管理 |
| `/events` | イベント一覧（アンコン・ヤング以外への入口） |
| 上記以外のほぼすべて | 協会案内・問い合わせなど |

---

## 確認チェックリスト（シークレットウィンドウで）

ブラウザの**シークレット（プライベート）**で、ログイン状態をリセットして確認してください。

| 開く URL | 期待する動作 |
|----------|----------------|
| `https://japan-clarinet-association.jp/` | **認証ダイアログ**が出る（見えない） |
| `https://japan-clarinet-association.jp/membership` | **認証ダイアログ**が出る |
| `https://japan-clarinet-association.jp/events/ensemble` | **そのまま**ページが表示される |
| `https://japan-clarinet-association.jp/events/young-2026` | **そのまま**ページが表示される |

認証ダイアログが出たとき:

- **ユーザー名:** `jca`（固定）  
- **パスワード:** Vercel の `SITE_ACCESS_PASSWORD` の値  

---

## 事務局・テスト担当への共有文（コピー用）

```
【サイト閲覧用・準備中】
URL: https://japan-clarinet-association.jp/
ユーザー名: jca
パスワード: （SITE_ACCESS_PASSWORD に設定した値）

※ 次のページはパスワード不要で一般の方も閲覧できます。
・ https://japan-clarinet-association.jp/events/ensemble
・ https://japan-clarinet-association.jp/events/young-2026
```

---

## サイト全体を一般公開に戻すとき

1. `SITE_ACCESS_PASSWORD` を **削除**  
2. `SITE_ACCESS_PUBLIC_PATHS` を **削除**  
3. Production を **Redeploy**  

---

## 補足

| 項目 | 内容 |
|------|------|
| 申込 API | `/api/events/...` はもともと Basic 認証の対象外 |
| Stripe Webhook / Cron | 同上（`/api/*`） |
| ローカル開発 | `.env.local` に同じ 2 変数を書くと同じ動作になります |
