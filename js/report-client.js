(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CAP_ZIRAN_REPORT = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const fields = [
    "questionId", "year", "sitting", "era", "no", "category",
    "stem", "answer", "picked", "issueType", "note", "url", "website",
  ];

  function text(value, max) {
    return String(value == null ? "" : value).trim().slice(0, max);
  }

  function buildPayload(input) {
    const source = input || {};
    const limits = { stem: 500, note: 800, url: 300, website: 120 };
    return fields.reduce((payload, field) => {
      payload[field] = text(source[field], limits[field] || 80);
      return payload;
    }, {});
  }

  function endpoint(locationLike) {
    const hostname = String(locationLike?.hostname || "");
    return hostname === "cap-ziran.vercel.app" || hostname.endsWith(".vercel.app")
      ? "/api/report"
      : "https://cap-ziran.vercel.app/api/report";
  }

  async function submit(input, locationLike, fetchImpl) {
    const send = fetchImpl || fetch;
    const response = await send(endpoint(locationLike), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(input)),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || "回報暫時無法送出");
    return data;
  }

  return { buildPayload, endpoint, submit };
});
