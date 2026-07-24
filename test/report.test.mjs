import assert from "node:assert/strict";
import test from "node:test";

await import("../js/report-client.js");
const report = globalThis.CAP_ZIRAN_REPORT;
const { formatMessage } = await import("../api/report.js");

test("自然科回報用戶端只送出允許欄位並限制文字長度", () => {
  const payload = report.buildPayload({
    questionId: "基測92-2-36",
    year: 92,
    sitting: "第二次",
    era: "基測",
    no: 36,
    category: "化學反應",
    stem: "題幹".repeat(300),
    answer: "C",
    picked: "A",
    issueType: "圖片或表格有缺漏",
    note: "說明".repeat(400),
    url: "https://cap-ziran.pages.dev/",
    unexpected: "不應送出",
  });

  assert.equal(payload.questionId, "基測92-2-36");
  assert.equal(payload.stem.length, 500);
  assert.equal(payload.note.length, 800);
  assert.equal("unexpected" in payload, false);
});

test("三個正式站統一送往 Vercel 自然科回報 API", () => {
  assert.equal(report.endpoint({ hostname: "cap-ziran.vercel.app" }), "/api/report");
  assert.equal(
    report.endpoint({ hostname: "cap-ziran.pages.dev" }),
    "https://cap-ziran.vercel.app/api/report",
  );
  assert.equal(
    report.endpoint({ hostname: "cap-ziran.netlify.app" }),
    "https://cap-ziran.vercel.app/api/report",
  );
});

test("Telegram 訊息包含可定位自然科題目的必要欄位", () => {
  const message = formatMessage({
    questionId: "基測92-2-36",
    year: "92",
    sitting: "第二次",
    era: "基測",
    no: "36",
    category: "化學反應",
    stem: "小暘取鈉、鋅、銅三種金屬元素進行實驗。",
    answer: "C",
    picked: "A",
    issueType: "圖片或表格有缺漏",
    note: "流程圖被遮住。",
    url: "https://cap-ziran.pages.dev/",
  });

  assert.match(message, /自然科題目回報/);
  assert.match(message, /基測92-2-36/);
  assert.match(message, /92 年 第二次第 36 題/);
  assert.match(message, /學生選擇：A/);
  assert.match(message, /流程圖被遮住/);
});
