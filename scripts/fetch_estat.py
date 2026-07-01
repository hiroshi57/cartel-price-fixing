#!/usr/bin/env python3
"""
fetch_estat.py — e-Stat API から CPI・物価指数を取得し
data.js の procurement.categories[].actual[] を更新するスクリプト。

使い方:
  1. e-Stat API キーを取得: https://www.e-stat.go.jp/api/
  2. 環境変数 ESTAT_API_KEY にセットして実行:
       ESTAT_API_KEY=xxxx python3 scripts/fetch_estat.py

出力:
  scripts/estat_actual.json  — 業態ごとの実売価格指数 (100=2021-04 基準)
  (その後 data.js を手動または --apply オプションで更新)

対応業態と使用する e-Stat 統計コード:
  restaurant  → 消費者物価指数 外食 (系列: 0003427225)
  cleaning    → 消費者物価指数 クリーニング代 (系列: 0003427430)
  greengrocer → 消費者物価指数 生鮮野菜 (系列: 0003427098)
  delivery    → 企業物価指数 道路貨物輸送 (系列: 0003215855)
  taxi        → 消費者物価指数 タクシー代 (系列: 0003427206)
  reform      → 企業物価指数 建設工事費デフレーター (別途国交省)
  cramschool  → 消費者物価指数 補習教育 (系列: 0003427399)
  salon       → 消費者物価指数 理美容サービス (系列: 0003427431)
  rental      → 企業物価指数 物品賃貸業 (概算: CPI家賃)
  hotel       → 消費者物価指数 宿泊料 (系列: 0003427217)
  supermarket → 消費者物価指数 食料 (系列: 0003427086)
  carecenter  → 消費者物価指数 介護サービス (系列: 0003427450)
  adagency    → 企業物価指数 広告 (系列: 概算)
"""

import os
import sys
import json
import urllib.request
import urllib.parse
from datetime import datetime

API_KEY = os.environ.get("ESTAT_API_KEY", "")
BASE_URL = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData"

# 業態 → e-Stat 系列コード (statsDataId, 品目コード)
# 消費者物価指数: statsDataId=0003427113 (全国・月次)
# 品目コードは e-Stat の時系列データ検索で確認
SERIES_MAP = {
    "restaurant":  {"statsDataId": "0003427113", "cdArea": "00000", "cdCat01": "DA"},  # 外食
    "cleaning":    {"statsDataId": "0003427113", "cdArea": "00000", "cdCat01": "HI"},  # クリーニング代
    "greengrocer": {"statsDataId": "0003427113", "cdArea": "00000", "cdCat01": "BA"},  # 生鮮野菜
    "taxi":        {"statsDataId": "0003427113", "cdArea": "00000", "cdCat01": "EJ"},  # タクシー代
    "cramschool":  {"statsDataId": "0003427113", "cdArea": "00000", "cdCat01": "GH"},  # 補習教育
    "salon":       {"statsDataId": "0003427113", "cdArea": "00000", "cdCat01": "HK"},  # 理美容
    "hotel":       {"statsDataId": "0003427113", "cdArea": "00000", "cdCat01": "EH"},  # 宿泊料
    "supermarket": {"statsDataId": "0003427113", "cdArea": "00000", "cdCat01": "A"},   # 食料総合
    "carecenter":  {"statsDataId": "0003427113", "cdArea": "00000", "cdCat01": "HH"},  # 介護
    # 以下は CPI になく、代替指標を使用
    "delivery":    {"statsDataId": "0003215855", "note": "企業物価指数・道路貨物輸送"},
    "reform":      {"statsDataId": "0003196195", "note": "建設工事施工統計"},
    "rental":      {"statsDataId": "0003427113", "cdArea": "00000", "cdCat01": "FA"},  # 家賃（代替）
    "adagency":    {"statsDataId": "0003427113", "cdArea": "00000", "cdCat01": "HG"},  # 諸雑費（代替）
}

# data.js の months に対応する取得対象月
TARGET_MONTHS = [
    "2021-04", "2021-10", "2022-04", "2022-10",
    "2023-04", "2023-10", "2024-04", "2024-10", "2025-04",
]

