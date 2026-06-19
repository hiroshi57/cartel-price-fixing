/* JFTC 法的措置一覧(年度ページ)から確定事件を構造化抽出する。
 * 入力: sources/raw/jftc_r1.html .. jftc_r7.html
 * 出力: sources/jftc_cases.json
 * 抽出: 事件名 / 行為概要 / 法条 / 措置年月日(西暦) / 種別 */
const fs = require("fs");
const path = require("path");

const RAW = path.join(__dirname, "raw");
const files = ["r1","r2","r3","r4","r5","r6","r7"];

// 令和N年M月D日 -> YYYY-MM
function reiwaToYM(s){
  const m = s.match(/令和(\d+|元)年(\d+)月(\d+)日/);
  if(!m) return null;
  const y = (m[1]==="元"?1:+m[1]) + 2018;
  return `${y}-${String(+m[2]).padStart(2,"0")}`;
}

// 法条 -> 種別
function kindOf(article, act){
  if(/3条後段|第3条後段|不当な取引制限/.test(article)) {
    if(/入札|発注|受注予定者|見積り合わせ|談合/.test(act)) return "入札談合";
    return "価格カルテル等";
  }
  if(/3条前段|私的独占/.test(article)) return "私的独占";
  if(/2条9項|19条|拘束条件|再販|優越的地位/.test(article)) return "不公正な取引方法";
  return "その他";
}

function stripTags(s){
  return s.replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/\s+/g," ").replace(/^[　\s]+|[　\s]+$/g,"").trim();
}

const all = [];
for(const f of files){
  const fp = path.join(RAW, `jftc_${f}.html`);
  if(!fs.existsSync(fp)) continue;
  const html = fs.readFileSync(fp, "utf8");
  // <tr> 単位に分割
  const rows = html.split(/<tr[\s>]/i).slice(1);
  for(const row of rows){
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m=>stripTags(m[1]));
    if(cells.length < 3) continue;
    // 日付セルを探す
    const dateCell = cells.find(c=>/令和(\d+|元)年\d+月\d+日/.test(c));
    if(!dateCell) continue;
    const ym = reiwaToYM(dateCell);
    // 事件名: 「に対する件」で終わるセル
    const nameCell = cells.find(c=>/に対する件$|参加(等)?業者(ら)?$|参加業者らに対する件/.test(c)) ||
                     cells.find(c=>/件$/.test(c) && c.length<80);
    // 行為: 「合意」「決定」「引き上げ」等を含む最長セル
    const actCell = cells.filter(c=>/合意|受注予定者|引き上げ|引上げ|販売価格|決定し|させていた|行っていた/.test(c))
                         .sort((a,b)=>b.length-a.length)[0] || "";
    // 法条: 「条」を含む短いセル
    const artCell = cells.find(c=>/条(前段|後段)?$|条$|2条9項|19条/.test(c) && c.length<20) || "";
    if(!nameCell) continue;
    all.push({
      fy: f.toUpperCase(),
      date: ym,
      name: nameCell,
      article: artCell,
      kind: kindOf(artCell, actCell),
      act: actCell.slice(0,200),
    });
  }
}

// 重複除去(name+date)
const seen = new Set();
const uniq = all.filter(c=>{ const k=c.name+"|"+c.date; if(seen.has(k))return false; seen.add(k); return true; });

