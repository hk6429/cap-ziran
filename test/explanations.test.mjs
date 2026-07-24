import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const context = vm.createContext({ window: { BANK: [] } });
for (const year of [103,104,105,106,107,108,109,110,111,112,113,114]) {
  vm.runInContext(fs.readFileSync(path.join(root, `data/q${year}.js`), "utf8"), context);
}
vm.runInContext(
  fs.readFileSync(path.join(root, "data/answer-distributions.js"), "utf8"),
  context,
);

const questions = context.window.BANK.flatMap(bank =>
  bank.questions.map(question => ({ ...question, year: bank.year })),
);

test("103 至 114 年每題都有解題關鍵與 A-D 逐選項辨析", () => {
  const missing = questions.filter(question => {
    const explanation = String(question.explain || "");
    return !explanation.includes("解題關鍵")
      || ["A", "B", "C", "D"].some(key => !new RegExp(`[（(]${key}[）)]`).test(explanation));
  });
  assert.equal(
    missing.length,
    0,
    `缺完整解析 ${missing.length} 題，例如 ${missing.slice(0, 10).map(q => `${q.year}-${q.no}`).join("、")}`,
  );
});

test("108 至 114 年 362 題均有全體與待加強四選項正式統計", () => {
  const covered = questions.filter(question => question.year >= 108);
  assert.equal(covered.length, 362);
  for (const question of covered) {
    assert.deepEqual(Object.keys(question.opt || {}).sort(), ["A", "B", "C", "D"]);
    assert.deepEqual(Object.keys(question.low?.opt || {}).sort(), ["A", "B", "C", "D"]);
    assert.ok(question.optSource?.all?.file);
    assert.ok(question.optSource?.low?.file);
  }
});
