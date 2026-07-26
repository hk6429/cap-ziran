import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL("../js/question-progress.js", import.meta.url), "utf8"), context);

function storage(){
  const data = new Map();
  return { getItem:key=>data.get(key) ?? null, setItem:(key,value)=>data.set(key,String(value)) };
}

test("做題紀錄可保存、標記並篩選未做過題目", () => {
  const progress = context.CAP_ZIRAN_PROGRESS;
  const store = storage();
  progress.mark(store, "會考114-1-1");
  assert.deepEqual([...progress.load(store)], ["會考114-1-1"]);
  const questions = [{id:"會考114-1-1"}, {id:"會考114-1-2"}];
  assert.deepEqual(progress.filter(questions, progress.load(store), "unseen"), [{id:"會考114-1-2"}]);
  assert.deepEqual(progress.filter(questions, progress.load(store), "seen"), [{id:"會考114-1-1"}]);
});

test("匯入做題紀錄會合併，不會覆蓋既有紀錄", () => {
  const progress = context.CAP_ZIRAN_PROGRESS;
  const store = storage();
  progress.mark(store, "q1");
  progress.merge(store, ["q2", "q1"]);
  assert.deepEqual([...progress.load(store)].sort(), ["q1", "q2"]);
});
