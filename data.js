/* =============================================================================
 *  Cartel Watch — 実データ版
 *  -----------------------------------------------------------------------------
 *  ★データソース★
 *  【商品コスト指標】
 *    小麦  : 農林水産省「輸入小麦の政府売渡価格」(2021年4月=100)
 *    原油  : 日銀「企業物価指数 石油・石炭製品」円建て換算 (2021年4月=100)
 *    砂糖  : ICE No.11 粗糖先物 × USD/JPY 換算 (2021年4月=100)
 *    カカオ : ICE Cocoa 先物価格 × USD/JPY 換算 (2021年4月=100)
 *    生乳  : 農林水産省「生乳の生産者価格」加重平均 (2021年4月=100)
 *  【仕入れコスト指標】
 *    総務省「消費者物価指数」/ 日銀「企業物価指数」/ 国土交通省「建設工事費デフレーター」
 *    最低賃金: 厚生労働省「地域別最低賃金」全国加重平均
 *    電気・ガス: 総務省CPI 電気代・ガス代 (補助金影響込み)
 *    携帯通信費: 総務省CPI (2021年春の大幅値下げを反映)
 *    調達金利: 日銀政策金利 (2024-03マイナス金利解除反映)
 *  【実売価格指数】
 *    総務省「消費者物価指数」各品目 (2021年4月=100)
 *    宿泊料は訪日インバウンド急増・コロナ後回復を反映
 *    配送料は2024年問題（働き方改革）による運賃改定を反映
 *  【値上げイベント】
 *    各社公式プレスリリース・公表資料（参考値、要一次情報確認）
 *  ★重要な注意★
 *  「同時期の値上げ」は協調行為（カルテル）の"候補"を示すものであり、
 *  それ自体が違法の証拠ではありません（原材料高騰など正当な共通要因がほとんど）。
 *  本ツールは"監視・調査の出発点"を見つけるための可視化を目的とします。
 *
 *  データの追記方法は README.md を参照。日付は "YYYY-MM" 形式。
 * ========================================================================== */

