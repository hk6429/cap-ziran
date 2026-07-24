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
  const lines = [
    "🚩 自然科題目回報",
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
  ];
  return lines.join("\n").slice(0, 3900);
}

function allowedOrigins() {
  const extras = clean(process.env.REPORT_ALLOWED_ORIGINS || "", 1000)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ORIGINS, ...extras]);
}

function setCors(req, res) {
  const origin = clean(req.headers.origin || "", 300);
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (allowedOrigins().has(origin) || local) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "僅接受 POST" });

  const origin = clean(req.headers.origin || "", 300);
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (origin && !allowedOrigins().has(origin) && !local) {
    return res.status(403).json({ ok: false, error: "不允許的來源" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  } catch {
    return res.status(400).json({ ok: false, error: "回報資料格式錯誤" });
  }
  if (clean(body.website, 120)) return res.status(200).json({ ok: true });
  if (!clean(body.questionId, 80) || !clean(body.issueType, 40)) {
    return res.status(400).json({ ok: false, error: "回報資料不完整" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(503).json({ ok: false, error: "教師回報系統尚未完成設定" });
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatMessage(body),
      disable_web_page_preview: true,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    console.error("Telegram report delivery failed", response.status, result.description || "unknown");
    return res.status(502).json({ ok: false, error: "回報暫時無法送出，請稍後再試" });
  }
  return res.status(200).json({ ok: true });
}
