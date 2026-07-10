#!/usr/bin/env python3
# =============================================================================
#  TabFM (google-research/tabfm) で価格系列を予測する。
#  TabFM は表形式の基盤モデル（回帰）なので、時系列を「ラグ特徴量 → 次月値」の
#  表形式回帰問題に変換して予測する（in-context learning, パラメータ学習なし）。
#
#  特徴量: lag1..lag3, 直近変化率, 月(季節), 時間index
#  予測  : 2ステップ先まで逐次予測（再帰）
#
#  入力 : forecast/series.csv  (export_series.js が生成)
#  出力 : forecast/forecast_tabfm.csv
#  使い方: python forecast/forecast_tabfm.py --horizon 2
#
#  事前準備: cd tabfm && pip install -e ".[pytorch]"
#            (初回は HuggingFace から重みを取得)
# =============================================================================
import argparse, csv, sys
from collections import defaultdict

LAGS = 3

def load_series(path):
    series, names, groups = defaultdict(list), {}, {}
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            series[row["series_id"]].append((row["date"], float(row["value"])))
            names[row["series_id"]] = row["series_name"]
            groups[row["series_id"]] = row["group"]
    for k in series:
        series[k].sort(key=lambda x: x[0])
    return series, names, groups

def month_num(d):
    return int(d.split("-")[1])

def make_training_table(values, dates):
    """系列全体から (X, y) の教師表を作る。行 = 各時点(ラグが揃う点)。"""
    import pandas as pd, numpy as np
    rows, ys = [], []
    for t in range(LAGS, len(values)):
        feat = {}
        for l in range(1, LAGS + 1):
            feat[f"lag{l}"] = values[t - l]
        feat["chg1"] = values[t - 1] / values[t - 2] - 1 if values[t - 2] else 0.0
        feat["month"] = month_num(dates[t])
        feat["tidx"] = t
        rows.append(feat)
        ys.append(values[t])
    return pd.DataFrame(rows), np.array(ys)

def next_feature_row(values, next_month, next_tidx):
    import pandas as pd
    feat = {}
    for l in range(1, LAGS + 1):
        feat[f"lag{l}"] = values[-l]
    feat["chg1"] = values[-1] / values[-2] - 1 if values[-2] else 0.0
    feat["month"] = next_month
    feat["tidx"] = next_tidx
    return pd.DataFrame([feat])

def add_months(d, k):
    y, m = map(int, d.split("-")); t = y * 12 + (m - 1) + 6 * k  # 半年刻み
    return f"{t // 12}-{t % 12 + 1:02d}"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default="forecast/series.csv")
    ap.add_argument("--horizon", type=int, default=2)
    ap.add_argument("--out", default="forecast/forecast_tabfm.csv")
    args = ap.parse_args()

    import numpy as np, pandas as pd
    try:
        import tabfm
    except ImportError:
        print('[!] tabfm 未インストール。 cd tabfm && pip install -e ".[pytorch]"', file=sys.stderr)
        sys.exit(2)

    print("TabFM 重みロード中…（初回はDLで数分）", file=sys.stderr)
    model = tabfm.tabfm_v1_0_0_pytorch.load(model_type="regression")
    reg = tabfm.TabFMRegressor(model=model)

    series, names, groups = load_series(args.csv)
    ids = list(series.keys())
    print(f"系列: {len(ids)}", file=sys.stderr)

    # ---- 再開対応: 既存CSVに書かれた series_id はスキップ、無ければヘッダ作成 ----
    import os
    done = set()
    header = ["series_id", "series_name", "group", "step", "date", "tabfm"]
    if os.path.exists(args.out):
        with open(args.out, encoding="utf-8") as f:
            for row in csv.reader(f):
                if row and row[0] != "series_id":
                    done.add(row[0])
        print(f"再開: 既存 {len(done)} 系列をスキップ", file=sys.stderr)
    else:
        with open(args.out, "w", encoding="utf-8", newline="") as f:
            csv.writer(f).writerow(header)

    for n, sid in enumerate(ids):
        if sid in done:
            continue
        dates = [d for d, _ in series[sid]]
        values = [v for _, v in series[sid]]
        if len(values) < LAGS + 2:
            continue
        Xtr, ytr = make_training_table(values, dates)
        reg.fit(Xtr, ytr)

        rows = []
        vv = list(values)
        last_date = dates[-1]
        for h in range(args.horizon):
            nd = add_months(last_date, h + 1)
            Xn = next_feature_row(vv, month_num(nd), len(vv))
            pred = float(reg.predict(Xn)[0])
            rows.append([sid, names[sid], groups[sid], f"+{h+1}", nd, round(pred, 2)])
            vv.append(pred)
        # 系列ごとに即追記（中断に強い）
        with open(args.out, "a", encoding="utf-8", newline="") as f:
            csv.writer(f).writerows(rows)
        print(f"  [{n+1}/{len(ids)}] {sid} -> {[r[5] for r in rows]}", file=sys.stderr, flush=True)

    print(f"→ {args.out} 完了")

if __name__ == "__main__":
    main()
