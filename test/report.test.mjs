import assert from "node:assert/strict";
import test from "node:test";

await import("../js/report-client.js");
const report = globalThis.CAP_ZIRAN_REPORT;
const { formatMessage } = await import("../api/report.js");
const {
  formatMessage: formatCloudflareMessage,
  handleReportRequest,
} = await import("../functions/api/report.js");

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

test("三個正式站統一送往 Cloudflare 自然科回報 API", () => {
  assert.equal(
    report.endpoint({ hostname: "cap-ziran.pages.dev" }),
    "/api/report",
  );
  assert.equal(
    report.endpoint({ hostname: "cap-ziran.vercel.app" }),
    "https://cap-ziran.pages.dev/api/report",
  );
  assert.equal(
    report.endpoint({ hostname: "cap-ziran.netlify.app" }),
    "https://cap-ziran.pages.dev/api/report",
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

  assert.match(message, /會考-自然科題目問題回報/);
  assert.match(message, /基測92-2-36/);
  assert.match(message, /92 年 第二次第 36 題/);
  assert.match(message, /學生選擇：A/);
  assert.match(message, /流程圖被遮住/);
  assert.equal(formatCloudflareMessage({
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
  }), message);
});

test("Cloudflare 回報 API 通過 CORS 預檢且 honeypot 不呼叫 Telegram", async () => {
  const origin = "https://cap-ziran.pages.dev";
  const optionsResponse = await handleReportRequest(new Request("https://cap-ziran.pages.dev/api/report", {
    method: "OPTIONS",
    headers: { Origin: origin },
  }));
  assert.equal(optionsResponse.status, 204);
  assert.equal(optionsResponse.headers.get("Access-Control-Allow-Origin"), origin);

  let telegramCalls = 0;
  const response = await handleReportRequest(new Request("https://cap-ziran.pages.dev/api/report", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ questionId: "診斷", issueType: "其他", website: "bot-check" }),
  }), {}, async () => {
    telegramCalls += 1;
    return Response.json({ ok: true });
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(telegramCalls, 0);
});

test("Cloudflare 回報 API 只在完整設定後轉送 Telegram", async () => {
  let telegramPayload;
  const response = await handleReportRequest(new Request("https://cap-ziran.pages.dev/api/report", {
    method: "POST",
    headers: { Origin: "https://cap-ziran.pages.dev", "Content-Type": "application/json" },
    body: JSON.stringify({
      questionId: "基測92-2-36",
      issueType: "圖片或表格有缺漏",
      stem: "流程圖題",
    }),
  }), {
    TELEGRAM_BOT_TOKEN: "test-token",
    TELEGRAM_CHAT_ID: "test-chat",
  }, async (url, options) => {
    telegramPayload = { url, body: JSON.parse(options.body) };
    return Response.json({ ok: true });
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.match(telegramPayload.url, /^https:\/\/api\.telegram\.org\/bottest-token\/sendMessage$/);
  assert.equal(telegramPayload.body.chat_id, "test-chat");
  assert.match(telegramPayload.body.text, /基測92-2-36/);
});
