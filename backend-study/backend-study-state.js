(function attachBackendStudyState(global) {
  'use strict';

  const STORAGE_KEY = 'backendAtlasBackendStudyState';
  const SCHEMA_VERSION = 1;
  const DAY_PATTERN = /^D(?:0[1-9]|[12]\d|3[0-2])$/;
  const PRACTICE_PATTERN = /^D(?:0[1-9]|[12]\d|3[0-2])-P\d{2}$/;
  const QUESTION_PATTERN = /^D(?:0[1-9]|[12]\d|3[0-2])-Q\d{2}$/;
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const isoOrNull = value => typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : null;
  const boundedInt = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? Math.max(min, Math.min(max, parsed)) : min;
  };
  const unique = values => [...new Set(Array.isArray(values) ? values : [])];

  function createInitialState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      days: {},
      practice: {},
      quiz: {},
      wrong: [],
      weakTopics: {},
      reviewQueue: [],
      lastVisited: null
    };
  }

  function normalizeDayEntry(value) {
    if (!isObject(value)) return null;
    const sections = {};
    if (isObject(value.sections)) {
      for (const [name, completed] of Object.entries(value.sections)) {
        if (/^[a-z][a-z-]{1,32}$/i.test(name) && completed === true) sections[name] = true;
      }
    }
    return {
      sections,
      completedAt: isoOrNull(value.completedAt),
      updatedAt: isoOrNull(value.updatedAt)
    };
  }

  function normalizePracticeEntry(value) {
    if (!isObject(value)) return null;
    return {
      checkedSteps: unique(value.checkedSteps).filter(step => Number.isInteger(step) && step >= 0 && step < 100),
      completed: value.completed === true,
      completedAt: isoOrNull(value.completedAt)
    };
  }

  function normalizeQuizEntry(value) {
    if (!isObject(value)) return null;
    return {
      attempts: boundedInt(value.attempts, 0, 999),
      correct: boundedInt(value.correct, 0, 999),
      lastScore: boundedInt(value.lastScore, 0, 100),
      lastAttemptAt: isoOrNull(value.lastAttemptAt)
    };
  }

  function normalizeReviewEntry(value) {
    if (!isObject(value) || !QUESTION_PATTERN.test(String(value.questionId || ''))) return null;
    const dueAt = isoOrNull(value.dueAt);
    if (!dueAt) return null;
    return {
      questionId: value.questionId,
      dueAt,
      intervalDays: boundedInt(value.intervalDays, 1, 30),
      reason: ['wrong', 'hard', 'scheduled'].includes(value.reason) ? value.reason : 'scheduled'
    };
  }

  function normalizeState(input) {
    const source = isObject(input) ? input : {};
    const migrated = source.schemaVersion === 0 ? {
      ...source,
      days: Object.fromEntries(unique(source.completedDays).filter(day => DAY_PATTERN.test(day)).map(day => [day, { completedAt: new Date(0).toISOString(), sections: { complete: true } }])),
      wrong: source.wrongAnswers,
      schemaVersion: 1
    } : source;
    const state = createInitialState();
    if (isObject(migrated.days)) {
      for (const [dayId, value] of Object.entries(migrated.days)) {
        const normalized = DAY_PATTERN.test(dayId) ? normalizeDayEntry(value) : null;
        if (normalized) state.days[dayId] = normalized;
      }
    }
    if (isObject(migrated.practice)) {
      for (const [practiceId, value] of Object.entries(migrated.practice)) {
        const normalized = PRACTICE_PATTERN.test(practiceId) ? normalizePracticeEntry(value) : null;
        if (normalized) state.practice[practiceId] = normalized;
      }
    }
    if (isObject(migrated.quiz)) {
      for (const [questionId, value] of Object.entries(migrated.quiz)) {
        const normalized = QUESTION_PATTERN.test(questionId) ? normalizeQuizEntry(value) : null;
        if (normalized) state.quiz[questionId] = normalized;
      }
    }
    state.wrong = unique(migrated.wrong).filter(value => QUESTION_PATTERN.test(String(value || '')));
    if (isObject(migrated.weakTopics)) {
      for (const [topic, weight] of Object.entries(migrated.weakTopics)) {
        if (typeof topic === 'string' && topic.length <= 80) state.weakTopics[topic] = boundedInt(weight, 0, 999);
      }
    }
    state.reviewQueue = (Array.isArray(migrated.reviewQueue) ? migrated.reviewQueue : []).map(normalizeReviewEntry).filter(Boolean)
      .sort((left, right) => left.dueAt.localeCompare(right.dueAt));
    state.lastVisited = typeof migrated.lastVisited === 'string' && /^[a-z0-9?=&-]{1,180}$/i.test(migrated.lastVisited) ? migrated.lastVisited : null;
    return state;
  }

  function read(storage = global.localStorage) {
    try {
      const raw = storage?.getItem(STORAGE_KEY);
      if (!raw) return createInitialState();
      return normalizeState(JSON.parse(raw));
    } catch {
      try { storage?.removeItem(STORAGE_KEY); } catch {}
      return createInitialState();
    }
  }

  function write(state, storage = global.localStorage) {
    const normalized = normalizeState(state);
    try { storage?.setItem(STORAGE_KEY, JSON.stringify(normalized)); } catch {}
    return normalized;
  }

  function touchDay(state, dayId, section) {
    const next = normalizeState(state);
    if (!DAY_PATTERN.test(dayId)) return next;
    const current = next.days[dayId] || { sections: {}, completedAt: null, updatedAt: null };
    current.sections[section] = true;
    current.updatedAt = new Date().toISOString();
    next.days[dayId] = current;
    next.lastVisited = `day=${dayId}&section=${section}`;
    return next;
  }

  function completeDay(state, dayId) {
    const next = touchDay(state, dayId, 'complete');
    next.days[dayId].completedAt = next.days[dayId].completedAt || new Date().toISOString();
    return next;
  }

  function updatePractice(state, practiceId, checkedSteps, completed = false) {
    const next = normalizeState(state);
    if (!PRACTICE_PATTERN.test(practiceId)) return next;
    next.practice[practiceId] = {
      checkedSteps: unique(checkedSteps).filter(step => Number.isInteger(step) && step >= 0 && step < 100),
      completed: completed === true,
      completedAt: completed ? new Date().toISOString() : null
    };
    return next;
  }

  function scheduleReview(state, questionId, { correct, topics = [], now = new Date(), recordAttempt = true } = {}) {
    const next = normalizeState(state);
    if (!QUESTION_PATTERN.test(questionId)) return next;
    const prior = next.reviewQueue.find(item => item.questionId === questionId);
    const intervalDays = correct ? Math.min(30, Math.max(3, (prior?.intervalDays || 1) * 2)) : 1;
    const dueAt = new Date(now.getTime() + intervalDays * 86400000).toISOString();
    next.reviewQueue = next.reviewQueue.filter(item => item.questionId !== questionId);
    next.reviewQueue.push({ questionId, dueAt, intervalDays, reason: correct ? 'scheduled' : 'wrong' });
    next.reviewQueue.sort((left, right) => left.dueAt.localeCompare(right.dueAt));
    if (correct) next.wrong = next.wrong.filter(id => id !== questionId);
    else if (!next.wrong.includes(questionId)) next.wrong.push(questionId);
    for (const topic of unique(topics).filter(value => typeof value === 'string' && value.length <= 80)) {
      next.weakTopics[topic] = Math.max(0, (next.weakTopics[topic] || 0) + (correct ? -1 : 1));
    }
    if (recordAttempt) {
      const current = next.quiz[questionId] || { attempts: 0, correct: 0, lastScore: 0, lastAttemptAt: null };
      current.attempts += 1;
      current.correct += correct ? 1 : 0;
      current.lastScore = correct ? 100 : 0;
      current.lastAttemptAt = now.toISOString();
      next.quiz[questionId] = current;
    }
    return next;
  }

  global.BackendStudyState = Object.freeze({
    STORAGE_KEY,
    SCHEMA_VERSION,
    createInitialState,
    normalizeState,
    read,
    write,
    touchDay,
    completeDay,
    updatePractice,
    scheduleReview
  });
})(window);
