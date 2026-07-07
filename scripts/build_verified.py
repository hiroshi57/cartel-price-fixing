#!/usr/bin/env python3
"""
build_verified.py — 一次統計データ(CSV)から検証済み指数を生成し data.js に反映する。

一次ソース（sources/primary/ に取得済みであること。取得方法は docs/ops/runbook.md）:
  cpi_zmi2020aa.csv   総務省 消費者物価指数 全国 品目別 月次 (2020基準)
                      https://www.stat.go.jp/data/cpi/2020/csv/zmi2020aa.csv
  cgpi/cgpi_m_jp.csv  日銀 企業物価指数(CGPI) 月次 一括DL
                      https://www.stat-search.boj.or.jp/info/cgpi_m_jp.zip
  sppi/sppi_m_jp.csv  日銀 企業向けサービス価格指数(SPPI) 月次 一括DL
                      https://www.stat-search.boj.or.jp/info/sppi_m_jp.zip

使い方:
  python3 scripts/build_verified.py            # 比較表を表示 + verified_series.json 出力
  python3 scripts/build_verified.py --apply    # data.js の該当系列を置換（data.js.bak を生成）

指数はすべて 2021-04 = 100 に正規化、小数1位で丸め。
"""
import csv, json, re, sys, shutil, pathlib
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
PRI = ROOT / "sources" / "primary"
MONTHS = ["2021-04","2021-10","2022-04","2022-10","2023-04","2023-10",
          "2024-04","2024-10","2025-04","2025-10","2026-04"]
BASE = "2021-04"

# ---------------------------------------------------------------- CPI (wide: rows=months, cols=items)
def load_cpi():
    rows = list(csv.reader(open(PRI / "cpi_zmi2020aa.csv", encoding="cp932")))
    names = rows[0]
    data = {}  # "YYYY-MM" -> [row values]
    for r in rows[6:]:
        m = r[0].strip()
        if re.fullmatch(r"\d{6}", m):
            data[f"{m[:4]}-{m[4:6]}"] = r
    return names, data

def cpi_col(names, name, nth=0):
    hits = [j for j, n in enumerate(names) if n == name]
    if not hits:
        raise KeyError(f"CPI item not found: {name}")
    return hits[nth]

def cpi_series(names, data, name, nth=0):
    j = cpi_col(names, name, nth)
    def val(m):
        v = data[m][j].strip()
        return float(v)
    base = val(BASE)
    return [round(val(m) / base * 100, 1) for m in MONTHS], round(val(latest_month(data)) / base * 100, 1)

def latest_month(data):
    return max(data.keys())

# ---------------------------------------------------------------- BOJ (wide: rows=series, cols=months)
def load_boj(path):
    rows = list(csv.reader(open(PRI / path, encoding="cp932")))
    header = rows[0]  # ['','','',202001,202002,...]
    months = {f"{c[:4]}-{c[4:6]}": i for i, c in enumerate(header) if re.fullmatch(r"\d{6}", c.strip())}
    series = {r[0]: r for r in rows[1:] if r and r[0]}
    return months, series

def boj_series(months, series, code):
    r = series[code]
    def val(m):
        return float(r[months[m]])
    base = val(BASE)
    latest = max(m for m in months if r[months[m]].strip() not in ("", "NA", "ND"))
    return [round(val(m) / base * 100, 1) for m in MONTHS], round(val(latest) / base * 100, 1), latest

