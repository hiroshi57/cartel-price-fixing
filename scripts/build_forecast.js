#!/usr/bin/env node
/* =============================================================================
 * build_forecast.js — data.js から異常検知・簡易予測を再生成し forecast-data.js を出力
 *
 * 手法（methodology.html §4 と一致・全公開）:
 *   各系列の期間変化率の過去分布から q90 を推定し、
 *   「予測上限 = 直前値 × (1 + q90変化率)」を実測が超えた点を ★上振れ とする。
 *   複数系列が同じ月に上振れ → simultaneous（協調 or 共通ショックの候補）。
 *   予測は直近中央値ドリフトによる 2 期先参考値（q10/q50/q90 バンド付き）。
 *
 * 使い方: node scripts/build_forecast.js       # forecast-data.js を上書き生成
 * ========================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(ROOT, "data.js"), "utf8");
const sandbox = { window: {} };
new Function("window", src)(sandbox.window);
const D = sandbox.window.CARTEL_DATA;

const q = (arr, p) => {
  if (!arr.length) return NaN;
  const s = [...arr].sort((a, b) => a - b);
  const i = (s.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return s[lo] + (s[hi] - s[lo]) * (i - lo);
};
const r1 = x => Math.round(x * 10) / 10;

/* 系列を {id,name,group,points:[{date,value}]} に正規化 */
const series = [];
for (const c of D.commodities)
  series.push({ id: `commodity:${c.id}`, name: c.name, group: "commodity",
    points: c.series.map(s => ({ date: s.date, value: s.index })) });
for (const i of D.procurement.inputs)
  series.push({ id: `input:${i.id}`, name: i.name, group: "input",
    points: D.procurement.months.map((m, k) => ({ date: m, value: i.series[k] })) });
for (const c of D.procurement.categories)
  series.push({ id: `actual:${c.id}`, name: c.name, group: "actual",
    points: D.procurement.months.map((m, k) => ({ date: m, value: c.actual[k] })) });

const EVAL_LAST = 4;   // 直近4点を評価
const MIN_HIST = 3;    // q90推定に最低3変化率

const anomalies = [];
const forecasts = [];

for (const s of series) {
  const pts = s.points;
  const changes = [];
  for (let k = 1; k < pts.length; k++) changes.push(pts[k].value / pts[k - 1].value - 1);

  // --- 異常検知: 直近 EVAL_LAST 点 ---
  const start = Math.max(MIN_HIST + 1, pts.length - EVAL_LAST);
  for (let k = start; k < pts.length; k++) {
    const hist = changes.slice(0, k - 1);          // t-1 までの変化率
    if (hist.length < MIN_HIST) continue;
    const q90c = q(hist, 0.9);
    const q90level = pts[k - 1].value * (1 + q90c);
    const excess = r1((pts[k].value - q90level) / q90level * 100);
    anomalies.push({
      id: s.id, name: s.name, group: s.group, date: pts[k].date,
      actual: r1(pts[k].value), q90: r1(q90level), excess, flag: excess > 0,
    });
  }

  // --- 簡易予測: 中央値ドリフト 2期先 ---
  const med = q(changes, 0.5), q10c = q(changes, 0.1), q90c = q(changes, 0.9);
  const last = pts[pts.length - 1].value;
  const [y, m] = pts[pts.length - 1].date.split("-").map(Number);
  const nextDate = (n) => {
    const t = y * 12 + (m - 1) + 6 * n;            // 半年刻み
    return `${Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, "0")}`;
  };
  forecasts.push({
    id: s.id, name: s.name, group: s.group,
    horizon: [1, 2].map(n => ({
      date: nextDate(n),
      q10: r1(last * Math.pow(1 + q10c, n)),
      q50: r1(last * Math.pow(1 + med, n)),
      q90: r1(last * Math.pow(1 + q90c, n)),
    })),
  });
}

/* 同時上振れ: 同月に2系列以上が flag */
const byDate = {};
for (const a of anomalies.filter(a => a.flag)) (byDate[a.date] ||= []).push(a);
const simultaneous = Object.entries(byDate)
  .filter(([, list]) => list.length >= 2)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([date, list]) => ({
    date,
    series: list.sort((a, b) => b.excess - a.excess)
      .map(a => ({ id: a.id, name: a.name, group: a.group, excess: a.excess })),
  }));

const out = {
  meta: {
    model: "統計ベース（変化率分位点 q90 + 中央値ドリフト）",
    generated: new Date().toISOString().slice(0, 10),
    source: "data.js v" + D.meta.version + " から scripts/build_forecast.js で再生成",
    note: "実測が過去変化率の90%分位から算出した予測上限(q90)を超えた点=★上振れ。" +
          "複数系列の同月上振れは共通ショックか協調の候補（違法の指摘ではない）。" +
          "予測は参考値であり実現を保証しない。",
  },
  anomalies, simultaneous, forecasts,
};

const body =
  "/* 異常検知・簡易予測（自動生成 — 編集禁止）。再生成: node scripts/build_forecast.js\n" +
  " * 手法は methodology.html §4 を参照（変化率分位点ベース・全公開） */\n" +
  "window.FORECAST_DATA = " + JSON.stringify(out) + ";\n";
fs.writeFileSync(path.join(ROOT, "forecast-data.js"), body);

console.log(`forecast-data.js 再生成完了:`);
console.log(`  系列: ${series.length} / 評価点: ${anomalies.length} / ★上振れ: ${anomalies.filter(a => a.flag).length}`);
console.log(`  同時上振れ月: ${simultaneous.length}件`);
for (const s of simultaneous)
  console.log(`   ${s.date}: ${s.series.map(x => `${x.name}(+${x.excess}%)`).join(" / ")}`);
