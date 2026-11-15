// Game rules. Pure functions (randomness is injected) so every rule is unit-tested.

export const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const ROUND_LENGTH = 10;
export const SPEED_SECONDS = 60;
const START_UNLOCKED = [1, 2];

/** A fact is "a × b" where a is the table being practised. */
export const factKey = (a, b) => `${a}x${b}`;
export const parseFact = (key) => key.split('x').map(Number);

/** Small seeded RNG (mulberry32) so tests are repeatable; the app passes Math.random. */
export function seeded(seed) {
    let t = seed >>> 0;
    return () => {
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

export function shuffle(list, random = Math.random) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** 10 different questions from one table: table × 1..12, shuffled. */
export function tableRound(table, random = Math.random) {
    return shuffle(TABLES, random)
        .slice(0, ROUND_LENGTH)
        .map((b) => ({ a: table, b }));
}

// ---------- stars & unlocking ----------

/** First-try correct answers out of 10 -> stars. */
export function starsFor(correct, total = ROUND_LENGTH) {
    const ratio = correct / total;
    if (ratio >= 1) return 3;
    if (ratio >= 0.8) return 2;
    if (ratio >= 0.6) return 1;
    return 0;
}

/** Tables 1 and 2 are open; each next table opens once the one before has at least one star. */
export function isUnlocked(table, stars = {}) {
    if (START_UNLOCKED.includes(table)) return true;
    return (stars[table - 1] || 0) >= 1;
}

export const unlockedTables = (stars) => TABLES.filter((t) => isUnlocked(t, stars));

// ---------- per-fact memory ----------

/** Records one answer. stats: { [factKey]: { seen, correct, streak } } */
export function recordAnswer(stats, a, b, isCorrect) {
    const key = factKey(a, b);
    const s = stats[key] || { seen: 0, correct: 0, streak: 0 };
    return {
        ...stats,
        [key]: {
            seen: s.seen + 1,
            correct: s.correct + (isCorrect ? 1 : 0),
            streak: isCorrect ? s.streak + 1 : 0,
        },
    };
}

/** How much a fact needs practice: unseen = 2, every miss adds, a run of correct answers lowers it. */
export function weakness(stat) {
    if (!stat) return 2;
    const misses = stat.seen - stat.correct;
    return Math.max(0.5, 1 + misses * 2 - stat.streak);
}

/** Mixed review: 10 facts from the unlocked tables, drawn more often from weak ones, no repeats. */
export function mixedRound(stats, tables, random = Math.random) {
    const pool = tables.flatMap((a) => TABLES.map((b) => ({ a, b, w: weakness(stats[factKey(a, b)]) })));
    const picked = [];
    while (picked.length < ROUND_LENGTH && pool.length) {
        const total = pool.reduce((sum, f) => sum + f.w, 0);
        let r = random() * total;
        const i = pool.findIndex((f) => (r -= f.w) <= 0);
        const [f] = pool.splice(i === -1 ? pool.length - 1 : i, 1);
        picked.push({ a: f.a, b: f.b });
    }
    return picked;
}

/** Facts the child gets wrong most (at least one miss), worst first. */
export function trickyFacts(stats, limit = 6) {
    return Object.entries(stats)
        .filter(([, s]) => s.seen > s.correct)
        .map(([key, s]) => ({ key, ...s, accuracy: s.correct / s.seen }))
        .sort((x, y) => x.accuracy - y.accuracy || y.seen - x.seen)
        .slice(0, limit);
}

export function accuracy(stats, table) {
    let seen = 0;
    let correct = 0;
    for (const [key, s] of Object.entries(stats)) {
        if (table && parseFact(key)[0] !== table) continue;
        seen += s.seen;
        correct += s.correct;
    }
    return seen ? correct / seen : null;
}

// ---------- speed challenge ----------

/** One random question from the unlocked tables, never the same as the previous one. */
export function speedQuestion(tables, previous, random = Math.random) {
    for (let i = 0; i < 20; i++) {
        const q = { a: tables[Math.floor(random() * tables.length)], b: 1 + Math.floor(random() * 12) };
        if (!previous || q.a !== previous.a || q.b !== previous.b) return q;
    }
    return { a: tables[0], b: previous?.b === 12 ? 1 : (previous?.b || 0) + 1 };
}

// ---------- answering ----------

/** Typed answers are digits only; anything else is not an answer yet. */
export function checkAnswer({ a, b }, typed) {
    if (!/^\d{1,3}$/.test(typed)) return null;
    return Number(typed) === a * b;
}