def fetch_series(cat_id: str, params: dict) -> list[float]:
    """e-Stat API から指定系列の月次データを取得し TARGET_MONTHS に揃えて返す"""
    if not API_KEY:
        print(f"  [{cat_id}] ESTAT_API_KEY 未設定 — スキップ", file=sys.stderr)
        return []

    query = {
        "appId": API_KEY,
        "statsDataId": params["statsDataId"],
        "cdTimeFrom": "2021000100",  # 2021年4月
        "cdTimeTo":   "2025000200",  # 2025年4月
        "lang": "J",
        "metaGetFlg": "N",
        "sectionHeaderFlg": "1",
    }
    if "cdCat01" in params:
        query["cdCat01"] = params["cdCat01"]
    if "cdArea" in params:
        query["cdArea"] = params["cdArea"]

    url = BASE_URL + "?" + urllib.parse.urlencode(query)
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = json.load(resp)
    except Exception as e:
        print(f"  [{cat_id}] fetch error: {e}", file=sys.stderr)
        return []

    # レスポンス解析
    values = {}
    try:
        items = data["GET_STATS_DATA"]["STATISTICAL_DATA"]["DATA_INF"]["VALUE"]
        for item in items:
            time_cd = item.get("@time", "")          # "2021000400" = 2021年4月
            val = item.get("$", "")
            if val in ("", "-", "***"):
                continue
            # time_cd "YYYYMM00nn" → "YYYY-MM"
            yyyy = time_cd[:4]
            mm   = time_cd[4:6]
            values[f"{yyyy}-{mm}"] = float(val)
    except (KeyError, TypeError) as e:
        print(f"  [{cat_id}] parse error: {e}", file=sys.stderr)
        return []

    if not values:
        return []

    # 基準化: 2021-04 = 100
    base = values.get("2021-04")
    if not base:
        return []

    result = []
    for m in TARGET_MONTHS:
        v = values.get(m)
        if v is None:
            # 前後で線形補間
            result.append(None)
        else:
            result.append(round(v / base * 100, 1))
    return result


def main():
    import argparse
    parser = argparse.ArgumentParser(description="e-Stat CPI 取得 → estat_actual.json 出力")
    parser.add_argument("--apply", action="store_true", help="data.js の actual[] を直接書き換える（バックアップ推奨）")
    parser.add_argument("--cat", default="all", help="特定業態のみ取得 (例: restaurant)")
    args = parser.parse_args()

    targets = list(SERIES_MAP.keys()) if args.cat == "all" else [args.cat]
    output = {}

    print(f"取得対象: {len(targets)} 業態")
    for cat_id in targets:
        params = SERIES_MAP[cat_id]
        print(f"  Fetching {cat_id} ...", end=" ", flush=True)
        series = fetch_series(cat_id, params)
        if series:
            output[cat_id] = series
            print(f"OK  {series}")
        else:
            print("SKIP")

    # JSON 出力
    out_path = "scripts/estat_actual.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\n→ {out_path} に保存しました。")
    print("  data.js の procurement.categories[].actual[] に値を反映してください。")

    if args.apply and output:
        _apply_to_data_js(output)


def _apply_to_data_js(actual_map: dict):
    """data.js の actual[] を取得値で書き換える（正規表現ベース・バックアップあり）"""
    import re, shutil, pathlib
    src = pathlib.Path("data.js")
    bak = pathlib.Path("data.js.bak")
    shutil.copy(src, bak)
    text = src.read_text(encoding="utf-8")

    for cat_id, series in actual_map.items():
        if None in series:
            print(f"  [{cat_id}] null値を含むためスキップ")
            continue
        new_arr = json.dumps(series)
        # id:"<cat_id>", ... actual:[...] を置換
        pattern = rf'(id:"{re.escape(cat_id)}"[\s\S]*?actual:\[)[^\]]+(\])'
        replacement = rf'\g<1>{", ".join(str(v) for v in series)}\g<2>'
        text_new = re.sub(pattern, replacement, text)
        if text_new != text:
            print(f"  [{cat_id}] actual[] を更新")
            text = text_new
        else:
            print(f"  [{cat_id}] パターン不一致 — 手動確認が必要")

    src.write_text(text, encoding="utf-8")
    print(f"\n  data.js を更新しました。バックアップ: {bak}")


if __name__ == "__main__":
    main()
