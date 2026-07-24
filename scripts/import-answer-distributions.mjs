import fs from "node:fs";

const input = process.argv[2];
const output = process.argv[3] || "data/answer-distributions.js";
if (!input) {
  throw new Error("用法：node scripts/import-answer-distributions.mjs <canonical-json> [output]");
}

const rows = JSON.parse(fs.readFileSync(input, "utf8"));
const distributions = {};
for (const row of rows) {
  const year = distributions[row.year] ||= {};
  const question = year[row.question] ||= {};
  const group = row.group === "全體" ? "all" : "low";
  question[group] = {
    opt: { A: row.A, B: row.B, C: row.C, D: row.D },
    passRate: row.passRate,
    discrimination: row.discrimination,
    source: {
      label: `${row.year}年全國自然科試題分析`,
      file: row.source,
      locator: `第${row.question}題${row.group}`,
    },
  };
}

const source = `// 108–114 年會考自然科全體與待加強組四選項作答百分比。
// 數值直接取自使用者提供的心測中心試題分析；未作答與複選未列入，A–D 不重新正規化。
(function attachAnswerDistributions(){
  const DISTRIBUTIONS=${JSON.stringify(distributions)};
  for(const bank of (window.BANK||[])){
    const yearData=DISTRIBUTIONS[String(bank.year)];
    if(!yearData) continue;
    for(const q of bank.questions){
      const record=yearData[String(q.no)];
      if(!record?.all) continue;
      if(Number.isFinite(record.all.passRate)) q.pass=record.all.passRate;
      if(Number.isFinite(record.all.discrimination)) q.disc=record.all.discrimination;
      q.opt=record.all.opt;
      q.optSource={all:record.all.source};
      if(record.low){
        q.low={...(q.low||{}),opt:record.low.opt};
        q.optSource.low=record.low.source;
      }
    }
  }
  window.ANSWER_DISTRIBUTION_META={years:[108,109,110,111,112,113,114],questions:362,populations:["全體","待加強"]};
})();
`;

fs.writeFileSync(output, source);