// --- 企業名抽出 ---
function extractCompanies(text){
  const set = new Set();
  const re = /([一-龥ァ-ヶー・Ａ-ＺA-Za-z０-９0-9]{2,20}(?:株式会社|㈱|（株）|工業|製油|薬品|製薬|電力|海上|火災|保険|食品|商事|製作所|ケミファ|開発工業|車輛|トレクス))/g;
  let m; while((m=re.exec(text))!==null){ set.add(m[1].replace(/（株）/g,"㈱")); }
  return [...set].slice(0,8);
}
// --- 業種タグ（具体的→一般の順で判定。建設/保険/金融/EC/医療を独立分類） ---
function industryOf(t){
  if(/工事|土木|建設|舗装|アスファルト合材|跨線橋|新幹線|品川駅|名古屋駅|駅及び|電気設備|空調設備|管路|浄水場|排水処理/.test(t)) return "建設・土木";
  if(/活性炭|上水|下水|水道/.test(t)) return "上下水道・環境";
  if(/電気事業|電力|都市ガス|瓦斯|ガス|揮発油|石油|ＬＰガス|LPガス/.test(t)) return "エネルギー";
  if(/保険/.test(t)) return "保険";
  if(/銀行|信販|クレジット|カード|証券|金融|ビザ|Visa|決済/i.test(t)) return "金融";
  if(/医薬|後発医薬|錠|製剤|ワクチン|内視鏡|フタラール|メジフィジックス|医事|病院|シスメックス|検査/.test(t)) return "医薬品・医療";
  if(/コンピュータ|データプリント|データプラス|Google|グーグル|情報処理|システム|ソフト|サイネックス|スマートバリュー|ＩＴ/i.test(t)) return "IT・情報サービス";
  if(/スーパーマーケット|ドラッグストア|ゲンキー|ニシムタ|ロピア|ダイコク|量販店|ディスカウント/.test(t)) return "小売・量販";
  if(/コンタクト|視力|クーパービジョン|アルコン|シード|レンズ/.test(t)) return "医療機器・コンタクト";
  if(/楽天|アマゾン|Amazon|Booking|Expedia|エクスペディア|プラットフォーム|出店者|宿泊予約|ＥＣ/i.test(t)) return "EC・プラットフォーム";
  if(/シネマズ|映画|興行|配給/.test(t)) return "映画・娯楽";
  if(/一蘭|飲食|外食|ラーメン|スクールランチ|給食|調理/.test(t)) return "飲食・外食";
  if(/制服|繊維|アパレル|衣料/.test(t)) return "繊維・アパレル";
  if(/ごま|食用油|油脂|海苔|乾海苔|牛乳|乳|アイス|食品|砂糖|小麦/.test(t)) return "食品";
  if(/タイヤ|自動車|トレーラ|特装車|ハーレー|二輪|ダンロップ|BMW|ビー・エム・ダブリュー/.test(t)) return "自動車・輸送機";
  if(/缶|管継手|ドリル|バルブ|溶接|鋼|鉄|金属|樹脂|部品/.test(t)) return "工業製品・素材";
  if(/家具|椅子|インテリア|ベビーカー|チャイルドシート|育児|ゆりかご|アップリカ|コンビ/.test(t)) return "家具・育児・生活用品";
  if(/スポーツ|ウイルソン|アメアスポーツ/.test(t)) return "スポーツ・趣味用品";
  if(/漁協|漁連|漁業協同組合|農協|農業協同組合/.test(t)) return "農林水産・組合";
  if(/印刷|用紙|製紙|巻取/.test(t)) return "印刷・紙";
  if(/移送|運転管理|点検|清掃|警備|地質調査|結婚|相談所|IBJ/.test(t)) return "サービス・自治体業務";
  return "その他";
}
uniq.forEach(c=>{
  c.companies = extractCompanies((c.act||"") + " " + c.name);
  c.industry = industryOf(c.name + " " + (c.act||""));
});

fs.writeFileSync(path.join(__dirname,"jftc_cases.json"), JSON.stringify(uniq,null,2));
// ダッシュボード用 JS (file:// で fetch 不要にする)
fs.writeFileSync(path.join(__dirname,"..","cases-data.js"),
  "/* 一次情報: 公正取引委員会『独占禁止法の法的措置一覧』より自動抽出 (令和元〜7年度)\n" +
  " * 出典: https://www.jftc.go.jp/dk/ichiran/index.html  取得日: " + new Date().toISOString().slice(0,10) + "\n" +
  " * parse: sources/parse_jftc.js / 再取得: sources/fetch.sh */\n" +
  "window.JFTC_CASES = " + JSON.stringify(uniq) + ";\n");
console.log("抽出件数:", uniq.length);
const byKind = {};
uniq.forEach(c=>byKind[c.kind]=(byKind[c.kind]||0)+1);
console.log("種別内訳:", byKind);
console.log("\n--- 価格カルテル等(抜粋) ---");
uniq.filter(c=>c.kind==="価格カルテル等").slice(0,20).forEach(c=>console.log(`${c.date} | ${c.name} | ${c.act.slice(0,50)}`));
