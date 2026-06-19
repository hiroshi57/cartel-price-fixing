#!/usr/bin/env python3
# =============================================================================
#  TimesFM で価格系列を予測し、「履歴から予測される範囲を超える上振れ」を検出する。
#  ねらい: 各系列の自己ダイナミクスから予測される価格(分位点)に対し、
#          実際がその上側(q90超)に飛び出していれば「モデルで説明できない値上げ」。
#          同じ業種/カテゴリで複数系列が同時に上振れ → カルテルの候補。
#
#  入力 : forecast/series.csv  (export_series.js が生成)
#  出力 : forecast/forecast_out.csv  (履歴+予測, 分位点つき)
#         forecast/anomalies.csv     (上振れ検出)
#  使い方: python forecast/forecast_timesfm.py --horizon 4 --holdout 2
#
#  事前準備:  pip install timesfm[torch]
#             (初回は HuggingFace から google/timesfm-2.5-200m-pytorch を取得)
# =============================================================================
import argparse, csv, sys
from collections import defaultdict

def load_series(path):
    series = defaultdict(list)         # id -> list[(date, value)]
    names = {}
    groups = {}
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            series[row["series_id"]].append((row["date"], float(row["value"])))
            names[row["series_id"]] = row["series_name"]
            groups[row["series_id"]] = row["group"]
    for k in series:
        series[k].sort(key=lambda x: x[0])
    return series, names, groups

def try_load_model(max_context, max_horizon):
    try:
        import timesfm
    except ImportError:
        print("[!] timesfm 未インストール。  pip install timesfm[torch]  を実行してください。",
              file=sys.stderr)
        return None
    model = timesfm.TimesFM_2p5_200M_torch.from_pretrained("google/timesfm-2.5-200m-pytorch")
    model.compile(
        timesfm.ForecastConfig(
            max_context=max_context,
            max_horizon=max_horizon,
            normalize_inputs=True,
            use_continuous_quantile_head=True,
        )
    )
    return model

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default="forecast/series.csv")
    ap.add_argument("--horizon", type=int, default=4, help="将来何ステップ予測するか")
    ap.add_argument("--holdout", type=int, default=2, help="末尾何点を伏せて答え合わせ(上振れ検出)するか")
    ap.add_argument("--out", default="forecast/forecast_out.csv")
    ap.add_argument("--anom", default="forecast/anomalies.csv")
    args = ap.parse_args()

    series, names, groups = load_series(args.csv)
    ids = list(series.keys())
    print(f"系列: {len(ids)}  例: {ids[:3]}")

    model = try_load_model(max_context=512, max_horizon=max(args.horizon, args.holdout) + 4)
    if model is None:
        sys.exit(2)

    # ---- 1) 将来予測 ----
    fut_inputs = [[v for _, v in series[i]] for i in ids]
    point, quant = model.forecast(horizon=args.horizon, inputs=fut_inputs)
    # quant[:, :, 0]=mean, [:, :, 1..9]=q10..q90

    out_rows = [["series_id", "series_name", "group", "step", "type", "value", "q10", "q50", "q90"]]
    for idx, sid in enumerate(ids):
        for (d, v) in series[sid]:
            out_rows.append([sid, names[sid], groups[sid], d, "history", v, "", "", ""])
        for h in range(args.horizon):
            q = quant[idx][h]
            out_rows.append([sid, names[sid], groups[sid], f"+{h+1}", "forecast",
                             round(float(point[idx][h]), 2),
                             round(float(q[1]), 2), round(float(q[5]), 2), round(float(q[9]), 2)])

    # ---- 2) 上振れ検出 (末尾 holdout を伏せて予測→実測と比較) ----
    anom_rows = [["series_id", "series_name", "group", "date", "actual", "q90_pred", "excess_%", "上振れ"]]
    H = args.holdout
    for idx, sid in enumerate(ids):
        seq = series[sid]
        if len(seq) <= H + 2:
            continue
        ctx = [v for _, v in seq[:-H]]
        actuals = seq[-H:]
        pt, qt = model.forecast(horizon=H, inputs=[ctx])
        for h, (d, a) in enumerate(actuals):
            q90 = float(qt[0][h][9])
            excess = (a - q90) / q90 * 100 if q90 else 0
            flag = "★" if a > q90 else ""
            anom_rows.append([sid, names[sid], groups[sid], d, round(a, 2),
                              round(q90, 2), round(excess, 1), flag])

    with open(args.out, "w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(out_rows)
    with open(args.anom, "w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(anom_rows)

    flags = [r for r in anom_rows[1:] if r[-1] == "★"]
    print(f"[OK] 予測 -> {args.out}")
    print(f"[OK] 上振れ検出 -> {args.anom}  (上振れ {len(flags)} 件)")
    # 業種(actual/cost)で同時上振れを集計
    by_cat = defaultdict(list)
    for r in flags:
        if r[2] in ("actual", "input", "commodity"):
            by_cat[r[3]].append(r[0])   # date -> series
    sim = {d: s for d, s in by_cat.items() if len(s) >= 2}
    if sim:
        print("同時上振れ(同月に複数系列が予測超え) = カルテル候補:")
        for d, s in sorted(sim.items()):
            print(f"   {d}: {', '.join(s)}")

if __name__ == "__main__":
    main()