# ---------------------------------------------------------------- ビルド
def build():
    names, cpi = load_cpi()
    gm, gs = load_boj("cgpi/cgpi_m_jp.csv")
    sm, ss = load_boj("sppi/sppi_m_jp.csv")
    out = {"_meta": {
        "generated": date.today().isoformat(),
        "base": BASE, "months": MONTHS,
        "cpi_latest": latest_month(cpi),
        "sources": {
            "cpi":  "総務省 消費者物価指数 全国 品目別 月次 (stat.go.jp zmi2020aa.csv)",
            "cgpi": "日銀 企業物価指数 月次 (stat-search.boj.or.jp cgpi_m_jp.zip)",
            "sppi": "日銀 企業向けサービス価格指数 月次 (sppi_m_jp.zip)",
        }}}

    def cpi_item(key, name, nth=0):
        s, latest = cpi_series(names, cpi, name, nth)
        out[key] = {"src": f"CPI:{name}", "values": s, "latest": latest}

    def cpi_mix(key, parts):  # parts = [(name, nth, w), ...]
        cols = [(cpi_col(names, n, k), w) for n, k, w in parts]
        def val(m):
            return sum(float(cpi[m][j]) * w for j, w in cols)
        base = val(BASE)
        out[key] = {"src": "CPI:" + "+".join(f"{n}×{w}" for n, _, w in parts),
                    "values": [round(val(m)/base*100, 1) for m in MONTHS],
                    "latest": round(val(latest_month(cpi))/base*100, 1)}

    def boj_item(key, kind, code, label):
        m, s = (gm, gs) if kind == "cgpi" else (sm, ss)
        vals, latest, lm = boj_series(m, s, code)
        out[key] = {"src": f"{kind.upper()}:{label}", "values": vals, "latest": latest, "latest_month": lm}

    def boj_mix(key, kind, codes, label):  # 等加重平均
        m, s = (gm, gs) if kind == "cgpi" else (sm, ss)
        def val(mo):
            return sum(float(s[c][m[mo]]) for c in codes) / len(codes)
        base = val(BASE)
        out[key] = {"src": f"{kind.upper()}:{label}",
                    "values": [round(val(mo)/base*100, 1) for mo in MONTHS],
                    "latest": round(val(max(mo for mo in m))/base*100, 1)}

    # ---- 実売価格 actual[] (procurement.categories) ----
    cpi_item("actual.restaurant", "外食")
    cpi_mix("actual.cleaning", [("クリーニング代Ａ", 0, 0.5), ("クリーニング代Ｂ", 0, 0.5)])
    cpi_item("actual.greengrocer", "生鮮野菜")
    cpi_item("actual.taxi", "タクシー代")
    cpi_item("actual.hotel", "宿泊料")
    cpi_item("actual.cramschool", "補習教育")
    cpi_mix("actual.salon", [("理髪料", 0, 0.5), ("パーマネント代", 0, 0.5)])
    cpi_item("actual.carecenter", "介護料")
    cpi_item("actual.supermarket", "食料")
    boj_item("actual.delivery", "sppi", "PRCS20_5200630002", "道路貨物輸送")
    boj_item("actual.rental", "sppi", "PRCS20_5201720001", "リース")
    boj_item("actual.adagency", "sppi", "PRCS20_5201920001", "広告")
    # reform は国交省デフレーター未取得のため対象外（estimate のまま）

    # ---- 仕入れコスト inputs[] ----
    cpi_item("input.rice", "米類")
    cpi_item("input.vegetable", "生鮮野菜")
    cpi_item("input.meat", "生鮮肉")
    cpi_item("input.oil", "食用油")
    cpi_item("input.flour", "小麦粉")
    cpi_item("input.detergent", "洗濯用洗剤")
    cpi_mix("input.energy", [("電気代", 0, 0.65), ("ガス代", 0, 0.35)])
    cpi_item("input.water", "上下水道料")
    cpi_item("input.fuel", "ガソリン")
    cpi_item("input.telecom", "通信料（携帯電話）")
    cpi_item("input.rent", "家賃")
    cpi_item("input.vehicle", "自動車等関係費")
    cpi_item("input.medsupply", "保健医療用品・器具")
    boj_item("input.goods", "cgpi", "PRCG20_2200120001", "飲食料品(類別)")
    boj_item("input.ad", "sppi", "PRCS20_5201920001", "広告")
    # packaging = 段ボール(資材) 50% + 道路貨物輸送(物流) 50%
    def packaging():
        c = gs["PRCG20_2200440003"]; d = ss["PRCS20_5200630002"]
        def val(m): return float(c[gm[m]]) * 0.5 + float(d[sm[m]]) * 0.5
        base = val(BASE)
        out["input.packaging"] = {"src": "CGPI:段ボール×0.5 + SPPI:道路貨物輸送×0.5",
            "values": [round(val(m)/base*100, 1) for m in MONTHS], "latest": None}
    packaging()
    # material = 木材・木製品 / 鉄鋼 / 窯業・土石製品 の等加重
    mat_codes = []
    for kw in ("類別/_木材・木製品", "類別/_鉄鋼", "類別/_窯業・土石製品"):
        code = next((c for c, r in gs.items() if r[2] == kw), None)
        if code: mat_codes.append(code)
    boj_mix("input.material", "cgpi", mat_codes, "木材+鉄鋼+窯業・土石 等加重")
    # labor(最賃)・finance(政策金利)・misc・textbook は対象外（別ソース）

    # ---- 商品コスト commodities ----
    boj_item("commodity.crude", "cgpi", "PRCG20_2200620001", "石油・石炭製品(類別)")
    boj_item("commodity.pulp",  "cgpi", "PRCG20_2200420001", "パルプ・紙・同製品(類別)")
    # ICEライセンス問題の恒久対応(T016): 日銀 輸入物価指数(円ベース)へ移行
    boj_item("commodity.sugar", "cgpi", "PRCG20_2600150007", "粗糖 輸入物価指数(円ベース)")
    boj_item("commodity.cacao", "cgpi", "PRCG20_2600150025", "コーヒー豆・カカオ豆 輸入物価指数(円ベース)")
    boj_item("commodity.milk",  "cgpi", "PRCG20_2202050005", "原乳(国内企業物価・品目)")

    return out

