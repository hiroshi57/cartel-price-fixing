/* =============================================================================
 * watchlist.js — ウォッチリスト (T040) + CSV エクスポート (T041) 共有ユーティリティ
 * 保存先: localStorage "cw_watchlist"
 * 形式: [{ type:"company"|"category", id:"meiji", name:"明治", added:"2026-07-02" }]
 * ========================================================================== */
"use strict";
window.CW = (function () {
  const KEY = "cw_watchlist";

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }
  function save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

  function has(type, id) { return load().some(w => w.type === type && w.id === id); }

  function toggle(type, id, name) {
    let list = load();
    if (has(type, id)) {
      list = list.filter(w => !(w.type === type && w.id === id));
    } else {
      list.push({ type, id, name, added: new Date().toISOString().slice(0, 10) });
    }
    save(list);
    return has(type, id);
  }

  function all() { return load(); }

  function remove(type, id) { save(load().filter(w => !(w.type === type && w.id === id))); }

  /* CSV ダウンロード: rows = [[...header],[...row1],...] */
  function downloadCSV(rows, filename) {
    const esc = v => {
      const s = String(v == null ? "" : v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = "﻿" + rows.map(r => r.map(esc).join(",")).join("\r\n"); // BOM 付き (Excel 対応)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return { has, toggle, all, remove, downloadCSV };
})();
