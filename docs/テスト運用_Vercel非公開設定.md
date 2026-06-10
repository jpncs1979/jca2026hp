# 一般非公開（テスト運用）の設定

**一般の人にサイトを見せない**ときは、Vercel にパスワード用の環境変数を1つ設定するだけです。

---

## 手順（3ステップ）

### 1. コードを本番に反映する

`main` ブランチに push し、Vercel のデプロイが成功するまで待ちます。

### 2. Vercel でパスワードを設定する

1. [vercel.com](https://vercel.com) → プロジェクトを開く  
2. **Settings** → **Environment Variables**  
3. 次を追加（**Production** にチェック）

| 名前 | 値 | 説明 |
|------|-----|------|
| `SITE_ACCESS_PASSWORD` | 任意の強固なパスワード | 例: `JcaTest2026!`（事務局だけ共有） |
| `SITE_ACCESS_USER` | （任意）`jca` | 省略時はユーザー名 `jca` |

4. **Save** 後、**Deployments** → 最新の **Production** → **Redeploy**（環境変数を反映）

### 3. 確認する

- シークレットウィンドウで `https://japan-clarinet-association.jp/` を開く  
- **ユーザー名** `jca`（または設定した値）と **パスワード** を入力  
- 入力しないとサイトは見えない → **一般非公開 OK**

---

## ログイン情報（事務局・テスト担当者に共有）

```
URL:      https://japan-clarinet-association.jp/
ユーザー: jca  （SITE_ACCESS_USER を変えた場合はその値）
パスワード: （Vercel に設定した SITE_ACCESS_PASSWORD）
```

※ 会員マイページ（`/mypage`）は、このあと **別途** 会員用のメール・パスワードでログインします。

---

## 一般公開するとき

1. Vercel → **Environment Variables** で `SITE_ACCESS_PASSWORD` を **削除**  
2. Production を **Redeploy**  
3. シークレットウィンドウで、パスワードなしでサイトが見えることを確認  

---

## 補足

| 項目 | 内容 |
|------|------|
| Stripe・Cron | `/api/*` はこの認証の対象外（決済 Webhook 等は動きます） |
| Preview URL | Preview 環境にも同じ変数を設定すると、Preview も鍵付きになります |
| ローカル開発 | `.env.local` に `SITE_ACCESS_PASSWORD` を書くとローカルも鍵付きになります |

---

## （参考）Vercel の Deployment Protection / Preview URL

上記の環境変数方式で足ります。Vercel 標準の Deployment Protection や Preview ブランチ運用は、必要になったら [本番公開とドメイン設定.md](./本番公開とドメイン設定.md) と合わせて検討してください。
