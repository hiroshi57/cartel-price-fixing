# 一次情報 登録簿（Cartel Watch）

「カルテル/談合の検証」に使える**一次情報（公的統計・行政処分・公式発表）**の登録簿です。
ジャンルを横断して幅広く収録します。`✅`= 今回の取得で到達確認済み / `▶`= 取得手順あり。

> 注意: ダッシュボードのサンプル数値の一部は、これらの一次情報に基づく**おおよその参考値**です。
> 厳密な検証には各ソースの原データを直接ダウンロードしてください。

---

## A. カルテル・談合の「答え合わせ」（行政処分・摘発）

| # | ソース | 内容 | URL | 形式 / 取得 |
|---|--------|------|-----|------------|
| A1 ✅ | 公正取引委員会『独占禁止法の法的措置一覧』 | **確定した排除措置命令**（価格カルテル・入札談合・不公正取引）。事件名/行為/法条/年月 | https://www.jftc.go.jp/dk/ichiran/index.html | HTML年度別。`sources/fetch.sh` で自動取得→`cases-data.js` |
| A2 ✅ | 公取委 報道発表資料 | 立入検査・課徴金納付命令・確約計画認定の速報 | https://www.jftc.go.jp/houdou/pressrelease/index.html | HTML年度別 |
| A3 | 公取委 課徴金制度・減免（リーニエンシー）公表 | 課徴金額・減免事業者 | https://www.jftc.go.jp/dk/seido/genmen/ | HTML/PDF |
| A4 | 公取委 確約計画の認定一覧 | 確約手続で是正した事案（再販・優越的地位等） | https://www.jftc.go.jp/dk/kakuyaku/ | HTML |

> A1 は本ツールのページ③が直接利用。法条「**3条後段=不当な取引制限**」が価格カルテル・入札談合。「**3条前段**」=私的独占、「19条/2条9項」=不公正な取引方法（再販価格拘束・優越的地位の濫用など）。

---

## B. 実売価格（消費者が払う値段）= ページ①②の「実売」軸

| # | ソース | 内容 | URL | 形式 / 取得 |
|---|--------|------|-----|------------|
| B1 ✅ | 総務省統計局 消費者物価指数(CPI) | **品目別**の小売価格指数（アイス/食パン/牛乳/外食 等の月次） | https://www.stat.go.jp/data/cpi/ | e-Stat からCSV |
| B2 ✅ | e-Stat（政府統計ポータル） | CPI/小売物価統計の元データ。API あり | https://www.e-stat.go.jp/ | CSV / **API(要appID無料登録)** |
| B3 | 小売物価統計調査（動向編） | 都市別・店舗別の個別品目price | https://www.stat.go.jp/data/kouri/ | e-Stat CSV |

**e-Stat API の使い方（推奨の自動更新経路）**
1. https://www.e-stat.go.jp/api/ で appId を無料取得
2. `getStatsData` で統計表ID(statsDataId)を指定して JSON/CSV 取得
3. 例: 2020基準CPI 中分類・品目別 → 統計表を検索して statsDataId を取得し `data.js` に流し込む

---

## C. 仕入れ価格（企業間取引・原材料）= ページ②の「理論コスト」軸

| # | ソース | 内容 | URL | 形式 / 取得 |
|---|--------|------|-----|------------|
| C1 ✅ | 日本銀行 企業物価指数(CGPI) | **国内企業物価・輸入物価**の品目別指数（原材料/中間財の仕入れ価格） | https://www.boj.or.jp/statistics/pi/cgpi_release/ | HTML/CSV |
| C2 ✅ | 日本銀行 時系列統計データ検索 | CGPIほぼ全系列をCSVダウンロード | https://www.stat-search.boj.or.jp/ | CSV |
| C3 | 日本銀行 企業向けサービス価格指数(SPPI) | 物流・リース等のサービス仕入れ価格 | https://www.boj.or.jp/statistics/pi/sppi_release/ | HTML/CSV |

---

## D. 原材料・コモディティ（最上流）

| # | ソース | 内容 | URL | 形式 |
|---|--------|------|-----|------|
| D1 ✅ | 農林水産省 輸入小麦の政府売渡価格 | 小麦の公定売渡価格（半年改定）。パン/麺/小麦粉の共通コスト | https://www.maff.go.jp/ 内「輸入小麦の政府売渡価格」 | HTML/PDF（403時はUA付与） |
| D2 | 農水省 青果物卸売市場調査 | 野菜・果物の卸売価格 | https://www.maff.go.jp/j/tokei/kouhyou/seika_orosi/ | e-Stat CSV |
| D3 | 農畜産業振興機構(alic) | 砂糖・乳製品・食肉の価格・需給 | https://www.alic.go.jp/ | HTML/CSV |
| D4 | 資源エネルギー庁 石油製品価格調査 | ガソリン/灯油の小売価格（週次） | https://www.enecho.meti.go.jp/statistics/petroleum_and_lpgas/ | CSV/PDF |
| D5 | 電力・ガス取引監視等委員会 / 各社約款 | 電気・都市ガス料金 | https://www.emsc.meti.go.jp/ | HTML |

---

## E. 値上げ「動向」調査（横並びの傾向把握）

| # | ソース | 内容 | URL | 形式 |
|---|--------|------|-----|------|
| E1 ✅ | 帝国データバンク 食品主要メーカー 価格改定動向 | 月次の**値上げ品目数・平均値上げ率**（横並びの規模感） | https://www.tdb.co.jp/report/economic/ | HTML/PDF（自社調査=準一次） |
| E2 | 各社 IR / ニュースリリース | 個社の値上げ発表（品目・率・実施日） | 各社サイト | HTML/PDF |

---

## F. ウェイト（コストバスケットの構成比の根拠）

| # | ソース | 内容 | URL | 形式 |
|---|--------|------|-----|------|
| F1 | 総務省 家計調査 | 世帯支出の品目別構成（消費者側ウェイト） | https://www.stat.go.jp/data/kakei/ | e-Stat CSV |
| F2 | 総務省 産業連関表 | 各産業の投入構造（仕入れ構成比の根拠＝ページ②のbasket重み） | https://www.soumu.go.jp/toukei_toukatsu/data/io/ | e-Stat CSV |
| F3 | 中小企業実態基本調査 | 業種別の費用構成（売上原価/人件費/経費） | https://www.chusho.meti.go.jp/koukai/chousa/ | e-Stat CSV |

---

## 取得・更新の運用

- **カルテル事件（A1）**: `bash sources/fetch.sh` で再取得 → ③ページが自動更新
- **価格系列（B/C/D）**: e-Stat API（appId）/ BOJ時系列CSV を取得し、`data.js` の
  `commodities` / `procurement.inputs` / `categories[].actual` に流し込む
- すべて**公開一次情報**だが、各サイトの利用規約・出典表示に従うこと
- 自動抽出（A1）は表記ゆれを含むため、重要な判断前に**原文（公取委PDF）で確認**すること

## 取得済みファイル
- `sources/raw/jftc_r1.html` 〜 `jftc_r7.html` — 公取委 年度別 原本（令和元〜7年度）
- `sources/jftc_cases.json` — 構造化済み 76件
- `cases-data.js` — ③ページ用データ
