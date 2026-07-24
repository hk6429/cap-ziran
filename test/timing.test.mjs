import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const context = vm.createContext({ window: { BANK: [] } });
for (const year of [103, 111, 114]) {
  vm.runInContext(fs.readFileSync(new URL(`../data/q${year}.js`, import.meta.url), "utf8"), context);
}
vm.runInContext(fs.readFileSync(new URL("../data/timing.js", import.meta.url), "utf8"), context);

const questions = context.window.BANK.flatMap(bank =>
  bank.questions.map(question => ({ ...question, year: bank.year, era: bank.era, sitting: bank.sitting })),
);

test("自然科計時依 70 分鐘與各年度實際題數換算", () => {
  const timing = context.window.CAP_ZIRAN_TIMING;
  const question = year => questions.find(item => item.year === year);
  assert.equal(timing.secondsPerQuestion(question(103), questions).toFixed(1), "77.8");
  assert.equal(timing.secondsPerQuestion(question(111), questions), 84);
  assert.equal(timing.secondsPerQuestion(question(114), questions), 84);
});

