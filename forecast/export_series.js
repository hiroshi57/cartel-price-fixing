/* =============================================================================
 *  data.js の数値系列を TimesFM 用の CSV (long format) に書き出す。
 *  出力: forecast/series.csv   列: series_id,series_name,group,date,value
 *  対象: commodities(原材料) / procurement.inputs(仕入れ品目) /
 *        procurement.categories.actual(実売) / 同 cost(理論コスト=バスケット)
 *  使い方:  node forecast/export_series.js
 * ========================================================================== */
const fs = require("fs");
const path = require("path");

global.window = {};
require(path.join(__dirname, "..", "data.js"));
const D = window.CARTEL_DATA;
const P = D.procurement;

const rows = [["series_id", "series_name", "group", "date", "value"]];

// 1) 原材料コモディティ (日付は系列内に明示)
for (const c of D.commodities) {
  for (const s of c.series) rows.push([`commodity:${c.id}`, c.name, "commodity", s.date, s.index]);
}

// 2) 仕入れ品目 (procurement.months に整列)
const INPUT = Object.fromEntries(P.inputs.map(i => [i.id, i]));
for (const i of P.inputs) {
  i.series.forEach((v, t) => rows.push([`input:${i.id}`, i.name, "input", P.months[t], v]));
}

// 3) 業態: 実売価格 と 理論コスト(バスケット加重)
for (const cat of P.categories) {
  cat.actual.forEach((v, t) => rows.push([`actual:${cat.id}`, `${cat.name} 実売`, "actual", P.months[t], v]));
  // 理論コスト系列
  for (let t = 0; t < P.months.length; t++) {
    let cost = 0;
    cat.basket.forEach(b => cost += INPUT[b.input].series[t] * b.w);
    rows.push([`cost:${cat.id}`, `${cat.name} 理論コスト`, "cost", P.months[t], +cost.toFixed(2)]);
  }
}

const csv = rows.map(r => r.join(",")).join("\n") + "\n";
const out = path.join(__dirname, "series.csv");
fs.writeFileSync(out, csv);

const series = new Set(rows.slice(1).map(r => r[0]));
console.log(`書き出し: ${out}`);
console.log(`系列数: ${series.size} / 行数: ${rows.length - 1}`);
console.log(`月数(procurement): ${P.months.length}  期間: ${P.months[0]}〜${P.months[P.months.length-1]}`);
