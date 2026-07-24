// 國中教育會考自然科作答時間為 70 分鐘。
// 每題建議時間依各年度／場次的實際題數換算。
(function attachTiming(root) {
  const EXAM_SECONDS = 70 * 60;

  function sourceKey(question) {
    return `${question.era}|${question.year}|${question.sitting || ""}`;
  }

  function bankQuestionCount(question, allQuestions) {
    if (!question) return 0;
    const key = sourceKey(question);
    return allQuestions.filter(item => sourceKey(item) === key).length;
  }

  function secondsPerQuestion(question, allQuestions) {
    const count = bankQuestionCount(question, allQuestions);
    return count ? EXAM_SECONDS / count : 0;
  }

  function totalSeconds(questions, allQuestions) {
    return Math.round(
      questions.reduce(
        (sum, question) => sum + secondsPerQuestion(question, allQuestions),
        0,
      ),
    );
  }

  root.CAP_ZIRAN_TIMING = {
    EXAM_SECONDS,
    bankQuestionCount,
    secondsPerQuestion,
    totalSeconds,
  };
})(window);

