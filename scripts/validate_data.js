#!/usr/bin/env node
/* =============================================================================
 * validate_data.js — data.js / cases-data.js / forecast-data.js の整合性検証
 * 使い方: node scripts/validate_data.js
 * 終了コード: 0 = OK / 1 = エラーあり（CI で使用）
 * ========================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const errors = [];
const warns = [];

function loadWindowJs(file) {
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  const sandbox = { window: {} };
  new Function("window", src)(sandbox.window);
  return sandbox.window;
}

/* ---------- data.js ---------- */
const w = loadWindowJs("data.js");
const D = w.CARTEL_DATA;
if (!D) { console.error("❌ CARTEL_DATA が定義されていません"); process.exit(1); }

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// 1. commodities: 日付形式・昇順・index>0
for (const c of D.commodities) {
  let prev = "";
  for (const s of c.series) {
    if (!DATE_RE.test(s.date)) errors.push(`commodities[${c.id}] 日付形式不正: ${s.date}`);
    if (s.date <= prev) errors.push(`commodities[${c.id}] 日付が昇順でない: ${prev} → ${s.date}`);
    if (!(s.index > 0)) errors.push(`commodities[${c.id}] index が正でない: ${s.index}`);
    prev = s.date;
  }
  if (c.series[0].index !== 100) warns.push(`commodities[${c.id}] 先頭が100基準でない: ${c.series[0].index}`);
}

// 2. categories: industryId / commodities の参照整合
const indIds = new Set(D.industries.map(i => i.id));
const comIds = new Set(D.commodities.map(c => c.id));
const catIds = new Set();
for (const cat of D.categories) {
  catIds.add(cat.id);
  if (!indIds.has(cat.industryId)) errors.push(`categories[${cat.id}] 未定義の industryId: ${cat.industryId}`);
  for (const cm of cat.commodities) {
    if (!comIds.has(cm)) errors.push(`categories[${cat.id}] 未定義の commodity: ${cm}`);
  }
}

// 3. events: companyId / categoryId 参照・日付・changePct 範囲
const compIds = new Set(D.companies.map(c => c.id));
for (const [i, e] of D.events.entries()) {
  if (!compIds.has(e.companyId)) errors.push(`events[${i}] 未定義の companyId: ${e.companyId}`);
  if (!catIds.has(e.categoryId)) errors.push(`events[${i}] 未定義の categoryId: ${e.categoryId}`);
  if (!DATE_RE.test(e.date)) errors.push(`events[${i}] 日付形式不正: ${e.date}`);
  if (!(e.changePct > 0 && e.changePct <= 50)) warns.push(`events[${i}] changePct が異常値: ${e.changePct}%`);
  if (!e.source) warns.push(`events[${i}] source 未記載`);
}

// 4. procurement: months 長さ・inputs series 長さ・basket 合計・actual 長さ
const P = D.procurement;
const N = P.months.length;
const inputIds = new Set(P.inputs.map(i => i.id));
for (const inp of P.inputs) {
  if (inp.series.length !== N) errors.push(`inputs[${inp.id}] series 長さ ${inp.series.length} ≠ months ${N}`);
  if (inp.series[0] !== 100) warns.push(`inputs[${inp.id}] 先頭が100基準でない: ${inp.series[0]}`);
  if (inp.series.some(v => !(v > 0))) errors.push(`inputs[${inp.id}] 非正値を含む`);
}
for (const cat of P.categories) {
  const sum = cat.basket.reduce((a, b) => a + b.w, 0);
  if (Math.abs(sum - 1.0) > 0.001) errors.push(`procurement[${cat.id}] basket 合計 ${sum.toFixed(3)} ≠ 1.0`);
  if (cat.actual.length !== N) errors.push(`procurement[${cat.id}] actual 長さ ${cat.actual.length} ≠ months ${N}`);
  for (const b of cat.basket) {
    if (!inputIds.has(b.input)) errors.push(`procurement[${cat.id}] 未定義の input: ${b.input}`);
  }
  if (cat.actual[0] !== 100) warns.push(`procurement[${cat.id}] actual 先頭が100基準でない: ${cat.actual[0]}`);
}

/* ---------- cases-data.js ---------- */
const w2 = loadWindowJs("cases-data.js");
const CASES = w2.JFTC_CASES;
if (!CASES || !Array.isArray(CASES)) {
  errors.push("JFTC_CASES が配列として定義されていません");
} else {
  const CASE_DATE_RE = /^\d{4}-\d{2}(-\d{2})?$/;
  for (const [i, c] of CASES.entries()) {
    if (!c.date || !CASE_DATE_RE.test(c.date)) errors.push(`JFTC_CASES[${i}] 日付形式不正: ${c.date}`);
    if (!c.name && !c.title) errors.push(`JFTC_CASES[${i}] 事件名がありません`);
  }
  if (CASES.length < 50) warns.push(`JFTC_CASES 件数が少ない: ${CASES.length}件（欠落の可能性）`);
}

/* ---------- forecast-data.js ---------- */
try {
  const w3 = loadWindowJs("forecast-data.js");
  if (!w3.FORECAST_DATA) warns.push("FORECAST_DATA が定義されていません");
} catch (e) {
  warns.push(`forecast-data.js 読み込み失敗: ${e.message}`);
}

/* ---------- 結果 ---------- */
console.log(`検証対象: commodities=${D.commodities.length}, categories=${D.categories.length}, events=${D.events.length}, procurement=${P.categories.length}業態, JFTC=${CASES ? CASES.length : 0}件`);
for (const m of warns)  console.log("⚠️  WARN:", m);
for (const m of errors) console.log("❌ ERROR:", m);
if (errors.length) {
  console.log(`\n❌ 検証失敗: エラー ${errors.length}件 / 警告 ${warns.length}件`);
  process.exit(1);
}
console.log(`\n✅ 検証成功 (警告 ${warns.length}件)`);
