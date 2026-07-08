/* =============================================================================
 *  ui.js — 全ページ共通の ヘッダー / ナビ / フッター を1箇所で描画。
 *  使い方: <script src="ui.js"></script> を読み込み、
 *          CWUI.header("overview") のように現在ページのkeyを渡す。
 *  ナビ項目を増減する時はここだけ直せば全ページに反映される。
 * ========================================================================== */
"use strict";
window.CWUI = (function () {
  const NAV = [
    { key: "overview",    href: "overview.html",    label: "⓪ 総合" },
    { key: "index",       href: "index.html",       label: "① 横並び値上げ" },
    { key: "procurement", href: "procurement.html", label: "② コスト乖離" },
    { key: "cases",       href: "cases.html",        label: "③ 確定事件" },
    { key: "coverage",    href: "coverage.html",     label: "④ カバレッジ" },
    { key: "search",      href: "search.html",       label: "🔎 検索" },
    { key: "report",      href: "report.html",       label: "📄 レポート" },
    { key: "methodology", href: "methodology.html",  label: "🔬 検知ロジック" },
    { key: "help",        href: "help.html",         label: "❓ ヘルプ" },
    { key: "terms",       href: "terms.html",        label: "📜 規約" },
  ];

  const TITLES = {
    overview:    ["総合ダッシュボード", "価格カルテルの「摘発済み（確定）」と「未摘発（横並び・コスト乖離の疑い候補）」を分けて俯瞰"],
    index:       ["公表値上げの横並び", "各業界の値上げイベントを時系列で並べ、原材料コストと突き合わせる"],
    procurement: ["仕入れコスト構造（見えない値上げ）", "サービス業の理論コストと実売価格の乖離から、説明できない上乗せを検出"],
    cases:       ["確定カルテル事件（一次情報）", "公正取引委員会が処分した価格カルテル・入札談合の一次データ"],
    coverage:    ["業界カバレッジ", "収録している業界・企業・データ系列の網羅状況"],
    search:      ["検索・ウォッチリスト", "企業・業界・確定事件をフリーワードで横断検索"],
    report:      ["業界分析レポート", "業界を選んで PDF レポートを出力（出典付き）"],
    methodology: ["検知ロジックの説明", "同時値上げ・コスト乖離をどう検知しているかを全公開"],
    help:        ["ヘルプ・FAQ", "使い方とよくある質問"],
    terms:       ["利用規約・免責事項", "データの性質と免責、異議申立ての手続き"],
  };

  function header(activeKey) {
    const [title, sub] = TITLES[activeKey] || ["Cartel Watch", ""];
    const tabs = NAV.map(n =>
      `<a href="${n.href}"${n.key === activeKey ? ' class="active" aria-current="page"' : ""}>${n.label}</a>`
    ).join("");
    const html = `
      <div class="brand-row">
        <h1><span class="logo">◑</span> Cartel&nbsp;Watch</h1>
        <span class="muted" style="font-size:var(--fs-sm)">— ${title}</span>
      </div>
      ${sub ? `<p class="sub">${sub}</p>` : ""}
      <nav class="tabs" aria-label="メインナビ">${tabs}</nav>`;
    let el = document.querySelector(".site-header");
    if (!el) {
      el = document.createElement("header");
      el.className = "site-header";
      document.body.insertBefore(el, document.body.firstChild);
    }
    el.innerHTML = html;
  }

  function footer(extraHtml) {
    let el = document.querySelector(".site-footer");
    if (!el) {
      el = document.createElement("footer");
      el.className = "site-footer";
      document.body.appendChild(el);
    }
    el.innerHTML =
      (extraHtml ? extraHtml + "<br>" : "") +
      `Cartel Watch — 本表示は統計的観察であり、違法行為の指摘ではありません。 ` +
      `<a href="terms.html">規約</a>・<a href="methodology.html">検知ロジック</a>・` +
      `<a href="https://github.com/hiroshi57/cartel-price-fixing">GitHub</a>　` +
      `出典: 総務省・日本銀行・農林水産省・公正取引委員会 各公表資料を基に当社が指数化・加工。`;
  }

  return { header, footer, NAV };
})();
