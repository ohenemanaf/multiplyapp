import { describe, expect, test } from 'vitest';
import {
    accuracy, checkAnswer, factKey, isUnlocked, mixedRound, recordAnswer, seeded, speedQuestion,
    starsFor, tableRound, trickyFacts, unlockedTables, weakness,
} from '../src/lib/game.js';

describe('table rounds', () => {
    test('10 different questions from the chosen table', () => {
        const round = tableRound(7, seeded(1));
        expect(round).toHaveLength(10);
        expect(round.every((q) => q.a === 7)).toBe(true);
        expect(new Set(round.map((q) => q.b)).size).toBe(10);
        expect(round.every((q) => q.b >= 1 && q.b <= 12)).toBe(true);
    });

    test('order changes between rounds', () => {
        expect(tableRound(3, seeded(1))).not.toEqual(tableRound(3, seeded(2)));
    });
});

describe('stars and unlocking', () => {
    test.each([[10, 3], [9, 2], [8, 2], [7, 1], [6, 1], [5, 0], [0, 0]])('%i correct -> %i stars', (correct, stars) => {
        expect(starsFor(correct)).toBe(stars);
    });

    test('tables 1 and 2 start open; the next opens with one star', () => {
        expect(unlockedTables({})).toEqual([1, 2]);
        expect(isUnlocked(3, { 2: 1 })).toBe(true);
        expect(isUnlocked(4, { 2: 3 })).toBe(false);
        expect(unlockedTables({ 1: 2, 2: 1, 3: 1 })).toEqual([1, 2, 3, 4]);
    });
});

describe('remembering facts', () => {
    test('records answers and streaks', () => {
        let s = {};
        s = recordAnswer(s, 7, 8, false);
        s = recordAnswer(s, 7, 8, true);
        s = recordAnswer(s, 7, 8, true);
        expect(s[factKey(7, 8)]).toEqual({ seen: 3, correct: 2, streak: 2 });
    });

    test('missed facts weigh more than mastered ones', () => {
        expect(weakness({ seen: 4, correct: 1, streak: 0 })).toBeGreaterThan(weakness(undefined));
        expect(weakness({ seen: 5, correct: 5, streak: 5 })).toBe(0.5);
    });

    test('mixed review favours the facts a child gets wrong', () => {
        let stats = {};
        for (let b = 1; b <= 12; b++) stats = recordAnswer(recordAnswer(stats, 2, b, true), 2, b, true); // all of 2 mastered
        for (let i = 0; i < 4; i++) stats = recordAnswer(stats, 3, 7, false); // 3 × 7 keeps going wrong
        let hits = 0;
        for (let seed = 1; seed <= 200; seed++) {
            const round = mixedRound(stats, [2, 3], seeded(seed));
            expect(round).toHaveLength(10);
            expect(new Set(round.map((q) => factKey(q.a, q.b))).size).toBe(10); // no repeats
            if (round.some((q) => q.a === 3 && q.b === 7)) hits++;
        }
        expect(hits / 200).toBeGreaterThan(0.9);
    });

    test('tricky facts list the worst first and ignore mastered ones', () => {
        let s = {};
        s = recordAnswer(recordAnswer(s, 8, 7, false), 8, 7, false);
        s = recordAnswer(recordAnswer(s, 6, 9, false), 6, 9, true);
        s = recordAnswer(s, 2, 2, true);
        expect(trickyFacts(s).map((f) => f.key)).toEqual(['8x7', '6x9']);
    });

    test('accuracy overall and per table', () => {
        let s = {};
        s = recordAnswer(s, 3, 1, true);
        s = recordAnswer(s, 3, 2, false);
        s = recordAnswer(s, 4, 2, true);
        expect(accuracy(s)).toBeCloseTo(2 / 3);
        expect(accuracy(s, 3)).toBe(0.5);
        expect(accuracy(s, 9)).toBe(null);
    });
});

test('speed questions come from unlocked tables and never repeat back-to-back', () => {
    const random = seeded(5);
    let prev = null;
    for (let i = 0; i < 300; i++) {
        const q = speedQuestion([2, 5], prev, random);
        expect([2, 5]).toContain(q.a);
        if (prev) expect(q.a === prev.a && q.b === prev.b).toBe(false);
        prev = q;
    }
});

test('answers: digits only, checked against the product', () => {
    expect(checkAnswer({ a: 7, b: 8 }, '56')).toBe(true);
    expect(checkAnswer({ a: 7, b: 8 }, '54')).toBe(false);
    expect(checkAnswer({ a: 7, b: 8 }, '')).toBe(null);
    expect(checkAnswer({ a: 7, b: 8 }, '5a')).toBe(null);
    expect(checkAnswer({ a: 12, b: 12 }, '144')).toBe(true);
});
