# T052–T057: Phase 2 SaaS 化セットアップ手順（認証・課金・API）

> ステータス: 手順確定。実装には**外部アカウント作成（人間の作業）**が前提。
> 方針は [ADR-0001](../adr/0001-tech-stack.md) に従い、静的サイトを Next.js に段階移行して被せる。

## 前提の意思決定（ヒアリング T004 後に確定）

課金開発に着手する条件は「ヒアリング10件中4件以上が月3万円以上の支払意思」。
本ドキュメントは条件クリア後にそのまま実行できるよう先行整備したもの。

## ステップ 0: リポジトリ構成の移行（T026 と連動）

```
現在: ルート直下に *.html + *.js（静的）
移行後:
  app/                 … Next.js App Router
    (public)/          … 認証不要の公開ページ（overview, index, cases, coverage, lp, terms, methodology, help）
    (app)/             … 認証必須（report, company, search, watchlist, export, alerts）
    api/               … REST API (T056)
  public/data/         … data.js 等をJSON化して配置（T026）
  lib/                 … 認証・課金・データアクセス
```

移行作業の見積もり: 2〜4週間（静的HTMLをReactコンポーネントへ移植 + データのJSON化）。

## ステップ 1: 認証（T052）— Clerk

1. https://clerk.com でアカウント作成（無料枠: MAU 10,000）
2. アプリを作成し、以下を `.env.local` に設定:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   CLERK_SECRET_KEY=sk_...
   ```
3. `npm i @clerk/nextjs` → `middleware.ts` で `(app)/` 配下を保護
4. 日本語UI・メールログイン・Google Workspace SSO（Enterprise向け T063）を有効化

**代替案**: NextAuth（自前運用・無料）。エンタープライズSSO要件が出るまではClerkが工数最小。

## ステップ 2: プラン別アクセス制御（T053）

- Clerk の `publicMetadata.plan` に `free | pro | enterprise` を保存
- サーバー側で機能ゲート:

  | 機能 | free | pro | enterprise |
  |------|:----:|:---:|:----------:|
  | 履歴 全期間 | ✕ | ○ | ○ |
  | PDFレポート | ✕ | 月10 | 無制限 |
  | CSVエクスポート | ✕ | ○ | ○ |
  | メール/Slackアラート | ✕ | ○ | ○ |
  | REST API | ✕ | ✕ | ○ |

- `lib/plan.ts` に `canUse(plan, feature)` を一元化（[06_pricing.md](06_pricing.md) の機能マトリクスと同期）

## ステップ 3: 課金（T054）— Stripe

1. https://stripe.com でアカウント作成（日本法人対応・インボイス制度対応）
2. 商品を作成:
   - Pro: ¥50,000/月（月額）、¥500,000/年（年額=2ヶ月分無料）
   - Enterprise: 手動請求書（Stripe Invoicing）
3. `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...
   ```
4. Checkout Session → 成功後 Webhook (`checkout.session.completed`) で Clerk の `plan` を更新
5. Customer Portal で解約・プラン変更・請求書DLを顧客セルフサービス化
6. 14日トライアル: Checkout の `subscription_data.trial_period_days: 14`
7. 請求書払い（日本企業向け T074）: Stripe Invoicing + 銀行振込を Enterprise で提供

## ステップ 4: REST API（T056/T057）

- `app/api/v1/` に OpenAPI 準拠で実装
- 認証: API キー（Clerk or 自前発行）を `Authorization: Bearer` で受ける
- レート制限: Vercel KV or Upstash Redis で従量カウント（T057）
- 初期エンドポイント:
  ```
  GET /api/v1/industries              業界一覧
  GET /api/v1/industries/{id}/events  値上げイベント
  GET /api/v1/cases                   確定事件（検索）
  GET /api/v1/companies/{id}          企業サマリ
  ```

## ステップ 5: 運用系（Phase 2 後半）

- 利用分析（T058）: PostHog（無料枠あり）or GA4
- エラー監視（T061）: Sentry（無料枠あり）
- ステージング分離（T059）: Vercel の Preview/Production 環境 + 環境変数分離

## コスト試算（月額・最小構成）

| サービス | 無料枠 | 有料化の目安 |
|---------|--------|------------|
| Vercel | Hobby無料 | Pro $20/月（商用は必要） |
| Clerk | MAU 10,000無料 | 超過時従量 |
| Stripe | 決済手数料 3.6% のみ | 固定費なし |
| Neon(Postgres) | 無料枠あり | $19/月〜 |
| Sentry/PostHog | 無料枠あり | 従量 |

→ **顧客ゼロでも Vercel Pro $20 程度**で開始可能。売上に応じてスケール。

## 実行順序

```
T004(GO判断) → リポ移行(T026) → T052(認証) → T053(ゲート)
  → T054(Stripe) → 有料トライアル開始 → T056(API, Enterprise需要が出たら)
```
