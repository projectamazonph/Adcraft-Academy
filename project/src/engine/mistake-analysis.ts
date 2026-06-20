/**
 * AdCraft: Mistake Analysis Engine
 *
 * Pure TypeScript function that analyzes quiz/simulation mistakes
 * and classifies error types. Zero framework dependencies.
 *
 * Used by the "Explain My Mistake" AI Replay feature (Phase 3).
 */

export type MistakeType =
  | 'formula-error'
  | 'logic-error'
  | 'knowledge-gap'
  | 'misread-data'
  | 'careless-error'
  | 'confused-terms'
  | 'threshold-error';

export interface MistakeAnalysis {
  questionId: string;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  selectedLabel: string;
  correctLabel: string;
  isCorrect: boolean;
  mistakeType: MistakeType | null;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  conceptTags: string[];
  suggestion: string;
}

export interface QuizMistakeReport {
  attemptId: string;
  quizId: string;
  title: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctCount: number;
  mistakeAnalyses: MistakeAnalysis[];
  weakAreas: { concept: string; count: number }[];
  recommendedModules: { moduleNumber: number; reason: string }[];
}

/**
 * Classify the type of mistake based on question context and answer patterns.
 */
export function classifyMistake(
  question: string,
  selected: string,
  correct: string,
  options: { label: string; text: string }[]
): MistakeType {
  const q = question.toLowerCase();
  const selectedText = options.find((o) => o.label === selected)?.text.toLowerCase() || '';
  const correctText = options.find((o) => o.label === correct)?.text.toLowerCase() || '';

  // Exact match of selected and correct text — means they chose wrong label but same meaning
  if (selected !== correct && selectedText === correctText) {
    return 'careless-error';
  }

  // Formula errors — question asks about calculation
  if (/calculate|formula|compute|equation/.test(q)) {
    return 'formula-error';
  }

  // Threshold/benchmark questions
  if (/threshold|minimum|maximum|limit|benchmark|target|recommended|acceptable/.test(q)) {
    return 'threshold-error';
  }

  // Logic/application questions
  if (/why|which.*should|would you|best|most appropriate|reason|strategy|when would/.test(q)) {
    return 'logic-error';
  }

  // Misread data — selected a different numeric value
  const selectedNums = selectedText.match(/\d+\.?\d*%?/g) || [];
  const correctNums = correctText.match(/\d+\.?\d*%?/g) || [];
  if (selectedNums.length > 0 && correctNums.length > 0) {
    const match = selectedNums.some((n) => correctNums.includes(n));
    if (!match) {
      return 'misread-data';
    }
  }

  // Confused terms — similar wording or concepts
  const selectedWords = new Set(selectedText.split(/\W+/).filter(Boolean));
  const correctWords = new Set(correctText.split(/\W+/).filter(Boolean));
  let commonWords = 0;
  for (const w of selectedWords) {
    if (correctWords.has(w)) commonWords++;
  }
  if (commonWords >= 2 || selectedText.includes(correctText.slice(0, 10))) {
    return 'confused-terms';
  }

  return 'knowledge-gap';
}

/**
 * Extract concept tags from question text.
 */
export function extractConceptTags(question: string): string[] {
  const tags: string[] = [];
  const q = question.toLowerCase();

  const conceptMap: Record<string, string[]> = {
    'acos': ['acos', 'advertising cost of sale'],
    'roas': ['roas', 'return on ad spend'],
    'cpc': ['cpc', 'cost per click', 'cost-per-click'],
    'ctr': ['ctr', 'click-through rate'],
    'cvr': ['cvr', 'conversion rate'],
    'tacos': ['tacos', 'total acos'],
    'keyword': ['keyword', 'search term', 'negative keyword', 'match type'],
    'bidding': ['bid', 'bidding', 'bid strategy'],
    'budget': ['budget', 'daily budget', 'spend limit'],
    'campaign': ['campaign', 'campaign structure', 'campaign type'],
    'targeting': ['targeting', 'audience', 'targeting type'],
    'negation': ['negate', 'negative', 'negation'],
    'placement': ['placement', 'top of search', 'product page'],
  };

  for (const [tag, keywords] of Object.entries(conceptMap)) {
    if (keywords.some((kw) => q.includes(kw))) {
      tags.push(tag);
    }
  }

  return [...new Set(tags)];
}

/**
 * Generate a suggestion for improvement based on mistake type and concept.
 */
