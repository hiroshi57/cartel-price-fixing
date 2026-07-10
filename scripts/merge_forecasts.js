#!/usr/bin/env node
/* =============================================================================
 * merge_forecasts.js — 3モデルの2期先予測を統合して forecast-data.js に反映。
 *   - 統計モデル(q90分位点)   : scripts/build_forecast.js が生成した anomalies/simultaneous
 *   - TimesFM                  : forecast/forecast_out.csv (Google 時系列基盤モデル)
 *   - TabFM                    : forecast/forecast_tabfm.csv (Google 表形式基盤モデル)
 *
 * 既存の build_forecast.js を先に実行して forecast-data.js を作った後、本スクリプトで
 * forecasts[].models = {statistical, timesfm, tabfm} を各系列に付与する。
 *
 * 使い方: node scripts/build_forecast.js && node scripts/merge_forecasts.js
 * ========================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

/* ---- forecast-data.js（統計モデル）読み込み ---- */
const fsrc = fs.readFileSync(path.join(ROOT, "forecast-data.js"), "utf8");
const sb = { window: {} };
new Function("window", fsrc)(sb.window);
const F = sb.window.FORECAST_DATA;

/* ---- CSV パーサ（単純・引用符なし前提） ---- */
function readCSV(file) {
  const lines = fs.readFileSync(path.join(ROOT, file), "utf8").trim().split(/\r?\n/);
  const head = lines[0].split(",");
  return lines.slice(1).map(l => {
    const cols = l.split(",");
    return Object.fromEntries(head.map((h, i) => [h, cols[i]]));
  });
}

/* ---- TimesFM: forecast行(type=forecast)を系列×step で取得 ---- */
const tf = {};
for (const r of readCSV("forecast/forecast_out.csv")) {
  if (r.type !== "forecast") continue;
  (tf[r.series_id] ||= []).push({ date: r.date, q10: +r.q10, q50: +r.q50, q90: +r.q90 });
}

/* ---- TabFM: step順に取得 ---- */
const tb = {};
for (const r of readCSV("forecast/forecast_tabfm.csv")) {
  (tb[r.series_id] ||= []).push({ date: r.date, point: +r.tabfm });
}

/* ---- 統計モデル: 既存 forecasts[].horizon（q10/q50/q90） ---- */
const st = {};
for (const f of F.forecasts || []) st[f.id] = f.horizon;

/* ---- 統合: 各系列に models を付与 ---- */
let matched = 0;
const merged = (F.forecasts || []).map(f => {
  const models = {};
  const dates = (st[f.id] || tb[f.id] || []).map(h => h.date);  // 予測時点の日付（統計/TabFM由来）
  if (st[f.id]) models.statistical = st[f.id].map(h => ({ date: h.date, q50: h.q50, q10: h.q10, q90: h.q90 }));
  if (tf[f.id]) models.timesfm = tf[f.id].map((h, i) => ({ date: dates[i] || h.date, q50: h.q50, q10: h.q10, q90: h.q90 }));
  if (tb[f.id]) { models.tabfm = tb[f.id].map(h => ({ date: h.date, q50: h.point })); matched++; }
  return { id: f.id, name: f.name, group: f.group, models };
});

F.forecasts = merged;
F.meta.models = ["statistical", "timesfm", "tabfm"];
F.meta.model = "3モデル比較（統計q90 / TimesFM / TabFM）";
F.meta.model_notes = {
  statistical: "変化率の90%分位点+中央値ドリフト（自己完結・軽量）",
  timesfm: "Google TimesFM 2.5 200M（時系列基盤モデル・分位点予測）",
  tabfm: "Google TabFM 1.0（表形式基盤モデル・ラグ特徴量で回帰）",
};

const body =
  "/* 異常検知・3モデル予測比較（自動生成 — 編集禁止）。\n" +
  " * 再生成: node scripts/build_forecast.js && node scripts/merge_forecasts.js\n" +
  " * 手法は methodology.html を参照 */\n" +
  "window.FORECAST_DATA = " + JSON.stringify(F) + ";\n";
fs.writeFileSync(path.join(ROOT, "forecast-data.js"), body);

console.log(`統合完了: forecasts ${merged.length}系列`);
console.log(`  statistical: ${merged.filter(m=>m.models.statistical).length} / timesfm: ${merged.filter(m=>m.models.timesfm).length} / tabfm: ${merged.filter(m=>m.models.tabfm).length}`);
console.log("サンプル(commodity:cacao):");
const s = merged.find(m => m.id === "commodity:cacao");
if (s) console.log("  " + JSON.stringify(s.models));
