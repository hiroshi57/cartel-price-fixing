# 価格予測パイプライン（TimesFM）

ダッシュボードの価格系列を [TimesFM](https://github.com/google-research/timesfm)（Google Research の時系列基盤モデル）で予測し、
**「各系列の自己ダイナミクスから予測される範囲を超える上振れ」**＝モデルで説明できない値上げを検出します。
同じ業種で複数系列が同時に上振れすれば、**カルテルの候補**になります。

## 考え方

```
TimesFM は各系列の過去パターンから「次に来るであろう値とそのブレ幅(分位点)」を予測する。
   実際の値 > 予測の90%点(q90)  →  自己履歴では説明できない急騰
   同じカテゴリ/業種で複数系列が同月に q90 超え  →  協調(カルテル)の候補
   原材料(commodity/input)が同時上振れ → 川上(仕入れ先)の協調候補
```

これは①②ダッシュボードの「コストで説明できない乖離」を、単純な線形バスケットではなく
**学習済みモデルの予測区間**で測る発展版です。

## 手順

```bash
# 0) 依存インストール（初回のみ。HuggingFaceから200Mモデルを取得）
pip install timesfm[torch]

# 1) data.js の数値系列を CSV 化
node forecast/export_series.js          # -> forecast/series.csv

# 2) 予測 + 上振れ検出
python forecast/forecast_timesfm.py --horizon 4 --holdout 2
#    -> forecast/forecast_out.csv  (履歴+将来予測, q10/q50/q90)
#    -> forecast/anomalies.csv     (実測 vs q90, 上振れ★)
```

### 主なオプション
- `--horizon N` : 将来 N ステップ予測（既定4）
- `--holdout K` : 末尾 K 点を伏せて予測→実測と比較し上振れ検出（既定2）

## 「事実データ」を入れる場所

現状 `data.js` の系列は**サンプル参考値**です。一次情報（[`../sources/SOURCES.md`](../sources/SOURCES.md)）の
実数に置き換えると、そのまま予測精度が上がります。

| 系列 | data.js の場所 | 一次情報 |
|------|----------------|----------|
| 原材料 | `commodities[].series` | 農水省(小麦) / 日銀CGPI / エネ庁 |
| 仕入れ品目 | `procurement.inputs[].series` | 日銀 企業物価指数(CGPI) |
| 実売価格 | `procurement.categories[].actual` | 総務省CPI(品目別) |

> TimesFM は短い系列でも動きますが、**月次で数年分（24点以上）** あると予測・上振れ検出が安定します。
> e-Stat API / 日銀時系列CSV で月次データを取得し、`procurement.months` と各系列を拡張してください。

## 出力の読み方（anomalies.csv）

| 列 | 意味 |
|----|------|
| actual | 実際の価格指数 |
| q90_pred | TimesFM 予測の90%点（ここまでは「ありうる範囲」） |
| excess_% | actual が q90 をどれだけ超えたか（+なら予測超え） |
| 上振れ | `★` = 自己履歴では説明できない急騰 |

`★` が同じ月に同業種で並んだら、③ページ（確定カルテル事件）と突き合わせて調査対象にします。
