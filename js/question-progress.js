(function(root, factory){
  const api = factory();
  if(typeof module === "object" && module.exports) module.exports = api;
  if(root) root.CAP_ZIRAN_PROGRESS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function(){
  const KEY = "capZiranCompletedQuestions";
  function normalize(value){
    const values = Array.isArray(value) ? value : (value instanceof Set ? [...value] : []);
    return new Set(values.filter(id=>typeof id === "string" && id.trim()).map(id=>id.trim()));
  }
  function load(storage){
    try{ return normalize(JSON.parse(storage.getItem(KEY) || "[]")); }
    catch(e){ return new Set(); }
  }
  function save(storage, ids){
    try{ storage.setItem(KEY, JSON.stringify([...normalize(ids)])); }
    catch(e){}
  }
  function mark(storage, id){
    const ids = load(storage);
    if(typeof id === "string" && id.trim()) ids.add(id.trim());
    save(storage, ids);
    return ids;
  }
  function merge(storage, ids){
    const merged = load(storage);
    normalize(ids).forEach(id=>merged.add(id));
    save(storage, merged);
    return merged;
  }
  function filter(list, ids, mode){
    const done = normalize(ids);
    if(mode === "unseen") return list.filter(q=>!done.has(q.id));
    if(mode === "seen") return list.filter(q=>done.has(q.id));
    return list.slice();
  }
  return {KEY, normalize, load, save, mark, merge, filter};
});
