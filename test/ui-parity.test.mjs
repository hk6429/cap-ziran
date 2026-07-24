import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("首頁預設十題並提供英文會考版的主要操作", () => {
  assert.match(html, /id="numInput"[^>]*value="10"/);
  for (const id of ["timedChk", "diffSortChk", "rankBtn", "rankPanel"]) {
    assert.match(html, new RegExp(`id="${id}"`), `缺少 #${id}`);
  }
});

test("一般練習可複選年份場次，整回模考維持單選", () => {
  for (const id of ["bankPicker", "bankOptions", "mockBankSel"]) {
    assert.match(html, new RegExp(`id="${id}"`), `缺少 #${id}`);
  }
  assert.match(html, /className = "bankChk"/);
  assert.doesNotMatch(html, /id="bankSel"/);
});

test("首頁與排行榜均提供鑑別度篩選", () => {
  for (const id of ["discSel", "rankDiscSel"]) {
    assert.match(html, new RegExp(`id="${id}"`), `缺少 #${id}`);
  }
  assert.match(html, /value="disc10"/);
  assert.match(html, /value="discLow10"/);
});

test("解析區顯示全體與待加強四選項分布及迷思提示", () => {
  assert.match(html, /data-opt-group="all"/);
  assert.match(html, /data-opt-group="low"/);
  assert.match(html, /這題的關鍵迷思在/);
  assert.match(html, /data\/answer-distributions\.js/);
});

test("題庫檔案帶版本參數，部署後不會沿用舊解析快取", () => {
  assert.match(html, /data\/q103\.js\?v=20260724-natural-analysis/);
  assert.match(html, /data\/q114\.js\?v=20260724-natural-analysis/);
});