export function generateSuggestion(
  mistakeType: MistakeType,
  conceptTags: string[]
): string {
  const concept = conceptTags[0] || 'ppc-fundamentals';

  const suggestions: Record<MistakeType, string> = {
    'formula-error':
      `Review the ${concept} formula and practice with the Formula Calculator tool. Focus on understanding which inputs go where.`,
    'logic-error':
      `Review when to apply ${concept} rules. Try working through examples step by step.`,
    'knowledge-gap':
      `Revisit the ${concept} module. Pay attention to definitions and core concepts.`,
    'misread-data':
      `Practice reading data tables carefully. Try the ${concept} simulation to build data-reading confidence.`,
    'careless-error':
      `Take your time with each question. Double-check before submitting.`,
    'confused-terms':
      `Compare and contrast ${concept} with similar concepts using a study table or the AI Mentor.`,
    'threshold-error':
      `Memorize the key thresholds for ${concept}. Use flashcards for quick recall.`,
  };

  return suggestions[mistakeType] || `Review the ${concept} material and try again.`;
}

/**
 * Analyze a single question.
 */
export function analyzeMistake(
  question: string,
  selectedLabel: string,
  selectedAnswer: string,
  correctLabel: string,
  correctAnswer: string,
  options: { label: string; text: string }[]
): MistakeAnalysis {
  const isCorrect = selectedAnswer === correctAnswer;
  const mistakeType = isCorrect
    ? null
    : classifyMistake(question, selectedAnswer, correctAnswer, options);
  const conceptTags = extractConceptTags(question);

  return {
    questionId: '',
    questionText: question,
    selectedAnswer,
    correctAnswer,
    selectedLabel,
    correctLabel,
    isCorrect,
    mistakeType,
    difficulty: 'intermediate',
    conceptTags,
    suggestion: isCorrect ? '' : generateSuggestion(mistakeType!, conceptTags),
  };
}

/**
 * Generate a full mistake report from a graded quiz attempt.
 */
export function generateMistakeReport(params: {
  attemptId: string;
  quizId: string;
  title: string;
  score: number;
  passed: boolean;
  questionResults: {
    question: string;
    selectedLabel: string;
    selectedAnswer: string;
    correctLabel: string;
    correctAnswer: string;
    options: { label: string; text: string }[];
    isCorrect: boolean;
  }[];
}): QuizMistakeReport {
  const analyses = params.questionResults.map((qr) =>
    analyzeMistake(
      qr.question,
      qr.selectedLabel,
      qr.selectedAnswer,
      qr.correctLabel,
      qr.correctAnswer,
      qr.options
    )
  );

  const conceptCount: Record<string, number> = {};
  for (const a of analyses) {
    if (!a.isCorrect) {
      for (const tag of a.conceptTags) {
        conceptCount[tag] = (conceptCount[tag] || 0) + 1;
      }
    }
  }

  const weakAreas = Object.entries(conceptCount)
    .map(([concept, count]) => ({ concept, count }))
    .sort((a, b) => b.count - a.count);

  const moduleRecommendations: { moduleNumber: number; reason: string }[] = [];
  if (weakAreas.some((w) => ['acos', 'roas', 'cpc', 'ctr', 'cvr', 'tacos'].includes(w.concept))) {
    moduleRecommendations.push({ moduleNumber: 1, reason: 'Review PPC Foundations (metrics & formulas)' });
  }
  if (weakAreas.some((w) => ['campaign', 'keyword', 'targeting'].includes(w.concept))) {
    moduleRecommendations.push({ moduleNumber: 4, reason: 'Review Campaign Architecture' });
  }
  if (weakAreas.some((w) => ['bidding', 'budget'].includes(w.concept))) {
    moduleRecommendations.push({ moduleNumber: 6, reason: 'Review Bidding Lab' });
  }
  if (weakAreas.some((w) => ['negation', 'search term', 'keyword'].includes(w.concept))) {
    moduleRecommendations.push({ moduleNumber: 7, reason: 'Review Search Term Triage' });
  }

  return {
    attemptId: params.attemptId,
    quizId: params.quizId,
    title: params.title,
    score: params.score,
    passed: params.passed,
    totalQuestions: params.questionResults.length,
    correctCount: params.questionResults.filter((r) => r.isCorrect).length,
    mistakeAnalyses: analyses,
    weakAreas,
    recommendedModules: moduleRecommendations,
  };
}
