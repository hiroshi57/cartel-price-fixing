#!/usr/bin/env bash
# =============================================================================
#  一次情報 取得スクリプト（Cartel Watch）
#  公正取引委員会『独占禁止法の法的措置一覧』を再取得し、構造化して
#  cases-data.js / jftc_cases.json を更新する。
#  使い方:  bash sources/fetch.sh
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36"
mkdir -p sources/raw

echo "[1/2] 公取委 年度別 法的措置一覧を取得..."
for r in R1 R2 R3 R4 R5 R6 R7; do
  out="sources/raw/jftc_$(echo "$r" | tr 'A-Z' 'a-z').html"
  if curl -fsS -m 30 -A "$UA" "https://www.jftc.go.jp/dk/ichiran/dkhaijo_${r}.html" -o "$out"; then
    echo "  ok ${r} ($(wc -c < "$out") bytes)"
  else
    echo "  skip ${r} (取得失敗 / 未公開の可能性)"
  fi
done

echo "[2/2] 構造化抽出..."
node sources/parse_jftc.js
echo "完了: cases-data.js / sources/jftc_cases.json を更新しました。"
