const DEFAULT_ORIGINS = new Set([
  "https://cap-ziran.vercel.app",
  "https://cap-ziran.netlify.app",
  "https://cap-ziran.pages.dev",
]);

export function clean(value, max = 800) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

export function formatMessage(input) {
  const p = input || {};
  const sitting = clean(p.sitting, 20);
  const year = clean(p.year, 10);
  return [
    "會考-自然科題目問題回報",
    "",
    `題目：${clean(p.questionId, 80) || "未提供"}`,
    `來源：${clean(p.era, 20)} ${year}${year ? " 年" : ""}${sitting ? ` ${sitting}` : ""}第 ${clean(p.no, 10)} 題`,
    `分類：${clean(p.category, 40) || "未提供"}`,
    `問題類型：${clean(p.issueType, 40) || "其他"}`,
    `學生選擇：${clean(p.picked, 10) || "未作答"}`,
    `標準答案：${clean(p.answer, 20) || "未提供"}`,
    "",
    `題幹：${clean(p.stem, 500) || "未提供"}`,
    "",
    `回報內容：${clean(p.note, 800) || "未補充說明"}`,
    "",
    `頁面：${clean(p.url, 300)}`,
  ].join("\n").slice(0, 3900);
}

function allowedOrigins(env) {
  const extras = clean(env.REPORT_ALLOWED_ORIGINS || "", 1000)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ORIGINS, ...extras]);
}

function isLocalOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function responseHeaders(request, env) {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  });
  const origin = clean(request.headers.get("Origin") || "", 300);
  if (allowedOrigins(env).has(origin) || isLocalOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return headers;
}

function json(request, env, status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: responseHeaders(request, env),
  });
}

export async function handleReportRequest(request, env = {}, fetchImpl = fetch) {
  if (request.method === "OPTIONS") {
    const headers = responseHeaders(request, env);
    headers.delete("Content-Type");
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "POST") {
    return json(request, env, 405, { ok: false, error: "僅接受 POST" });
  }

  const origin = clean(request.headers.get("Origin") || "", 300);
  if (origin && !allowedOrigins(env).has(origin) && !isLocalOrigin(origin)) {
    return json(request, env, 403, { ok: false, error: "不允許的來源" });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(request, env, 400, { ok: false, error: "回報資料格式錯誤" });
  }
  if (clean(body.website, 120)) return json(request, env, 200, { ok: true });
  if (!clean(body.questionId, 80) || !clean(body.issueType, 40)) {
    return json(request, env, 400, { ok: false, error: "回報資料不完整" });
  }

  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return json(request, env, 503, { ok: false, error: "教師回報系統尚未完成設定" });
  }

  const telegramResponse = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatMessage(body),
      disable_web_page_preview: true,
    }),
  });
  const result = await telegramResponse.json().catch(() => ({}));
  if (!telegramResponse.ok || !result.ok) {
    console.error("Telegram report delivery failed", telegramResponse.status, result.description || "unknown");
    return json(request, env, 502, { ok: false, error: "回報暫時無法送出，請稍後再試" });
  }
  return json(request, env, 200, { ok: true });
}

export function onRequest(context) {
  return handleReportRequest(context.request, context.env);
}