window.CARTEL_DATA = {
  meta: {
    version: "0.3.0",
    updated: "2026-07-03",
    disclaimer:
      "指数は公的統計の公表傾向に基づく参考値（100=2021-04基準）。一次ソースから機械取得・照合した検証済みデータではない（データ出所は provenance を参照）。値上げ率は各社公表資料の参考値。横並び値上げは協調の『候補』であり違法の証拠ではない。",
    // ── データ出所と信頼度（正直な自己申告）──
    // "verified"  = 一次ソースから取得・照合済み（現状: JFTC確定事件のみ）
    // "official-derived" = 公的統計の公表値・改定傾向に基づく指数化（数値は概ね妥当だが機械照合は未実施）
    // "estimate"  = 公開報道・各社公表を元にした推定参考値
    provenance: {
      note: "正式な検証済みデータへの置換には e-Stat API キー登録（T021）が必要。手順は docs/ops/runbook.md 参照。",
      cases:       { confidence: "verified",         source: "公正取引委員会 法的措置一覧（月次自動取得）" },
      commodities: { confidence: "official-derived", source: "農水省/日銀CGPI/ICE先物 の公表傾向を指数化（機械照合は未実施）" },
      inputs:      { confidence: "official-derived", source: "総務省CPI/日銀PPI/厚労省最賃 の公表傾向を指数化（機械照合は未実施）" },
      actual:      { confidence: "official-derived", source: "総務省CPI 各品目 の公表傾向を指数化（e-Stat API 取得で検証予定）" },
      events:      { confidence: "estimate",         source: "各社プレスリリース・公開報道に基づく参考値（率は代表値、一次URL付与は T024 で対応予定）" },
    },
  },

  /* 原材料コスト指標（簡易インデックス, 100 = 基準）。
   * 値上げが「コスト要因で説明できるか」を判定する参照線に使う。 */
  commodities: [
    {
      id: "wheat",
      // 農林水産省「輸入小麦の政府売渡価格」改定値 (2021-04=100)
      // 2022-04: ウクライナ侵攻後→+17%, 2022-10: +6%追加, 2023-04: 国際市況下落で-9%
      name: "輸入小麦 政府売渡価格",
      series: [
        { date: "2021-04", index: 100 }, { date: "2021-10", index: 121 },
        { date: "2022-04", index: 130 }, { date: "2022-10", index: 138 },
        { date: "2023-04", index: 126 }, { date: "2023-10", index: 112 },
        { date: "2024-04", index: 112 }, { date: "2024-10", index: 107 },
        { date: "2025-04", index: 102 },
      ],
    },
    {
      id: "crude",
      // 日銀「企業物価指数」石油・石炭製品 × 円建て換算 (2021-04=100)
      // 2022-04: 原油高+円安でピーク, 2023-04: 下落, 2023-10: 再上昇
      name: "原油 企業物価指数（円建）",
      series: [
        { date: "2021-04", index: 100 }, { date: "2021-10", index: 137 },
        { date: "2022-04", index: 178 }, { date: "2022-10", index: 162 },
        { date: "2023-04", index: 132 }, { date: "2023-10", index: 148 },
        { date: "2024-04", index: 138 }, { date: "2024-10", index: 128 },
        { date: "2025-04", index: 120 },
      ],
    },
    {
      id: "sugar",
      // ICE No.11 粗糖先物 × USD/JPY 円換算 (2021-04=100)
      // 2023-10: インドの輸出規制・エルニーニョ影響でピーク
      name: "砂糖（粗糖）ICE No.11 円建",
      series: [
        { date: "2021-04", index: 100 }, { date: "2022-04", index: 110 },
        { date: "2023-04", index: 138 }, { date: "2023-10", index: 158 },
        { date: "2024-04", index: 148 }, { date: "2025-04", index: 134 },
      ],
    },
    {
      id: "cacao",
      // ICE Cocoa 先物 × USD/JPY 円換算 (2021-04≈$2,380/MT=100)
      // 2024-04: 西アフリカ不作・投機で史上最高値 $9,600/MT ≈ 404
      // 2024-10: $7,100/MT ≈ 298, 2025-04: $8,300/MT ≈ 349
      name: "カカオ豆 ICE先物 円建（史上最高値 2024-04）",
      series: [
        { date: "2021-04", index: 100 }, { date: "2022-04", index: 115 },
        { date: "2023-04", index: 128 }, { date: "2023-10", index: 166 },
        { date: "2024-04", index: 404 }, { date: "2024-10", index: 298 },
        { date: "2025-04", index: 349 },
      ],
    },
    {
      id: "milk",
      // 農林水産省「生乳の生産者価格」加重平均 (2021-04=100)
      // 2022-11: 飼料高騰・輸送費反映, 2023-08: 追加改定
      name: "生乳 農水省 生産者乳価",
      series: [
        { date: "2021-04", index: 100 }, { date: "2022-04", index: 103 },
        { date: "2022-11", index: 111 }, { date: "2023-08", index: 117 },
        { date: "2024-04", index: 119 }, { date: "2025-04", index: 122 },
      ],
    },
    {
      id: "pulp",
      // 日銀「企業物価指数」パルプ・紙・紙加工品 + 輸入パルプ市況 (2021-04=100)
      // 2022: 木材・輸送費・エネルギー高騰でピーク, 2024以降 落ち着き
      name: "パルプ・古紙（製紙原料）企業物価指数",
      series: [
        { date: "2021-04", index: 100 }, { date: "2021-10", index: 108 },
        { date: "2022-04", index: 124 }, { date: "2022-10", index: 138 },
        { date: "2023-04", index: 132 }, { date: "2023-10", index: 126 },
        { date: "2024-04", index: 124 }, { date: "2024-10", index: 122 },
        { date: "2025-04", index: 121 },
      ],
    },
  ],

  industries: [
    { id: "food", name: "食品" },
    { id: "drink", name: "飲料・酒類" },
    { id: "paper", name: "製紙・紙製品" },
    { id: "daily", name: "日用品" },
  ],

  categories: [
    { id: "ice",    industryId: "food",  name: "アイス",        commodities: ["sugar", "milk", "cacao", "crude"] },
    { id: "noodle", industryId: "food",  name: "即席麺",        commodities: ["wheat", "crude"] },
    { id: "bread",  industryId: "food",  name: "食パン・パン",  commodities: ["wheat"] },
    { id: "flour",  industryId: "food",  name: "小麦粉",        commodities: ["wheat"] },
    { id: "frozen", industryId: "food",  name: "冷凍食品",      commodities: ["wheat", "crude"] },
    { id: "mayo",   industryId: "food",  name: "マヨネーズ",    commodities: ["crude"] },
    { id: "dairy",  industryId: "food",  name: "牛乳・乳製品",  commodities: ["milk"] },
    { id: "beer",   industryId: "drink", name: "ビール類",      commodities: ["crude"] },
    { id: "soft",   industryId: "drink", name: "清涼飲料(大型PET)", commodities: ["sugar", "crude"] },
    // ── T028 第1弾: 調味料・菓子・水産・製紙・日用品 ──
    { id: "seasoning", industryId: "food",  name: "調味料(醤油・味噌)", commodities: ["wheat", "crude"] },
    { id: "choco",     industryId: "food",  name: "チョコレート菓子",   commodities: ["cacao", "sugar", "milk"] },
    { id: "tuna",      industryId: "food",  name: "水産缶詰(ツナ缶)",   commodities: ["crude"] },
    { id: "tissue",    industryId: "paper", name: "ティッシュ・トイレット紙", commodities: ["pulp", "crude"] },
    { id: "household", industryId: "daily", name: "洗剤・日用品",       commodities: ["crude"] },
  ],

  companies: [
    // アイス
    { id: "meiji",     name: "明治" },
    { id: "lotte",     name: "ロッテ" },
    { id: "morinaga",  name: "森永製菓" },
    { id: "morinyu",   name: "森永乳業" },
    { id: "glico",     name: "江崎グリコ" },
    { id: "akagi",     name: "赤城乳業" },
    // 即席麺
    { id: "nissin",    name: "日清食品" },
    { id: "toyo",      name: "東洋水産" },
    { id: "sanyo",     name: "サンヨー食品" },
    { id: "myojo",     name: "明星食品" },
    // パン
    { id: "yamazaki",  name: "山崎製パン" },
    { id: "pasco",     name: "敷島製パン(Pasco)" },
    { id: "fujipan",   name: "フジパン" },
    // 小麦粉
    { id: "nisshin",   name: "日清製粉ウェルナ" },
    { id: "nippn",     name: "ニップン" },
    { id: "showa",     name: "昭和産業" },
    // 冷凍食品
    { id: "ajicool",   name: "味の素冷凍食品" },
    { id: "nichirei",  name: "ニチレイフーズ" },
    { id: "maruha",    name: "マルハニチロ" },
    { id: "tablemark", name: "テーブルマーク" },
    // マヨネーズ
    { id: "kewpie",    name: "キユーピー" },
    { id: "ajinomoto", name: "味の素" },
    // 牛乳乳製品
    { id: "snowbrand", name: "雪印メグミルク" },
    // ビール
    { id: "asahi",     name: "アサヒビール" },
    { id: "kirin",     name: "キリンビール" },
    { id: "sapporo",   name: "サッポロビール" },
    { id: "suntory",   name: "サントリー" },
    // 清涼飲料
    { id: "cocacola",  name: "コカ・コーラ" },
    { id: "itoen",     name: "伊藤園" },
    { id: "kirinbev",  name: "キリンビバレッジ" },
    // ── T028 第1弾で追加 ──
    // 調味料
    { id: "kikkoman",  name: "キッコーマン" },
    { id: "yamasa",    name: "ヤマサ醤油" },
    { id: "higashi",   name: "ヒガシマル醤油" },
    { id: "mizkan",    name: "ミツカン" },
    { id: "marukome",  name: "マルコメ" },
    // 水産缶詰（ツナ缶）※過去にカルテル摘発歴あり
    { id: "hagoromo",  name: "はごろもフーズ" },
    { id: "inaba",     name: "いなば食品" },
    { id: "kyokuyo",   name: "極洋" },
    // 製紙
    { id: "daio",      name: "大王製紙" },
    { id: "crecia",    name: "日本製紙クレシア" },
    { id: "nepia",     name: "王子ネピア" },
    // 日用品（洗剤）
    { id: "kao",       name: "花王" },
    { id: "lion",      name: "ライオン" },
    { id: "png",       name: "P&Gジャパン" },
  ],

  /* 値上げイベント。changePct = 値上げ率(%)。source は要確認の参考。 */
  events: [
    // ── アイス（2024-2025 に各社が集中して値上げ）──
    { companyId: "akagi",    categoryId: "ice", product: "ガリガリ君ほか", date: "2024-04", changePct: 8,  source: "各社公表(要確認)" },
    { companyId: "meiji",    categoryId: "ice", product: "アイス各種",     date: "2024-04", changePct: 10, source: "各社公表(要確認)" },
    { companyId: "morinaga", categoryId: "ice", product: "アイス各種",     date: "2024-04", changePct: 10, source: "各社公表(要確認)" },
    { companyId: "lotte",    categoryId: "ice", product: "アイス各種",     date: "2024-04", changePct: 9,  source: "各社公表(要確認)" },
    { companyId: "glico",    categoryId: "ice", product: "アイス各種",     date: "2024-05", changePct: 9,  source: "各社公表(要確認)" },
    { companyId: "morinyu",  categoryId: "ice", product: "アイス各種",     date: "2024-05", changePct: 10, source: "各社公表(要確認)" },
    { companyId: "meiji",    categoryId: "ice", product: "アイス各種",     date: "2025-03", changePct: 8,  source: "各社公表(要確認)" },
    { companyId: "lotte",    categoryId: "ice", product: "アイス各種",     date: "2025-03", changePct: 8,  source: "各社公表(要確認)" },
    { companyId: "glico",    categoryId: "ice", product: "アイス各種",     date: "2025-04", changePct: 7,  source: "各社公表(要確認)" },

    // ── 即席麺（2022, 2023 に横並び）──
    { companyId: "nissin",   categoryId: "noodle", product: "カップ麺・袋麺", date: "2022-06", changePct: 9,  source: "各社公表(要確認)" },
    { companyId: "toyo",     categoryId: "noodle", product: "カップ麺・袋麺", date: "2022-06", changePct: 8,  source: "各社公表(要確認)" },
    { companyId: "sanyo",    categoryId: "noodle", product: "カップ麺・袋麺", date: "2022-06", changePct: 8,  source: "各社公表(要確認)" },
    { companyId: "myojo",    categoryId: "noodle", product: "カップ麺・袋麺", date: "2022-07", changePct: 9,  source: "各社公表(要確認)" },
    { companyId: "nissin",   categoryId: "noodle", product: "カップ麺・袋麺", date: "2023-06", changePct: 11, source: "各社公表(要確認)" },
    { companyId: "toyo",     categoryId: "noodle", product: "カップ麺・袋麺", date: "2023-06", changePct: 10, source: "各社公表(要確認)" },
    { companyId: "myojo",    categoryId: "noodle", product: "カップ麺・袋麺", date: "2023-06", changePct: 10, source: "各社公表(要確認)" },
    { companyId: "sanyo",    categoryId: "noodle", product: "カップ麺・袋麺", date: "2023-05", changePct: 10, source: "各社公表(要確認)" },

    // ── 食パン（小麦に連動。2022-2023）──
    { companyId: "yamazaki", categoryId: "bread", product: "食パン", date: "2022-07", changePct: 7,  source: "各社公表(要確認)" },
    { companyId: "pasco",    categoryId: "bread", product: "食パン", date: "2022-07", changePct: 8,  source: "各社公表(要確認)" },
    { companyId: "fujipan",  categoryId: "bread", product: "食パン", date: "2022-08", changePct: 7,  source: "各社公表(要確認)" },
    { companyId: "yamazaki", categoryId: "bread", product: "食パン", date: "2023-07", changePct: 6,  source: "各社公表(要確認)" },
    { companyId: "pasco",    categoryId: "bread", product: "食パン", date: "2023-07", changePct: 6,  source: "各社公表(要確認)" },
    { companyId: "fujipan",  categoryId: "bread", product: "食パン", date: "2023-07", changePct: 6,  source: "各社公表(要確認)" },

    // ── 小麦粉（政府売渡に連動＝コストで説明しやすい）──
    { companyId: "nisshin",  categoryId: "flour", product: "家庭用小麦粉", date: "2022-04", changePct: 5,  source: "各社公表(要確認)" },
    { companyId: "nippn",    categoryId: "flour", product: "家庭用小麦粉", date: "2022-04", changePct: 5,  source: "各社公表(要確認)" },
    { companyId: "showa",    categoryId: "flour", product: "家庭用小麦粉", date: "2022-04", changePct: 5,  source: "各社公表(要確認)" },
    { companyId: "nisshin",  categoryId: "flour", product: "家庭用小麦粉", date: "2022-10", changePct: 4,  source: "各社公表(要確認)" },
    { companyId: "nippn",    categoryId: "flour", product: "家庭用小麦粉", date: "2022-10", changePct: 4,  source: "各社公表(要確認)" },
    { companyId: "showa",    categoryId: "flour", product: "家庭用小麦粉", date: "2022-10", changePct: 4,  source: "各社公表(要確認)" },

    // ── 冷凍食品（2022-2023）──
    { companyId: "ajicool",   categoryId: "frozen", product: "家庭用冷食", date: "2022-02", changePct: 7,  source: "各社公表(要確認)" },
    { companyId: "nichirei",  categoryId: "frozen", product: "家庭用冷食", date: "2022-02", changePct: 8,  source: "各社公表(要確認)" },
    { companyId: "maruha",    categoryId: "frozen", product: "家庭用冷食", date: "2022-03", changePct: 7,  source: "各社公表(要確認)" },
    { companyId: "tablemark", categoryId: "frozen", product: "家庭用冷食", date: "2022-02", changePct: 8,  source: "各社公表(要確認)" },
    { companyId: "ajicool",   categoryId: "frozen", product: "家庭用冷食", date: "2023-02", changePct: 10, source: "各社公表(要確認)" },
    { companyId: "nichirei",  categoryId: "frozen", product: "家庭用冷食", date: "2023-02", changePct: 10, source: "各社公表(要確認)" },
    { companyId: "maruha",    categoryId: "frozen", product: "家庭用冷食", date: "2023-02", changePct: 9,  source: "各社公表(要確認)" },

    // ── マヨネーズ（2社が近接）──
    { companyId: "kewpie",    categoryId: "mayo", product: "マヨネーズ", date: "2022-03", changePct: 8,  source: "各社公表(要確認)" },
    { companyId: "ajinomoto", categoryId: "mayo", product: "マヨネーズ", date: "2022-03", changePct: 8,  source: "各社公表(要確認)" },
    { companyId: "kewpie",    categoryId: "mayo", product: "マヨネーズ", date: "2022-08", changePct: 10, source: "各社公表(要確認)" },
    { companyId: "ajinomoto", categoryId: "mayo", product: "マヨネーズ", date: "2022-08", changePct: 9,  source: "各社公表(要確認)" },

    // ── 牛乳・乳製品（生乳に連動）──
    { companyId: "meiji",     categoryId: "dairy", product: "牛乳・ヨーグルト", date: "2022-11", changePct: 5,  source: "各社公表(要確認)" },
    { companyId: "morinyu",   categoryId: "dairy", product: "牛乳・ヨーグルト", date: "2022-11", changePct: 5,  source: "各社公表(要確認)" },
    { companyId: "snowbrand", categoryId: "dairy", product: "牛乳・ヨーグルト", date: "2022-11", changePct: 5,  source: "各社公表(要確認)" },
    { companyId: "meiji",     categoryId: "dairy", product: "牛乳・ヨーグルト", date: "2023-08", changePct: 6,  source: "各社公表(要確認)" },
    { companyId: "morinyu",   categoryId: "dairy", product: "牛乳・ヨーグルト", date: "2023-08", changePct: 6,  source: "各社公表(要確認)" },
    { companyId: "snowbrand", categoryId: "dairy", product: "牛乳・ヨーグルト", date: "2023-08", changePct: 6,  source: "各社公表(要確認)" },

    // ── ビール類（酒税改正と各社改定が重なる）──
    { companyId: "asahi",   categoryId: "beer", product: "ビール・発泡酒", date: "2022-10", changePct: 6,  source: "各社公表(要確認)" },
    { companyId: "kirin",   categoryId: "beer", product: "ビール・発泡酒", date: "2022-10", changePct: 6,  source: "各社公表(要確認)" },
    { companyId: "sapporo", categoryId: "beer", product: "ビール・発泡酒", date: "2022-10", changePct: 7,  source: "各社公表(要確認)" },
    { companyId: "suntory", categoryId: "beer", product: "ビール・発泡酒", date: "2022-10", changePct: 6,  source: "各社公表(要確認)" },

    // ── 清涼飲料(大型PET)──
    { companyId: "cocacola", categoryId: "soft", product: "大型PET飲料", date: "2022-05", changePct: 6,  source: "各社公表(要確認)" },
    { companyId: "suntory",  categoryId: "soft", product: "大型PET飲料", date: "2022-05", changePct: 6,  source: "各社公表(要確認)" },
    { companyId: "itoen",    categoryId: "soft", product: "大型PET飲料", date: "2022-06", changePct: 7,  source: "各社公表(要確認)" },
    { companyId: "kirinbev", categoryId: "soft", product: "大型PET飲料", date: "2022-05", changePct: 6,  source: "各社公表(要確認)" },

    // ── 2024-2025 追加（最新情報）──

    // 牛乳・乳製品 2024-04（飼料コスト高止まり・乳価改定反映）
    { companyId: "meiji",     categoryId: "dairy", product: "牛乳・ヨーグルト", date: "2024-04", changePct: 4, source: "明治プレスリリース(参考)" },
    { companyId: "morinyu",   categoryId: "dairy", product: "牛乳・ヨーグルト", date: "2024-04", changePct: 4, source: "森永乳業発表(参考)" },
    { companyId: "snowbrand", categoryId: "dairy", product: "牛乳・ヨーグルト", date: "2024-04", changePct: 4, source: "雪印メグミルク発表(参考)" },

    // 牛乳・乳製品 2025-04（生産者乳価継続上昇）
    { companyId: "meiji",     categoryId: "dairy", product: "牛乳・ヨーグルト", date: "2025-04", changePct: 3, source: "明治プレスリリース(参考)" },
    { companyId: "morinyu",   categoryId: "dairy", product: "牛乳・ヨーグルト", date: "2025-04", changePct: 3, source: "森永乳業発表(参考)" },
    { companyId: "snowbrand", categoryId: "dairy", product: "牛乳・ヨーグルト", date: "2025-04", changePct: 3, source: "雪印メグミルク発表(参考)" },

    // 即席麺 2024-06（小麦・エネルギーコスト対応）
    { companyId: "nissin",    categoryId: "noodle", product: "カップ麺・袋麺", date: "2024-06", changePct: 5, source: "日清食品発表(参考)" },
    { companyId: "toyo",      categoryId: "noodle", product: "カップ麺・袋麺", date: "2024-06", changePct: 5, source: "東洋水産発表(参考)" },

    // アイス 2025-03（カカオ・砂糖・生乳高騰）
    { companyId: "morinaga",  categoryId: "ice", product: "アイス各種", date: "2025-03", changePct: 8, source: "森永製菓発表(参考)" },

    // 清涼飲料 2024-10（砂糖・原料高＋円安）
    { companyId: "cocacola",  categoryId: "soft", product: "大型PET飲料", date: "2024-10", changePct: 7, source: "コカ・コーラ発表(参考)" },
    { companyId: "itoen",     categoryId: "soft", product: "大型PET飲料", date: "2024-10", changePct: 8, source: "伊藤園発表(参考)" },
    { companyId: "kirinbev",  categoryId: "soft", product: "大型PET飲料", date: "2024-10", changePct: 5, source: "キリンビバレッジ発表(参考)" },

    // 冷凍食品 2024-02（電力・人件費・包材コスト）
    { companyId: "ajicool",   categoryId: "frozen", product: "家庭用冷食", date: "2024-02", changePct: 8, source: "味の素冷凍食品発表(参考)" },
    { companyId: "nichirei",  categoryId: "frozen", product: "家庭用冷食", date: "2024-02", changePct: 9, source: "ニチレイフーズ発表(参考)" },

    // 食パン 2024-07（小麦政府売渡・人件費）
    { companyId: "yamazaki",  categoryId: "bread", product: "食パン", date: "2024-07", changePct: 5, source: "山崎製パン発表(参考)" },
    { companyId: "pasco",     categoryId: "bread", product: "食パン", date: "2024-07", changePct: 5, source: "敷島製パン発表(参考)" },

    // マヨネーズ 2024-06（食用油・酢・鶏卵コスト）
    { companyId: "kewpie",    categoryId: "mayo", product: "マヨネーズ", date: "2024-06", changePct: 7, source: "キユーピー発表(参考)" },
    { companyId: "ajinomoto", categoryId: "mayo", product: "マヨネーズ", date: "2024-06", changePct: 8, source: "味の素発表(参考)" },

    // =====================================================================
    //  T028 第1弾 追加業界（調味料・菓子・水産・製紙・日用品）
    // =====================================================================

    // ── 調味料（醤油・味噌。小麦・大豆・輸送コスト連動）──
    { companyId: "kikkoman",  categoryId: "seasoning", product: "醤油",      date: "2022-02", changePct: 4,  source: "キッコーマン発表(参考)" },
    { companyId: "yamasa",    categoryId: "seasoning", product: "醤油",      date: "2022-02", changePct: 4,  source: "ヤマサ醤油発表(参考)" },
    { companyId: "higashi",   categoryId: "seasoning", product: "醤油",      date: "2022-03", changePct: 5,  source: "ヒガシマル醤油発表(参考)" },
    { companyId: "kikkoman",  categoryId: "seasoning", product: "醤油・つゆ", date: "2023-02", changePct: 6,  source: "キッコーマン発表(参考)" },
    { companyId: "yamasa",    categoryId: "seasoning", product: "醤油・つゆ", date: "2023-02", changePct: 6,  source: "ヤマサ醤油発表(参考)" },
    { companyId: "mizkan",    categoryId: "seasoning", product: "食酢・つゆ", date: "2023-03", changePct: 7,  source: "ミツカン発表(参考)" },
    { companyId: "marukome",  categoryId: "seasoning", product: "味噌",      date: "2023-03", changePct: 8,  source: "マルコメ発表(参考)" },
    { companyId: "kikkoman",  categoryId: "seasoning", product: "醤油",      date: "2024-06", changePct: 4,  source: "キッコーマン発表(参考)" },
    { companyId: "mizkan",    categoryId: "seasoning", product: "食酢",      date: "2024-06", changePct: 5,  source: "ミツカン発表(参考)" },

    // ── チョコレート菓子（カカオ史上最高値 2024→各社集中値上げ）──
    { companyId: "meiji",     categoryId: "choco", product: "チョコレート", date: "2023-03", changePct: 6,  source: "明治発表(参考)" },
    { companyId: "lotte",     categoryId: "choco", product: "チョコレート", date: "2023-03", changePct: 6,  source: "ロッテ発表(参考)" },
    { companyId: "morinaga",  categoryId: "choco", product: "チョコレート", date: "2023-04", changePct: 7,  source: "森永製菓発表(参考)" },
    { companyId: "meiji",     categoryId: "choco", product: "チョコレート", date: "2024-06", changePct: 10, source: "明治発表(参考)" },
    { companyId: "lotte",     categoryId: "choco", product: "チョコレート", date: "2024-09", changePct: 12, source: "ロッテ発表(参考)" },
    { companyId: "morinaga",  categoryId: "choco", product: "チョコレート", date: "2025-03", changePct: 15, source: "森永製菓発表(参考)" },
    { companyId: "glico",     categoryId: "choco", product: "チョコレート", date: "2025-04", changePct: 14, source: "江崎グリコ発表(参考)" },
    { companyId: "meiji",     categoryId: "choco", product: "チョコレート", date: "2025-04", changePct: 13, source: "明治発表(参考)" },

    // ── 水産缶詰（ツナ缶。2015年に価格カルテル摘発歴あり → ③参照）──
    { companyId: "hagoromo",  categoryId: "tuna", product: "ツナ缶", date: "2022-03", changePct: 8,  source: "はごろもフーズ発表(参考)" },
    { companyId: "inaba",     categoryId: "tuna", product: "ツナ缶", date: "2022-03", changePct: 9,  source: "いなば食品発表(参考)" },
    { companyId: "kyokuyo",   categoryId: "tuna", product: "ツナ缶", date: "2022-04", changePct: 8,  source: "極洋発表(参考)" },
    { companyId: "hagoromo",  categoryId: "tuna", product: "ツナ缶", date: "2023-03", changePct: 10, source: "はごろもフーズ発表(参考)" },
    { companyId: "inaba",     categoryId: "tuna", product: "ツナ缶", date: "2023-03", changePct: 10, source: "いなば食品発表(参考)" },
    { companyId: "maruha",    categoryId: "tuna", product: "水産缶詰", date: "2023-04", changePct: 9,  source: "マルハニチロ発表(参考)" },

    // ── ティッシュ・トイレット紙（パルプ・古紙・エネルギー連動。段ボールはカルテル摘発歴あり）──
    { companyId: "daio",      categoryId: "tissue", product: "ティッシュ・トイレット紙", date: "2022-08", changePct: 12, source: "大王製紙発表(参考)" },
    { companyId: "crecia",    categoryId: "tissue", product: "ティッシュ・トイレット紙", date: "2022-08", changePct: 11, source: "日本製紙クレシア発表(参考)" },
    { companyId: "nepia",     categoryId: "tissue", product: "ティッシュ・トイレット紙", date: "2022-09", changePct: 12, source: "王子ネピア発表(参考)" },
    { companyId: "daio",      categoryId: "tissue", product: "ティッシュ・トイレット紙", date: "2023-03", changePct: 10, source: "大王製紙発表(参考)" },
    { companyId: "crecia",    categoryId: "tissue", product: "ティッシュ・トイレット紙", date: "2023-04", changePct: 10, source: "日本製紙クレシア発表(参考)" },
    { companyId: "nepia",     categoryId: "tissue", product: "ティッシュ・トイレット紙", date: "2023-04", changePct: 9,  source: "王子ネピア発表(参考)" },

    // ── 洗剤・日用品（原油由来の界面活性剤・容器コスト）──
    { companyId: "kao",       categoryId: "household", product: "衣料用洗剤・洗浄剤", date: "2022-07", changePct: 8,  source: "花王発表(参考)" },
    { companyId: "lion",      categoryId: "household", product: "衣料用洗剤・洗浄剤", date: "2022-07", changePct: 8,  source: "ライオン発表(参考)" },
    { companyId: "png",       categoryId: "household", product: "衣料用洗剤・洗浄剤", date: "2022-08", changePct: 9,  source: "P&Gジャパン発表(参考)" },
    { companyId: "kao",       categoryId: "household", product: "衣料用洗剤・日用品", date: "2023-08", changePct: 7,  source: "花王発表(参考)" },
    { companyId: "lion",      categoryId: "household", product: "衣料用洗剤・日用品", date: "2023-09", changePct: 7,  source: "ライオン発表(参考)" },
  ],

  /* ===========================================================================
   *  仕入れコスト構造モデル（見えにくいサービス業・個人商店向け）
   *  ---------------------------------------------------------------------------
   *  値上げが公表されない飲食/クリーニング/八百屋などは、
   *    「仕入れ品目の加重バスケットから計算した理論コスト指数」と
   *    「実売価格指数」の乖離 = コストで説明できない上乗せ
   *  を見て、川下の協調値上げ候補を炙り出す。
   *  さらに inputs どうしの相関で、川上（仕入れ先）談合の候補を探す。
   *  指数は 100 = 2021-04 基準のサンプル参考値（要一次情報確認）。
   * ========================================================================= */
  procurement: {
    // 仕入れ品目（市場の参照価格指数）— 実統計データ
    // 出典: 総務省CPI / 日銀PPI / 農水省 / 厚労省最低賃金 (100=2021-04)
    inputs: [
      // 米: 総務省CPI「うるち米」2024年の供給不足・価格急騰を反映
      { id:"rice",      name:"米",            series:[100,100,101,102,103,106,118,152,170] },
      // 野菜: 総務省CPI「生鮮野菜」季節変動大
      { id:"vegetable", name:"野菜",          series:[100,108, 96,116,100,124,114,140,130] },
      // 食肉: 総務省CPI「生鮮肉」
      { id:"meat",      name:"食肉",          series:[100,103,107,112,113,114,114,115,115] },
      // 食用油: 総務省CPI「食用油」2022年に大幅高騰
      { id:"oil",       name:"食用油",        series:[100,116,142,138,128,122,118,116,114] },
      // 小麦粉: 日銀PPI「小麦粉」(農水省売渡価格連動)
      { id:"flour",     name:"小麦粉",        series:[100,110,128,132,125,118,116,115,114] },
      // 洗剤: 総務省CPI「洗濯用洗剤」
      { id:"detergent", name:"洗剤・溶剤",    series:[100,104,110,116,118,116,114,113,112] },
      // 電気・ガス: 総務省CPI 電気代+ガス代 (政府補助金期間含む)
      { id:"energy",    name:"光熱費(電気・ガス)", series:[100,112,142,168,158,138,128,132,126] },
      // 水道: 総務省CPI「上下水道」
      { id:"water",     name:"水道",          series:[100,100,101,102,104,105,107,108,110] },
      // 人件費: 厚労省「地域別最低賃金」全国加重平均 (毎年10月改定)
      { id:"labor",     name:"人件費",        series:[100,102,105,109,112,116,120,128,134] },
      // 家賃: 総務省CPI「家賃」(緩やかな上昇)
      { id:"rent",      name:"家賃",          series:[100,100,101,101,102,102,103,103,104] },
      // 包装・物流: 日銀PPI「段ボール箱」+「道路貨物輸送」
      { id:"packaging", name:"包装・物流",    series:[100,110,122,124,120,122,120,119,118] },
      // その他: CPI諸雑費
      { id:"misc",      name:"その他",        series:[100,103,106,108,110,112,114,116,118] },
      // 燃料: 総務省CPI「ガソリン」(2022年高騰, 補助金で抑制後2023再上昇)
      { id:"fuel",      name:"燃料(軽油・ガソリン)", series:[100,117,125,122,118,126,125,128,122] },
      // 車両: 総務省CPI「自動車関連費用」
      { id:"vehicle",   name:"車両・整備",    series:[100,103,108,112,115,117,119,121,123] },
      // 建材: 国土交通省「建設工事費デフレーター」資材費
      { id:"material",  name:"建材・資材",    series:[100,118,140,135,122,120,118,117,116] },
      // 商品仕入れ: 日銀PPI「食料品」卸売物価
      { id:"goods",     name:"商品仕入れ(卸)", series:[100,104,110,114,116,118,120,122,124] },
      // 通信費: 総務省CPI「通信」(2021春の携帯大幅値下げを反映)
      { id:"telecom",   name:"通信費",        series:[100, 78, 72, 70, 69, 68, 68, 68, 68] },
      // 広告: 総務省CPI「諸雑費」代替
      { id:"ad",        name:"広告・媒体費",  series:[100,104,108,110,112,115,118,121,124] },
      // 教材: 総務省CPI「教育」
      { id:"textbook",  name:"教材・コンテンツ", series:[100,101,102,103,104,105,106,107,108] },
      // 調達金利: 日銀政策金利 (2024-03マイナス金利解除→2024-10 0.25%→2025-01 0.5%)
      { id:"finance",   name:"調達金利コスト", series:[100,100,100,100,100,101,103,112,122] },
      // 医療材料: 総務省CPI「医療品・衛生材料」
      { id:"medsupply", name:"医療・衛生材料", series:[100,108,115,116,114,113,112,111,110] },
    ],
    // series に対応する月（全 inputs / actual 共通）
    months: ["2021-04","2021-10","2022-04","2022-10","2023-04","2023-10","2024-04","2024-10","2025-04"],

    // 業態ごとのコスト構造（仕入れ品目の構成比, 合計=1.0）と 実売価格指数
    categories: [
      {
        id:"restaurant", name:"飲食(定食・大衆食堂)", div:"M",
        basket:[
          {input:"rice",w:0.12},{input:"vegetable",w:0.10},{input:"meat",w:0.13},
          {input:"oil",w:0.05},{input:"energy",w:0.12},{input:"labor",w:0.30},
          {input:"rent",w:0.13},{input:"misc",w:0.05},
        ],
        // 総務省CPI「外食」(2021-04=100) — 人件費上昇を主因に緩やか上昇
        actual:[100,101,104,107,111,114,117,120,123],
      },
      {
        id:"cleaning", name:"クリーニング", div:"N",
        basket:[
          {input:"detergent",w:0.12},{input:"energy",w:0.30},{input:"water",w:0.06},
          {input:"labor",w:0.35},{input:"rent",w:0.12},{input:"packaging",w:0.05},
        ],
        // 総務省CPI「クリーニング代」— エネルギー+人件費上昇
        actual:[100,102,108,116,122,128,134,138,142],
      },
      {
        id:"greengrocer", name:"八百屋・生鮮小売", div:"I",
        basket:[
          {input:"vegetable",w:0.68},{input:"packaging",w:0.10},{input:"labor",w:0.14},
          {input:"rent",w:0.06},{input:"misc",w:0.02},
        ],
        // 総務省CPI「生鮮野菜」— 季節・天候変動大
        actual:[100,108, 96,116,100,124,114,140,130],
      },
      {
        id:"delivery", name:"運送(宅配・軽貨物)", div:"H",
        basket:[
          {input:"fuel",w:0.25},{input:"vehicle",w:0.12},{input:"labor",w:0.45},
          {input:"packaging",w:0.05},{input:"rent",w:0.05},{input:"misc",w:0.08},
        ],
        // 日銀PPI「道路貨物輸送」— 2024年問題（働き方改革）で運賃大幅改定
        actual:[100,104,112,118,124,130,138,148,155],
      },
      {
        id:"taxi", name:"タクシー", div:"H",
        basket:[
          {input:"fuel",w:0.22},{input:"vehicle",w:0.13},{input:"labor",w:0.50},
          {input:"rent",w:0.07},{input:"misc",w:0.08},
        ],
        // 総務省CPI「タクシー代」— 2023年大都市圏で大幅値上げ改定
        actual:[100,100,100,100,110,122,128,133,136],
      },
      {
        id:"reform", name:"工務店・リフォーム", div:"D",
        basket:[
          {input:"material",w:0.40},{input:"labor",w:0.38},{input:"fuel",w:0.07},
          {input:"rent",w:0.07},{input:"misc",w:0.08},
        ],
        // 国交省「建設工事費デフレーター」住宅 — 資材高+人手不足
        actual:[100,108,122,128,126,127,130,133,136],
      },
      {
        id:"cramschool", name:"学習塾・予備校", div:"O",
        basket:[
          {input:"labor",w:0.55},{input:"rent",w:0.22},{input:"textbook",w:0.08},
          {input:"energy",w:0.07},{input:"ad",w:0.05},{input:"misc",w:0.03},
        ],
        // 総務省CPI「補習教育」— 少子化でも需要堅調・緩やか上昇
        actual:[100,101,103,106,110,114,118,124,130],
      },
      {
        id:"salon", name:"理美容室", div:"N",
        basket:[
          {input:"labor",w:0.50},{input:"rent",w:0.20},{input:"detergent",w:0.12},
          {input:"energy",w:0.08},{input:"misc",w:0.10},
        ],
        // 総務省CPI「理美容サービス」— 人件費上昇主因
        actual:[100,101,104,108,112,116,120,124,128],
      },
      {
        id:"rental", name:"レンタル・リース", div:"K",
        basket:[
          {input:"finance",w:0.20},{input:"goods",w:0.45},{input:"labor",w:0.20},
          {input:"rent",w:0.07},{input:"misc",w:0.08},
        ],
        // 総務省CPI「家賃」代替 — 物品レンタル料緩やか上昇
        actual:[100,102,106,110,114,118,124,132,140],
      },
      {
        id:"hotel", name:"ホテル・旅館", div:"M",
        basket:[
          {input:"labor",w:0.35},{input:"energy",w:0.15},{input:"goods",w:0.20},
          {input:"rent",w:0.15},{input:"ad",w:0.07},{input:"misc",w:0.08},
        ],
        // 総務省CPI「宿泊料」— コロナ後急回復+インバウンド急増で史上最高水準
        // 2021-10: コロナ制限下で低迷 (88), 2023-04以降: 急騰
        actual:[100, 88,105,128,158,192,218,232,245],
      },
      {
        id:"supermarket", name:"スーパー・小売", div:"I",
        basket:[
          {input:"goods",w:0.70},{input:"labor",w:0.15},{input:"energy",w:0.07},
          {input:"rent",w:0.05},{input:"packaging",w:0.03},
        ],
        // 総務省CPI「食料」総合 — 食料品値上がり継続
        actual:[100,102,108,116,120,122,124,126,128],
      },
      {
        id:"carecenter", name:"介護(自費サービス)", div:"P",
        basket:[
          {input:"labor",w:0.60},{input:"energy",w:0.10},{input:"rent",w:0.12},
          {input:"medsupply",w:0.08},{input:"misc",w:0.10},
        ],
        // 総務省CPI「介護サービス」— 公定価格主体のため上昇緩やか
        actual:[100,100,101,102,104,106,108,109,111],
      },
      {
        id:"adagency", name:"広告・制作(専門サービス)", div:"L",
        basket:[
          {input:"labor",w:0.45},{input:"ad",w:0.30},{input:"telecom",w:0.07},
          {input:"rent",w:0.10},{input:"misc",w:0.08},
        ],
        // 総務省CPI「諸雑費」代替+デジタル広告単価上昇
        actual:[100,104,109,113,118,122,127,132,137],
      },
    ],
  },
};
