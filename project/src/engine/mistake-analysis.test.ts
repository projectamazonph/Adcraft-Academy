import { describe, it, expect } from 'vitest';
import {
  classifyMistake,
  extractConceptTags,
  generateSuggestion,
  analyzeMistake,
  generateMistakeReport,
} from './mistake-analysis';

const sampleOptions = [
  { label: 'A', text: 'Total ad spend divided by attributed sales' },
  { label: 'B', text: 'Total ad spend divided by total sales' },
  { label: 'C', text: 'Total sales divided by ad spend' },
  { label: 'D', text: 'Total clicks divided by impressions' },
];

const unrelatedOptions = [
  { label: 'A', text: 'A cascading arrangement of elements' },
  { label: 'B', text: 'Elements placed side by side' },
  { label: 'C', text: 'Elements stacked vertically' },
  { label: 'D', text: 'Elements in a circular pattern' },
];

describe('classifyMistake', () => {
  it('detects formula errors', () => {
    const result = classifyMistake(
      'Which formula do you use to calculate ACoS?',
      'B',
      'A',
      sampleOptions
    );
    expect(result).toBe('formula-error');
  });

  it('detects threshold errors', () => {
    const result = classifyMistake(
      'What is the maximum recommended ACoS target for a launch product?',
      'B',
      'A',
      sampleOptions
    );
    expect(result).toBe('threshold-error');
  });

  it('detects logic errors', () => {
    const result = classifyMistake(
      'Why should you use phrase match over broad match?',
      'A',
      'B',
      sampleOptions
    );
    expect(result).toBe('logic-error');
  });

  it('detects misread data', () => {
    const percentOptions = [
      { label: 'A', text: 'The ACoS is 15% based on the data' },
      { label: 'B', text: 'The ACoS is 25% based on the data' },
    ];
    const result = classifyMistake(
      'What is the ACoS given $150 spend and $600 sales?',
      'B',
      'A',
      percentOptions
    );
    expect(result).toBe('misread-data');
  });

  it('defaults to knowledge-gap for unrelated questions', () => {
    const result = classifyMistake(
      'Which of the following describes the waterfall layout?',
      'B',
      'A',
      unrelatedOptions
    );
    expect(result).toBe('knowledge-gap');
  });

  it('detects careless error when text matches but label differs', () => {
    const sameTextOptions = [
      { label: 'A', text: 'The formula is spend divided by sales' },
      { label: 'B', text: 'The formula is spend divided by sales' },
    ];
    const result = classifyMistake(
      'What is ACoS?',
      'B',
      'A',
      sameTextOptions
    );
    expect(result).toBe('careless-error');
  });
});

describe('extractConceptTags', () => {
  it('extracts ACoS tag', () => {
    expect(extractConceptTags('What is ACoS?')).toContain('acos');
  });

  it('extracts multiple tags', () => {
    const tags = extractConceptTags('What is the best bid strategy for a campaign with a CPC of $0.50?');
    expect(tags).toContain('bidding');
    expect(tags).toContain('cpc');
    expect(tags).toContain('campaign');
  });

  it('returns empty for unrelated questions', () => {
    expect(extractConceptTags('Welcome to the course')).toEqual([]);
  });
});

describe('generateSuggestion', () => {
  it('generates formula-error suggestion', () => {
    const suggestion = generateSuggestion('formula-error', ['acos']);
    expect(suggestion).toContain('acos');
    expect(suggestion).toContain('Formula Calculator');
  });

  it('generates knowledge-gap suggestion', () => {
    const suggestion = generateSuggestion('knowledge-gap', ['bidding']);
    expect(suggestion).toContain('bidding');
    expect(suggestion).toContain('module');
  });
});

describe('analyzeMistake', () => {
  it('correct answer returns null mistake type', () => {
    const result = analyzeMistake(
      'What is ACoS?',
      'A', 'A', 'A', 'A',
      sampleOptions
    );
    expect(result.isCorrect).toBe(true);
    expect(result.mistakeType).toBeNull();
    expect(result.suggestion).toBe('');
  });

  it('wrong answer gets classified', () => {
    const result = analyzeMistake(
      'Which formula do you use to calculate ACoS?',
      'B', 'B', 'A', 'A',
      sampleOptions
    );
    expect(result.isCorrect).toBe(false);
    expect(result.mistakeType).toBe('formula-error');
    expect(result.suggestion).toBeTruthy();
    expect(result.conceptTags.length).toBeGreaterThan(0);
  });
});

describe('generateMistakeReport', () => {
  it('generates complete report with weak areas', () => {
    const report = generateMistakeReport({
      attemptId: 'attempt-1',
      quizId: 'quiz-1',
      title: 'Foundations Quiz',
      score: 60,
      passed: false,
      questionResults: [
        {
          question: 'Which formula do you use to calculate ACoS?',
          selectedLabel: 'B',
          selectedAnswer: 'B',
          correctLabel: 'A',
          correctAnswer: 'A',
          options: sampleOptions,
          isCorrect: false,
        },
        {
          question: 'What is CPC?',
          selectedLabel: 'A',
          selectedAnswer: 'A',
          correctLabel: 'A',
          correctAnswer: 'A',
          options: sampleOptions,
          isCorrect: true,
        },
        {
          question: 'What is ROAS?',
          selectedLabel: 'C',
          selectedAnswer: 'C',
          correctLabel: 'D',
          correctAnswer: 'D',
          options: sampleOptions,
          isCorrect: false,
        },
      ],
    });

    expect(report.attemptId).toBe('attempt-1');
    expect(report.score).toBe(60);
    expect(report.passed).toBe(false);
    expect(report.correctCount).toBe(1);
    expect(report.totalQuestions).toBe(3);
    expect(report.mistakeAnalyses).toHaveLength(3);
    expect(report.weakAreas.length).toBeGreaterThan(0);
    expect(report.recommendedModules.length).toBeGreaterThan(0);
  });
});
