/* =============================================================================
 *  Cartel Watch — サンプルデータ
 *  -----------------------------------------------------------------------------
 *  ★重要な注意★
 *  ここに収録した値上げ時期・変動率は「公開報道・各社プレスリリース等を元にした
 *  おおよその参考値（サンプル）」です。正確な検証には一次情報の確認が必要です。
 *  「同時期の値上げ」は協調行為（カルテル）の"候補"を示すものであり、
 *  それ自体が違法の証拠ではありません（原材料高騰など正当な共通要因がほとんど）。
 *  本ツールは"監視・調査の出発点"を見つけるための可視化を目的とします。
 *
 *  データの追記方法は README.md を参照。日付は "YYYY-MM" 形式。
 * ========================================================================== */

window.CARTEL_DATA = {
  meta: {
    version: "0.1.0",
    updated: "2026-06-17",
    disclaimer:
      "収録値は公開情報に基づくおおよその参考値（サンプル）。横並び値上げは協調の『候補』であり違法の証拠ではない。",
  },

  /* 原材料コスト指標（簡易インデックス, 100 = 基準）。
   * 値上げが「コスト要因で説明できるか」を判定する参照線に使う。 */
  commodities: [
    {
      id: "wheat",
      name: "輸入小麦 政府売渡価格",
      series: [
        { date: "2021-04", index: 100 }, { date: "2021-10", index: 119 },
        { date: "2022-04", index: 137 }, { date: "2022-10", index: 142 },
        { date: "2023-04", index: 132 }, { date: "2023-10", index: 122 },
        { date: "2024-04", index: 118 }, { date: "2024-10", index: 116 },
        { date: "2025-04", index: 114 },
      ],
    },
    {
      id: "crude",
      name: "原油 (物流・包装コスト)",
      series: [
        { date: "2021-04", index: 100 }, { date: "2021-10", index: 128 },
        { date: "2022-04", index: 165 }, { date: "2022-10", index: 150 },
        { date: "2023-04", index: 118 }, { date: "2023-10", index: 130 },
        { date: "2024-04", index: 125 }, { date: "2024-10", index: 120 },
        { date: "2025-04", index: 118 },
      ],
    },
    {
      id: "sugar",
      name: "砂糖 (粗糖)",
      series: [
        { date: "2021-04", index: 100 }, { date: "2022-04", index: 112 },
        { date: "2023-04", index: 138 }, { date: "2023-10", index: 152 },
        { date: "2024-04", index: 148 }, { date: "2025-04", index: 134 },
      ],
    },
    {
      id: "cacao",
      name: "カカオ豆",
      series: [
        { date: "2021-04", index: 100 }, { date: "2022-04", index: 108 },
        { date: "2023-04", index: 130 }, { date: "2023-10", index: 175 },
        { date: "2024-04", index: 290 }, { date: "2024-10", index: 250 },
        { date: "2025-04", index: 230 },
      ],
    },
    {
      id: "milk",
      name: "生乳",
      series: [
        { date: "2021-04", index: 100 }, { date: "2022-04", index: 104 },
        { date: "2022-11", index: 113 }, { date: "2023-08", index: 121 },
        { date: "2024-04", index: 122 }, { date: "2025-04", index: 123 },
      ],
    },
  ],

  industries: [
    { id: "food", name: "食品" },
    { id: "drink", name: "飲料・酒類" },
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
    // 仕入れ品目（市場の参照価格指数）
    inputs: [
      { id:"rice",      name:"米",            series:[100,100,101,103,104,106,112,135,150] },
      { id:"vegetable", name:"野菜",          series:[100,108,103,115, 98,120,110,125,118] },
      { id:"meat",      name:"食肉",          series:[100,104,110,114,116,118,120,122,124] },
      { id:"oil",       name:"食用油",        series:[100,118,140,138,128,120,116,114,112] },
      { id:"flour",     name:"小麦粉",        series:[100,110,128,132,125,118,116,115,114] },
      { id:"detergent", name:"洗剤・溶剤",    series:[100,112,130,128,120,118,116,115,114] },
      { id:"energy",    name:"光熱費(電気・ガス)", series:[100,115,140,158,150,138,130,128,126] },
      { id:"water",     name:"水道",          series:[100,100,101,102,104,105,107,108,110] },
      { id:"labor",     name:"人件費",        series:[100,102,104,107,110,113,116,120,124] },
      { id:"rent",      name:"家賃",          series:[100,100,101,101,102,102,103,103,104] },
      { id:"packaging", name:"包装・物流",    series:[100,110,122,124,120,122,120,119,118] },
      { id:"misc",      name:"その他",        series:[100,103,106,108,110,112,114,116,118] },
      { id:"fuel",      name:"燃料(軽油・ガソリン)", series:[100,120,150,145,128,135,130,128,126] },
      { id:"vehicle",   name:"車両・整備",    series:[100,103,108,112,115,117,119,121,123] },
      { id:"material",  name:"建材・資材",    series:[100,118,140,135,122,120,118,117,116] },
      { id:"goods",     name:"商品仕入れ(卸)", series:[100,104,110,114,116,118,120,122,124] },
      { id:"telecom",   name:"通信費",        series:[100, 99, 98, 97, 96, 96, 95, 95, 95] },
      { id:"ad",        name:"広告・媒体費",  series:[100,104,108,110,112,115,118,121,124] },
      { id:"textbook",  name:"教材・コンテンツ", series:[100,101,102,103,104,105,106,107,108] },
      { id:"finance",   name:"調達金利コスト", series:[100,100,100,101,102,104,108,115,122] },
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
        actual:[100,103,108,113,116,120,124,130,134],
      },
      {
        id:"cleaning", name:"クリーニング", div:"N",
        basket:[
          {input:"detergent",w:0.12},{input:"energy",w:0.30},{input:"water",w:0.06},
          {input:"labor",w:0.35},{input:"rent",w:0.12},{input:"packaging",w:0.05},
        ],
        actual:[100,104,112,120,126,132,138,144,150],
      },
      {
        id:"greengrocer", name:"八百屋・生鮮小売", div:"I",
        basket:[
          {input:"vegetable",w:0.68},{input:"packaging",w:0.10},{input:"labor",w:0.14},
          {input:"rent",w:0.06},{input:"misc",w:0.02},
        ],
        actual:[100,107,104,114,100,119,111,124,119],
      },
      {
        id:"delivery", name:"運送(宅配・軽貨物)", div:"H",
        basket:[
          {input:"fuel",w:0.25},{input:"vehicle",w:0.12},{input:"labor",w:0.45},
          {input:"packaging",w:0.05},{input:"rent",w:0.05},{input:"misc",w:0.08},
        ],
        actual:[100,106,116,120,120,123,124,127,129],
      },
      {
        id:"taxi", name:"タクシー", div:"H",
        basket:[
          {input:"fuel",w:0.22},{input:"vehicle",w:0.13},{input:"labor",w:0.50},
          {input:"rent",w:0.07},{input:"misc",w:0.08},
        ],
        actual:[100,104,110,114,116,120,124,128,132],
      },
      {
        id:"reform", name:"工務店・リフォーム", div:"D",
        basket:[
          {input:"material",w:0.40},{input:"labor",w:0.38},{input:"fuel",w:0.07},
          {input:"rent",w:0.07},{input:"misc",w:0.08},
        ],
        actual:[100,112,128,130,126,127,128,130,132],
      },
      {
        id:"cramschool", name:"学習塾・予備校", div:"O",
        basket:[
          {input:"labor",w:0.55},{input:"rent",w:0.22},{input:"textbook",w:0.08},
          {input:"energy",w:0.07},{input:"ad",w:0.05},{input:"misc",w:0.03},
        ],
        actual:[100,101,103,105,108,112,116,121,127],
      },
      {
        id:"salon", name:"理美容室", div:"N",
        basket:[
          {input:"labor",w:0.50},{input:"rent",w:0.20},{input:"detergent",w:0.12},
          {input:"energy",w:0.08},{input:"misc",w:0.10},
        ],
        actual:[100,102,105,108,111,114,117,120,123],
      },
      {
        id:"rental", name:"レンタル・リース", div:"K",
        basket:[
          {input:"finance",w:0.20},{input:"goods",w:0.45},{input:"labor",w:0.20},
          {input:"rent",w:0.07},{input:"misc",w:0.08},
        ],
        actual:[100,102,105,108,110,113,117,122,128],
      },
      {
        id:"hotel", name:"ホテル・旅館", div:"M",
        basket:[
          {input:"labor",w:0.35},{input:"energy",w:0.15},{input:"goods",w:0.20},
          {input:"rent",w:0.15},{input:"ad",w:0.07},{input:"misc",w:0.08},
        ],
        actual:[100,98,105,112,120,128,135,142,150],
      },
      {
        id:"supermarket", name:"スーパー・小売", div:"I",
        basket:[
          {input:"goods",w:0.70},{input:"labor",w:0.15},{input:"energy",w:0.07},
          {input:"rent",w:0.05},{input:"packaging",w:0.03},
        ],
        actual:[100,104,110,114,117,120,123,126,128],
      },
      {
        id:"carecenter", name:"介護(自費サービス)", div:"P",
        basket:[
          {input:"labor",w:0.60},{input:"energy",w:0.10},{input:"rent",w:0.12},
          {input:"medsupply",w:0.08},{input:"misc",w:0.10},
        ],
        actual:[100,101,103,105,107,110,112,115,118],
      },
      {
        id:"adagency", name:"広告・制作(専門サービス)", div:"L",
        basket:[
          {input:"labor",w:0.45},{input:"ad",w:0.30},{input:"telecom",w:0.07},
          {input:"rent",w:0.10},{input:"misc",w:0.08},
        ],
        actual:[100,103,107,110,113,117,121,125,129],
      },
    ],
  },
};
