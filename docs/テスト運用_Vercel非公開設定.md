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

### 必ず設定するもの（1つだけでよい）

| Key（名前） | Value（値）の例 | 説明 |
|-------------|-----------------|------|
| `SITE_ACCESS_PASSWORD` | `JcaPreview2026!` など | **サイトの鍵**。これが空だと**全体が一般公開**になります |

**アンコン・ヤングはコード側で常に公開**（`/events/ensemble` と `/events/young-2026`）。  
`SITE_ACCESS_PUBLIC_PATHS` は**追加**で公開したいパスがあるときだけ設定（省略可）。

```
/events/ensemble,/events/young-2026
```

（上記を書いても書かなくても、アンコン・ヤングは公開されます）

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
5. **Deployments** → 最新 Production → **Redeploy**

（`SITE_ACCESS_PUBLIC_PATHS` は任意。設定しなくてもアンコン・ヤングは公開されます）

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

## アンコン・ヤングでもパスワードが出るとき

### ページは見えるのに、認証ポップアップだけ何度も出る

公開ページ（アンコン・ヤング）の HTML は表示できるのに、ID/パスワードのダイアログが何度も出る場合があります。

**原因:** 同一ドメインで Basic 認証をかけているため、ヘッダーのリンク先プリフェッチや Next.js の内部リクエスト（`/_next/...`）が保護ページ向けに 401 を返し、ブラウザがダイアログを繰り返し表示します。

**対処（コード側）:** 最新版では次の2点で抑止しています。

- `/_next` 配下は認証チェックの対象外
- プリフェッチ・RSC などの副次リクエストでは `WWW-Authenticate` を付けない（401 だけ返す）

反映には **Redeploy** が必要です。

### それでも出るとき

| 確認 | 対処 |
|------|------|
| Vercel の **Deployment Protection** が ON | **Settings → Deployment Protection** で **Production の保護を OFF**（このサイトは `SITE_ACCESS_PASSWORD` で制御） |
| `SITE_ACCESS_PASSWORD` が未設定 | 上記のとおり設定して **Redeploy** |
| 古いデプロイのまま | 最新コミットで **Redeploy** |
| ブラウザが以前の認証を覚えている | **シークレットウィンドウ**で `/events/ensemble` を直接開く |

---

## 補足

| 項目 | 内容 |
|------|------|
| 申込 API | `/api/events/...` はもともと Basic 認証の対象外 |
| Stripe Webhook / Cron | 同上（`/api/*`） |
| ローカル開発 | `.env.local` に `SITE_ACCESS_PASSWORD` を書くと同じ動作になります |
