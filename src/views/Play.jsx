import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ROUND_LENGTH, checkAnswer, mixedRound, recordAnswer, starsFor, tableRound, unlockedTables, isUnlocked } from '../lib/game';
import { currentPlayer, finishSession, recordStats, useStore } from '../lib/players';
import { play as sound } from '../lib/sound';
import { BigButton, NumPad, Stars, TopBar } from '../components/kit';
import { go, replace } from '../lib/route';

const PRAISE = ['Great!', 'Yes!', 'Super!', 'Correct!', 'Well done!', 'Brilliant!'];

function Results({ result, mode, table, player, onAgain }) {
    const next = mode === 'table' && table < 12 && isUnlocked(table + 1, player.stars) ? table + 1 : null;
    return (
        <div className="flex flex-col items-center text-center">
            <p className="pop text-[64px] leading-none">{result.stars === 3 ? '🏆' : result.stars ? '🎉' : '💪'}</p>
            <h2 className="mt-3 text-[28px] font-extrabold">
                {result.stars === 3 ? 'Perfect!' : result.stars ? 'Well done!' : 'Good try!'}
            </h2>
            <p className="mt-1 text-[18px] font-bold text-muted">{result.correct} of {ROUND_LENGTH} right first time</p>
            {mode === 'table' && <Stars count={result.stars} size={44} className="pop mt-4" />}
            {mode === 'table' && result.stars === 0 && <p className="mt-3 max-w-xs text-[15px] font-semibold text-muted">Get 6 right to earn a star. You can do it!</p>}

            {result.missed.length > 0 && (
                <div className="mt-5 w-full rounded-3xl bg-white p-4 text-left shadow-sm">
                    <p className="mb-2 text-[15px] font-extrabold text-muted">Remember these:</p>
                    <div className="flex flex-wrap gap-2">
                        {result.missed.map((q) => (
                            <span key={`${q.a}x${q.b}`} className="rounded-xl bg-oops-soft px-3 py-1.5 text-[18px] font-extrabold text-oops">
                                {q.a} × {q.b} = {q.a * q.b}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-6 grid w-full gap-2.5">
                {next && <BigButton onClick={() => replace(`play/table/${next}`)}>Next: {next} times table →</BigButton>}
                <BigButton tone={next ? 'white' : 'brand'} onClick={onAgain}><RotateCcw size={20} /> Play again</BigButton>
                <BigButton tone="white" onClick={() => go('home')}>Home</BigButton>
            </div>
        </div>
    );
}

/** A 10-question round. mode: 'table' (one times table) or 'mixed' (weak facts first). */
export default function Play({ mode, table: tableParam }) {
    const store = useStore();
    const player = currentPlayer(store);
    const table = Number(tableParam);
    const [round, setRound] = useState(null);
    const [index, setIndex] = useState(0);
    const [typed, setTyped] = useState('');
    const [feedback, setFeedback] = useState(null); // { correct, praise }
    const [result, setResult] = useState(null);
    const firstTry = useRef({ correct: 0, missed: [] });
    const retries = useRef([]);
    const started = useRef(Date.now());
    const stats = useRef(player?.stats || {});

    const start = () => {
        const questions = mode === 'table' ? tableRound(table) : mixedRound(player.stats, unlockedTables(player.stars));
        setRound(questions.map((q) => ({ ...q, retry: false })));
        setIndex(0);
        setTyped('');
        setFeedback(null);
        setResult(null);
        firstTry.current = { correct: 0, missed: [] };
        retries.current = [];
        started.current = Date.now();
        stats.current = player.stats;
    };

    const allowed = player && (mode === 'mixed' || (table >= 1 && table <= 12 && isUnlocked(table, player.stars)));
    useEffect(() => {
        if (!player) go('players');
        else if (!allowed) go('home');
        else start();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, table]);

    if (!allowed || !round) return null;
    const q = round[index];
    const title = mode === 'table' ? `${table} times table` : 'Mixed practice';
    const progress = Math.min(index, ROUND_LENGTH);

    const finish = () => {
        const correct = firstTry.current.correct;
        const stars = starsFor(correct);
        const seconds = Math.round((Date.now() - started.current) / 1000);
        recordStats(player.id, stats.current);
        finishSession(player.id, { mode, table: mode === 'table' ? table : null, correct, total: ROUND_LENGTH, stars, seconds });
        sound('finish', store.sound, stars);
        setResult({ correct, stars, missed: firstTry.current.missed });
    };

    const advance = () => {
        setFeedback(null);
        setTyped('');
        // Missed questions come back once at the end, so the child gets another go.
        if (index === ROUND_LENGTH - 1 && retries.current.length) {
            const extra = retries.current.map((r) => ({ ...r, retry: true }));
            retries.current = [];
            setRound((r) => [...r, ...extra]);
            setIndex(index + 1);
            return;
        }
        if (index + 1 >= round.length) return finish();
        setIndex(index + 1);
    };

    const submit = () => {
        const ok = checkAnswer(q, typed);
        if (ok === null || feedback) return;
        if (!q.retry) {
            stats.current = recordAnswer(stats.current, q.a, q.b, ok);
            if (ok) firstTry.current.correct++;
            else {
                firstTry.current.missed.push({ a: q.a, b: q.b });
                retries.current.push({ a: q.a, b: q.b });
            }
        }
        sound(ok ? 'correct' : 'wrong', store.sound);
        navigator.vibrate?.(ok ? 15 : [20, 40, 20]);
        setFeedback({ correct: ok, praise: PRAISE[Math.floor(Math.random() * PRAISE.length)] });
        if (ok) setTimeout(advance, 700);
    };

    if (result) {
        return (
            <>
                <TopBar title={title} onBack={() => go('home')} />
                <Results result={result} mode={mode} table={table} player={player} onAgain={start} />
            </>
        );
    }

    return (
        <div className="flex min-h-[calc(100dvh-48px)] flex-col">
            <TopBar title={title} onBack={() => go('home')} />

            <div className="mb-4 flex gap-1.5" aria-label={`Question ${progress + 1} of ${ROUND_LENGTH}`}>
                {Array.from({ length: ROUND_LENGTH }, (_, i) => (
                    <span key={i} className={`h-2.5 flex-1 rounded-full ${i < progress ? 'bg-brand' : i === progress && !q.retry ? 'bg-brand/40' : 'bg-white'}`} />
                ))}
            </div>
            {q.retry && <p className="mb-2 text-center text-[15px] font-extrabold text-brand">Try this one again 💪</p>}

            <div
                className={`mb-5 flex flex-1 flex-col items-center justify-center rounded-3xl py-6 transition-colors ${
                    feedback ? (feedback.correct ? 'bg-good-soft' : 'bg-oops-soft') : 'bg-white'
                } ${feedback && !feedback.correct ? 'shake' : ''}`}
                aria-live="polite"
            >
                <p className="text-[52px] font-extrabold leading-none tabular-nums tracking-tight">
                    {q.a} × {q.b} =
                </p>
                {/* After a wrong answer the child's number is crossed out, so the right answer stands out. */}
                <p
                    className={`mt-3 h-16 min-w-24 rounded-2xl px-4 text-center font-extrabold leading-[64px] tabular-nums ${
                        !feedback ? 'bg-sky text-[52px]' : feedback.correct ? 'text-[52px] text-good' : 'text-[34px] text-oops/70 line-through'
                    }`}
                    aria-label={feedback && !feedback.correct ? `You answered ${typed}` : undefined}
                >
                    {typed || '?'}
                </p>
                {feedback?.correct && <p className="pop mt-2 text-[24px] font-extrabold text-good">{feedback.praise} ✓</p>}
                {feedback && !feedback.correct && (
                    <div className="mt-2 text-center">
                        <p className="text-[18px] font-bold text-oops">Not quite. The answer is</p>
                        <p className="pop mt-1 rounded-2xl bg-white px-5 py-2 text-[40px] font-extrabold text-ink shadow-sm">{q.a} × {q.b} = {q.a * q.b}</p>
                    </div>
                )}
            </div>

            <div className="pb-safe">
                {feedback && !feedback.correct ? (
                    <BigButton className="w-full" onClick={advance} autoFocus>Got it, next →</BigButton>
                ) : (
                    <NumPad
                        disabled={Boolean(feedback)}
                        canSubmit={typed.length > 0}
                        onDigit={(d) => {
                            sound('tap', store.sound);
                            setTyped((t) => (t.length < 3 ? (t === '0' ? d : t + d) : t));
                        }}
                        onDelete={() => setTyped((t) => t.slice(0, -1))}
                        onSubmit={submit}
                    />
                )}
            </div>
        </div>
    );
}