# ---------------------------------------------------------------- data.js へ反映
def apply(out):
    src = ROOT / "data.js"
    shutil.copy(src, ROOT / "data.js.bak")
    text = src.read_text(encoding="utf-8")
    n = 0

    def arr(vals):
        return ",".join(str(v) for v in vals)

    for key, v in out.items():
        if key.startswith("_"): continue
        kind, name = key.split(".")
        if kind == "input":
            pat = rf'(id:"{name}",\s*name:"[^"]*",\s*series:\[)[^\]]+(\])'
        elif kind == "actual":
            pat = rf'(id:"{name}"[\s\S]{{0,600}}?actual:\[)[^\]]+(\])'
        elif kind == "commodity":
            # date付きオブジェクト配列: 値だけ差し替え
            m = re.search(rf'id: "{name}",[\s\S]*?series: \[([\s\S]*?)\n      \]', text)
            if not m: print(f"  SKIP commodity {name} (pattern)"); continue
            block = m.group(1)
            newblock = block
            for d, val in zip(MONTHS, v["values"]):
                newblock = re.sub(rf'(\{{ date: "{d}", index: )[\d.]+( \}})', rf'\g<1>{val}\g<2>', newblock)
            if newblock != block:
                text = text.replace(block, newblock); n += 1
                print(f"  OK commodity.{name} <- {v['src']}")
            continue
        else:
            continue
        new, cnt = re.subn(pat, lambda mm: mm.group(1) + arr(v["values"]) + mm.group(2), text, count=1)
        if cnt:
            text = new; n += 1
            print(f"  OK {key} <- {v['src']}")
        else:
            print(f"  SKIP {key} (pattern not found)")

    src.write_text(text, encoding="utf-8")
    print(f"\ndata.js: {n} 系列を一次データで更新（バックアップ: data.js.bak）")

def main():
    out = build()
    (PRI / "verified_series.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"→ sources/primary/verified_series.json 出力 (CPI最新月: {out['_meta']['cpi_latest']})\n")
    for k, v in out.items():
        if k.startswith("_"): continue
        print(f"{k:22s} {v['values']}  [{v['src']}]")
    if "--apply" in sys.argv:
        print("\n=== data.js へ反映 ===")
        apply(out)

if __name__ == "__main__":
    main()
