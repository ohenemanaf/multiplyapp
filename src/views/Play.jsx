import { useEffect, useRef, useState } from 'react';
import { Award, RotateCcw, Sprout, Trophy } from 'lucide-react';
import { ROUND_LENGTH, checkAnswer, isUnlocked, mixedRound, recordAnswer, starsFor, tableRound, unlockedTables } from '../lib/game';
import { currentPlayer, finishSession, recordStats, useStore } from '../lib/players';
import { play as sound } from '../lib/sound';
import { BigButton, Card, Medal, NumPad, Stars, TopBar, iconProps } from '../components/kit';
import { Correction, QuestionPage } from '../components/Page';
import { go, replace } from '../lib/route';

const PRAISE = ['Great!', 'Yes!', 'Super!', 'Correct!', 'Well done!', 'Brilliant!'];

function Results({ result, mode, table, player, starsBefore, onAgain }) {
    const next = mode === 'table' && table < 12 && isUnlocked(table + 1, player.stars) ? table + 1 : null;
    const medal =
        result.stars === 3
            ? { icon: Trophy, tone: 'sun', title: 'Perfect score!' }
            : result.stars
              ? { icon: Award, tone: 'cobalt', title: 'Well done!' }
              : { icon: Sprout, tone: 'leaf', title: 'Good try!' };
    // Only celebrate the unlock the first time this table earns a star.
    const unlockedNow = next && starsBefore === 0 && result.stars > 0;

    return (
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
            <Medal icon={medal.icon} tone={medal.tone} className="stamp shadow-[0_8px_0_var(--color-rule)]" />
            <h2 className="mt-5 text-[28px] font-semibold tracking-tight">{medal.title}</h2>
            <p className="mt-1 text-[17px] text-pencil">{result.correct} of {ROUND_LENGTH} right first time</p>
            {mode === 'table' && <Stars count={result.stars} size={40} className="mt-4" />}
            {mode === 'table' && result.stars === 0 && <p className="mt-3 max-w-xs text-[15px] text-pencil">Get 6 right to earn your first star. You can do it.</p>}
            {unlockedNow && <p className="rise mt-4 rounded-full bg-cobalt-wash px-4 py-1.5 text-[15px] font-medium text-cobalt">You opened the {next} times table</p>}

            {result.missed.length > 0 && (
                <Card className="mt-6 w-full p-4 text-left">
                    <p className="mb-1 text-[15px] font-medium text-pencil">Corrections to remember</p>
                    <ul className="divide-y divide-rule">
                        {result.missed.map((q) => (
                            <li key={`${q.a}x${q.b}`} className="py-2 text-[22px] font-semibold text-coral">
                                {q.a} × {q.b} = {q.a * q.b}
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            <div className="mt-6 grid w-full gap-3">
                {next && <BigButton onClick={() => replace(`play/table/${next}`)}>Play the {next} times table</BigButton>}
                <BigButton variant={next ? 'outline' : 'solid'} onClick={onAgain}>
                    <RotateCcw size={20} {...iconProps} /> Play again
                </BigButton>
                <BigButton variant="outline" onClick={() => go('home')}>Back to tables</BigButton>
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
    const starsBefore = useRef(0);

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
        starsBefore.current = player.stars[table] || 0;
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
        if (ok) setTimeout(advance, 800);
    };

    if (result) {
        return (
            <>
                <TopBar title={title} onBack={() => go('home')} />
                <Results result={result} mode={mode} table={table} player={player} starsBefore={starsBefore.current} onAgain={start} />
            </>
        );
    }

    const done = Math.min(index, ROUND_LENGTH);
    return (
        <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-lg flex-col">
            <TopBar
                title={title}
                onBack={() => go('home')}
                right={<span className="text-[15px] font-medium text-pencil">{q.retry ? 'Second try' : `${done + 1} of ${ROUND_LENGTH}`}</span>}
            />

            <div className="mb-4 grid grid-cols-10 gap-1.5" aria-hidden>
                {Array.from({ length: ROUND_LENGTH }, (_, i) => (
                    <span
                        key={i}
                        className={`h-2.5 rounded-full ${i < done ? 'bg-cobalt' : i === done && !q.retry ? 'bg-cobalt/35' : 'bg-card ring-1 ring-rule'}`}
                    />
                ))}
            </div>

            <QuestionPage
                a={q.a}
                b={q.b}
                typed={typed}
                state={feedback ? (feedback.correct ? 'right' : 'wrong') : null}
                note={q.retry ? 'Try this one again' : null}
            >
                {feedback?.correct && <p className="rise mt-5 text-[22px] font-semibold text-leaf">{feedback.praise}</p>}
                {feedback && !feedback.correct && <Correction a={q.a} b={q.b} />}
            </QuestionPage>

            <div className="pb-safe mt-5">
                {feedback && !feedback.correct ? (
                    <BigButton className="w-full" onClick={advance} autoFocus>Got it, next question</BigButton>
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
