import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Timer } from 'lucide-react';
import { SPEED_SECONDS, checkAnswer, recordAnswer, speedQuestion, unlockedTables } from '../lib/game';
import { currentPlayer, finishSession, recordStats, useStore } from '../lib/players';
import { play as sound } from '../lib/sound';
import { BigButton, NumPad, TopBar } from '../components/kit';
import { go } from '../lib/route';

export default function Speed() {
    const store = useStore();
    const player = currentPlayer(store);
    const [phase, setPhase] = useState('ready'); // ready | playing | done
    const [q, setQ] = useState(null);
    const [typed, setTyped] = useState('');
    const [score, setScore] = useState(0);
    const [left, setLeft] = useState(SPEED_SECONDS);
    const [flash, setFlash] = useState(null); // 'good' | { a, b }
    const [best, setBest] = useState({ previous: 0, isNew: false });
    const stats = useRef({});
    const endsAt = useRef(0);

    useEffect(() => {
        if (!player) go('players');
    }, [player]);

    const tables = player ? unlockedTables(player.stars) : [1];

    const begin = () => {
        stats.current = player.stats;
        setBest({ previous: player.speedBest, isNew: false });
        setScore(0);
        setTyped('');
        setFlash(null);
        setQ(speedQuestion(tables, null));
        endsAt.current = Date.now() + SPEED_SECONDS * 1000;
        setLeft(SPEED_SECONDS);
        setPhase('playing');
    };

    // Countdown based on the clock, not on interval counts, so it stays accurate.
    useEffect(() => {
        if (phase !== 'playing') return;
        const id = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000));
            setLeft(remaining);
            if (remaining === 0) setPhase('done');
        }, 200);
        return () => clearInterval(id);
    }, [phase]);

    // Save once when time is up.
    const scoreRef = useRef(score);
    scoreRef.current = score;
    useEffect(() => {
        if (phase !== 'done' || !player) return;
        const final = scoreRef.current;
        recordStats(player.id, stats.current);
        finishSession(player.id, { mode: 'speed', table: null, correct: final, total: final, stars: 0, seconds: SPEED_SECONDS });
        setBest((b) => ({ ...b, isNew: final > b.previous }));
        sound('finish', store.sound, final > player.speedBest ? 3 : 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    if (!player) return null;

    const submit = () => {
        const ok = checkAnswer(q, typed);
        if (ok === null || phase !== 'playing') return;
        stats.current = recordAnswer(stats.current, q.a, q.b, ok);
        sound(ok ? 'correct' : 'wrong', store.sound);
        if (ok) setScore((s) => s + 1);
        // A wrong answer shows the right one for a moment; no points lost.
        setFlash(ok ? 'good' : { a: q.a, b: q.b });
        setTimeout(() => setFlash(null), ok ? 250 : 1100);
        setTyped('');
        setQ(speedQuestion(tables, q));
    };

    if (phase === 'ready') {
        return (
            <>
                <TopBar title="Speed challenge" onBack={() => go('home')} />
                <div className="flex flex-col items-center rounded-3xl bg-white p-6 text-center shadow-sm">
                    <span className="grid h-16 w-16 place-items-center rounded-3xl bg-oops-soft text-oops"><Timer size={34} /></span>
                    <h2 className="mt-3 text-[24px] font-extrabold">How many in 60 seconds?</h2>
                    <p className="mt-1 text-[16px] font-semibold text-muted">Questions from your open tables: {tables.join(', ')}</p>
                    <p className="mt-3 text-[18px] font-extrabold">Your best: {player.speedBest}</p>
                    <BigButton className="mt-5 w-full" onClick={begin}>Start!</BigButton>
                </div>
            </>
        );
    }

    if (phase === 'done') {
        return (
            <>
                <TopBar title="Speed challenge" onBack={() => go('home')} />
                <div className="flex flex-col items-center text-center">
                    <p className="pop text-[64px] leading-none">{best.isNew ? '🏆' : '⏱️'}</p>
                    <h2 className="mt-3 text-[28px] font-extrabold">{best.isNew ? 'New best!' : "Time's up!"}</h2>
                    <p className="mt-1 text-[56px] font-extrabold leading-none tabular-nums">{score}</p>
                    <p className="text-[18px] font-bold text-muted">right answers</p>
                    {!best.isNew && best.previous > 0 && <p className="mt-2 text-[16px] font-semibold text-muted">Your best is {best.previous}. Keep going!</p>}
                    <div className="mt-6 grid w-full gap-2.5">
                        <BigButton onClick={begin}><RotateCcw size={20} /> Again</BigButton>
                        <BigButton tone="white" onClick={() => go('home')}>Home</BigButton>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="flex min-h-[calc(100dvh-48px)] flex-col">
            <TopBar
                title="Speed challenge"
                onBack={() => setPhase('done')}
                right={<span className="rounded-2xl bg-white px-4 py-2 text-[20px] font-extrabold tabular-nums shadow-sm">✓ {score}</span>}
            />
            <div className="mb-4 h-3 overflow-hidden rounded-full bg-white" role="progressbar" aria-label={`${left} seconds left`} aria-valuenow={left} aria-valuemin={0} aria-valuemax={SPEED_SECONDS}>
                <div className={`h-full rounded-full transition-[width] duration-200 ${left <= 10 ? 'bg-oops' : 'bg-brand'}`} style={{ width: `${(left / SPEED_SECONDS) * 100}%` }} />
            </div>
            <div
                className={`mb-5 flex flex-1 flex-col items-center justify-center rounded-3xl py-6 transition-colors ${
                    flash === 'good' ? 'bg-good-soft' : flash ? 'bg-oops-soft' : 'bg-white'
                }`}
            >
                <p className="text-[15px] font-bold text-muted tabular-nums">{left}s</p>
                <p className="text-[52px] font-extrabold leading-none tabular-nums">{q.a} × {q.b} =</p>
                <p className="mt-3 h-16 min-w-24 rounded-2xl bg-sky px-4 text-center text-[52px] font-extrabold leading-[64px] tabular-nums">{typed || '?'}</p>
                <p className="mt-2 h-8 text-[20px] font-extrabold text-oops">{flash && flash !== 'good' ? `${flash.a} × ${flash.b} = ${flash.a * flash.b}` : ''}</p>
            </div>
            <div className="pb-safe">
                <NumPad
                    canSubmit={typed.length > 0}
                    onDigit={(d) => setTyped((t) => (t.length < 3 ? (t === '0' ? d : t + d) : t))}
                    onDelete={() => setTyped((t) => t.slice(0, -1))}
                    onSubmit={submit}
                />
            </div>
        </div>
    );
}
