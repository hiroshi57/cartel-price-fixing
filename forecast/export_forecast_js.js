/* =============================================================================
 *  forecast/anomalies.csv + forecast_out.csv を読み、ダッシュボード用の
 *  forecast-data.js (window.FORECAST_DATA) を生成する。
 *  使い方:  node forecast/export_forecast_js.js
 * ========================================================================== */
const fs = require("fs");
const path = require("path");

function readCsv(file){
  const txt = fs.readFileSync(path.join(__dirname, file), "utf8").trim();
  const [head, ...lines] = txt.split(/\r?\n/);
  const cols = head.split(",");
  return lines.map(l => {
    const cells = l.split(",");
    return Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
  });
}

// --- 上振れ検出 ---
const anomRaw = readCsv("anomalies.csv");
const anomalies = anomRaw.map(r => ({
  id: r.series_id, name: r.series_name, group: r.group, date: r.date,
  actual: +r.actual, q90: +r.q90_pred, excess: +r["excess_%"],
  flag: r["上振れ"] === "★",
}));

// --- 将来予測 (forecast type のみ, 系列ごとにまとめる) ---
const fcRaw = readCsv("forecast_out.csv");
const forecast = {};
for (const r of fcRaw) {
  if (r.type !== "forecast") continue;
  (forecast[r.series_id] ||= { name: r.series_name, group: r.group, points: [] })
    .points.push({ step: r.step, value: +r.value, q10: +r.q10, q50: +r.q50, q90: +r.q90 });
}

// --- 同時上振れ(同月に複数系列が★) = カルテル候補 ---
const byDate = {};
anomalies.filter(a => a.flag).forEach(a => (byDate[a.date] ||= []).push(a));
const simultaneous = Object.entries(byDate)
  .filter(([, arr]) => arr.length >= 2)
  .map(([date, arr]) => ({
    date,
    series: arr.map(a => ({ id: a.id, name: a.name, group: a.group, excess: a.excess })),
  }))
  .sort((a, b) => a.date.localeCompare(b.date));

const out = {
  meta: {
    model: "TimesFM 2.5 (google/timesfm-2.5-200m-pytorch)",
    generated: new Date().toISOString().slice(0, 10),
    note: "実測が予測の90%点(q90)を超えた点=自己履歴で説明できない上振れ★。値はサンプル系列に対する参考結果。",
  },
  anomalies,
  forecast,
  simultaneous,
};

const dest = path.join(__dirname, "..", "forecast-data.js");
fs.writeFileSync(dest,
  "/* TimesFM 予測結果（自動生成）。再生成: node forecast/export_forecast_js.js\n" +
  " * 元データ: forecast/anomalies.csv, forecast/forecast_out.csv */\n" +
  "window.FORECAST_DATA = " + JSON.stringify(out) + ";\n");

console.log("生成:", dest);
console.log("上振れ★:", anomalies.filter(a => a.flag).length, "件 / 同時上振れ:", simultaneous.length, "日");
simultaneous.forEach(s => console.log("  ", s.date, "->", s.series.map(x => x.name).join(", ")));
