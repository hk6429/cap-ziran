import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const context = vm.createContext({ window: {} });
vm.runInContext(
  fs.readFileSync(new URL("../js/year-filter.js", import.meta.url), "utf8"),
  context,
);

test("年份場次篩選合併所有勾選項目", () => {
  const filter = context.window.CAP_YEAR_FILTER;
  const selected = filter.selectedValues([
    { value: "會考114", checked: true },
    { value: "基測100-2", checked: true },
    { value: "會考103", checked: false },
  ]);
  assert.deepEqual([...selected], ["會考114", "基測100-2"]);
  assert.equal(filter.matches("會考114", selected), true);
  assert.equal(filter.matches("會考103", selected), false);
});

