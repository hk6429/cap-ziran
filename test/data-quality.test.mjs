import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const context = vm.createContext({ window: { BANK: [] } });
for (const name of fs.readdirSync(path.join(root, "data")).filter(name => /^q\d+\.js$/.test(name))) {
  vm.runInContext(fs.readFileSync(path.join(root, "data", name), "utf8"), context);
}

test("37 卷 2071 題沒有缺圖或空白選項", () => {
  const missingImages = [];
  const blankOptions = [];
  const questions = context.window.BANK.flatMap(bank =>
    bank.questions.map(question => ({ ...question, bank })),
  );
  assert.equal(context.window.BANK.length, 37);
  assert.equal(questions.length, 2071);

  for (const { bank, ...question } of questions) {
    if (question.image && !fs.existsSync(path.join(root, question.image.split("?")[0]))) missingImages.push(question.image);
    for (const file of Object.values(question.optImages || {})) {
      if (file && !fs.existsSync(path.join(root, file))) missingImages.push(file);
    }
    for (const key of ["A", "B", "C", "D"]) {
      if (!String(question.options?.[key] || "").trim() && !question.optImages?.[key]) {
        blankOptions.push(`${bank.year}-${question.no}-${key}`);
      }
    }
  }
  for (const bank of context.window.BANK) {
    for (const group of Object.values(bank.groups || {})) {
      if (group.image && !fs.existsSync(path.join(root, group.image))) missingImages.push(group.image);
    }
  }

  assert.deepEqual(missingImages, []);
  assert.deepEqual(blankOptions, []);
});

function pngSize(relativePath) {
  const data = fs.readFileSync(path.join(root, relativePath));
  assert.equal(data.toString("ascii", 1, 4), "PNG");
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

test("97 年第二次第 54～58 題兩張共用圖均為完整尺寸", () => {
  const g54 = pngSize("img/9702/g54.png");
  const g57 = pngSize("img/9702/g57.png");
  assert.ok(g54.width >= 900 && g54.height >= 450, JSON.stringify(g54));
  assert.ok(g57.width >= 650 && g57.height >= 500, JSON.stringify(g57));
});

test("92 年第二次第 36 題使用完整且清楚的實驗流程圖", () => {
  const image = pngSize("img/9202/q36.png");
  assert.ok(image.width >= 600 && image.height >= 160, JSON.stringify(image));
  assert.ok(fs.statSync(path.join(root, "img/9202/q36.png")).size < 40_000);
});
