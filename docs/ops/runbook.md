# 月次データ更新 Runbook（T031）

> 目的: データの鮮度と正確性を保つための定例作業手順。担当者が代わっても同じ品質で回せるようにする。
> 想定所要時間: 月あたり 1〜2 時間。

## 更新カレンダー

| タイミング | 対象 | 方法 |
|-----------|------|------|
| 毎月1日 09:00 JST | JFTC 確定事件（cases-data.js） | **自動**（GitHub Actions `update-cases.yml`） |
| 毎月 上旬 | 統計指数（data.js の commodities / inputs / actual） | 手動（下記手順A） |
| 随時（値上げ報道時） | 値上げイベント（data.js の events） | 手動（下記手順B） |

## 手順A: 統計指数の月次更新

各系列の一次ソースから最新値を取得し、100=2021-04 基準で指数化して data.js を更新する。

| 系列 | 出典 | 確認先 |
|------|------|--------|
| wheat | 農水省「輸入小麦の政府売渡価格」 | 農水省サイト（4月・10月改定） |
| crude / pulp | 日銀「企業物価指数」 | 日銀 時系列統計データ検索 |
| sugar / cacao | ICE 先物 → 円換算（相対指数化） | 商品市況（当社算出） |
| milk | 農水省「生乳生産者価格」 | 農水省 牛乳乳製品統計 |
| inputs / actual（CPI 系） | 総務省 CPI | **e-Stat API**（T021・下記） |

### 一次CSV 直接取得（推奨・APIキー不要）✅ 2026-07-06 稼働

総務省・日銀は固定URLで一次CSVを公開しており、APIキーなしで機械取得できる。

```bash
cd sources/primary
# 1. 総務省 CPI 品目別 月次（全国・2020基準）
curl -A "Mozilla/5.0" -o cpi_zmi2020aa.csv "https://www.stat.go.jp/data/cpi/2020/csv/zmi2020aa.csv"
# 2. 日銀 企業物価指数(CGPI) / 企業向けサービス価格指数(SPPI) 一括DL
curl -A "Mozilla/5.0" -o cgpi_m_jp.zip "https://www.stat-search.boj.or.jp/info/cgpi_m_jp.zip"
curl -A "Mozilla/5.0" -o sppi_m_jp.zip "https://www.stat-search.boj.or.jp/info/sppi_m_jp.zip"
unzip -o cgpi_m_jp.zip -d cgpi && unzip -o sppi_m_jp.zip -d sppi
cd ../..
# 3. 検証済み系列を生成して data.js に反映（31系列）
python3 scripts/build_verified.py           # 比較表示のみ
python3 scripts/build_verified.py --apply   # data.js を更新（data.js.bak を自動生成）
```

### e-Stat 自動取得（代替手段・T021）

```bash
ESTAT_API_KEY=xxxx python3 scripts/fetch_estat.py --apply
```

更新後は必ず検証（下記「共通: 反映前チェック」）。

## 手順B: 値上げイベントの追加

1. 各社プレスリリース・報道で値上げを確認
2. data.js の `events[]` に追記（日付は "YYYY-MM"、changePct は代表値）
3. `source` に一次情報を記載（将来 URL 化 = T024）
4. 該当 categoryId / companyId が未登録なら companies / categories に先に追加

```js
{ companyId: "xxx", categoryId: "yyy", product: "商品名", date: "2025-06", changePct: 7, source: "○○発表(参考)" },
```

## 共通: 反映前チェック（必須）

```bash
node -c data.js                    # 構文チェック
node scripts/build_forecast.js     # 異常検知・予測を data.js から再生成（forecast-data.js 上書き）
node scripts/validate_data.js      # 整合性チェック（basket合計=1.0, 参照整合, series長さ, 日付昇順）
```

> **重要**: data.js の系列を変更したら必ず `build_forecast.js` を再実行すること。
> 忘れると overview の異常検知パネルが古いデータ基準のまま表示される。

- ✅ 「検証成功」を確認してからコミット
- ❌ ERROR が出たら該当箇所を修正（push すると validate.yml CI でも再チェックされる）

## コミット・デプロイ

```bash
git add data.js
git commit -m "chore: 月次データ更新 [$(date +%Y-%m)]"
git push origin main            # Vercel が自動デプロイ
```

デプロイ後、本番の反映を確認:

```bash
curl -s https://cartel-price-fixing.vercel.app/data.js | grep 'updated'
```

## 異常時の対応

| 症状 | 対応 |
|------|------|
| `update-cases.yml` が失敗 | 自動起票された GitHub Issue（label: data-update-failure）を確認。Actions タブから手動再実行 |
| validate_data.js が ERROR | エラーメッセージの該当 id を修正。basket 合計ずれは w の再配分 |
| 本番が古いまま | Vercel のデプロイ状況を確認。Service Worker キャッシュはスーパーリロードで解消 |
| データ誤りの指摘（第三者） | terms.html 第6条の異議対応フローに従う（2営業日で根拠提示、誤認は1営業日で修正） |

## 更新後に見直すべき派生データ

- `forecast-data.js`（予測・異常検知）— 大きなデータ変更時は再生成を検討
- 新カテゴリ追加時 — report.html / search.html / company.html は自動追従（コード変更不要）
