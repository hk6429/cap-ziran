(function attachYearFilter(root) {
  function selectedValues(items) {
    return new Set(
      Array.from(items)
        .filter(item => item.checked)
        .map(item => String(item.value)),
    );
  }

  function matches(value, selected) {
    return selected.has(String(value));
  }

  function summary(selected, total, labels) {
    if (selected.size === 0) return "未選年份／場次";
    if (selected.size === total) return `全部 ${total} 個年份／場次`;
    if (selected.size === 1) return labels.get([...selected][0]) || [...selected][0];
    return `已選 ${selected.size} 個年份／場次`;
  }

  root.CAP_YEAR_FILTER = { selectedValues, matches, summary };
})(window);

