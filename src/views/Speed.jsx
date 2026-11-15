import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Timer, Trophy, Zap } from 'lucide-react';
import { SPEED_SECONDS, checkAnswer, recordAnswer, speedQuestion, unlockedTables } from '../lib/game';
import { currentPlayer, finishSession, recordStats, useStore } from '../lib/players';
import { play as sound } from '../lib/sound';
import { BigButton, Card, Medal, NumPad, TopBar, iconProps } from '../components/kit';
import { QuestionPage } from '../components/Page';
import { go } from '../lib/route';

export default function Speed() {
    const store = useStore();
    const player = currentPlayer(store);
    const [phase, setPhase] = useState('ready'); // ready | playing | done
    const [q, setQ] = useState(null);
    const [typed, setTyped] = useState('');
    const [score, setScore] = useState(0);
    const [left, setLeft] = useState(SPEED_SECONDS);
    const [flash, setFlash] = useState(null); // { ok, a, b }
    const [best, setBest] = useState({ previous: 0, isNew: false });
    const stats = useRef({});
    const endsAt = useRef(0);
    const flashTimer = useRef(null);

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

    // Countdown from the clock, not from counting intervals, so it stays accurate.
    useEffect(() => {
        if (phase !== 'playing') return;
        const id = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000));
            setLeft(remaining);
            if (remaining === 0) setPhase('done');
        }, 200);
        return () => clearInterval(id);
    }, [phase]);

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
        clearTimeout(flashTimer.current);
        setFlash({ ok, a: q.a, b: q.b });
        flashTimer.current = setTimeout(() => setFlash(null), ok ? 300 : 1200);
        setTyped('');
        setQ(speedQuestion(tables, q));
    };

    if (phase === 'ready') {
        return (
            <>
                <TopBar title="Speed challenge" onBack={() => go('home')} />
                <Card className="mx-auto flex max-w-lg flex-col items-center px-6 pb-6 pt-8 text-center">
                    <Medal icon={Timer} tone="coral" size={80} />
                    <h2 className="mt-5 text-[26px] font-semibold tracking-tight">How many in 60 seconds?</h2>
                    <p className="mt-2 max-w-xs text-[15px] text-pencil">Questions come from the tables you have opened: {tables.join(', ')}.</p>
                    <div className="mt-5 flex items-center gap-2 rounded-full bg-sun-wash px-4 py-1.5 text-[15px] font-medium text-[#9a6d00]">
                        <Trophy size={16} {...iconProps} /> Your best: {player.speedBest}
                    </div>
                    <BigButton tone="coral" className="mt-6 w-full" onClick={begin}>
                        <Zap size={20} {...iconProps} /> Start
                    </BigButton>
                </Card>
            </>
        );
    }

    if (phase === 'done') {
        return (
            <>
                <TopBar title="Speed challenge" onBack={() => go('home')} />
                <div className="mx-auto flex max-w-lg flex-col items-center text-center">
                    <Medal icon={best.isNew ? Trophy : Timer} tone={best.isNew ? 'sun' : 'coral'} className="stamp shadow-[0_8px_0_var(--color-rule)]" />
                    <h2 className="mt-5 text-[28px] font-semibold tracking-tight">{best.isNew ? 'New personal best!' : "Time's up!"}</h2>
                    <p className="mt-3 text-[64px] font-semibold leading-none tracking-tight">{score}</p>
                    <p className="mt-1 text-[17px] text-pencil">right in 60 seconds</p>
                    {!best.isNew && best.previous > 0 && <p className="mt-3 text-[15px] text-pencil">Your best is {best.previous}. Keep going!</p>}
                    <div className="mt-7 grid w-full gap-3">
                        <BigButton tone="coral" onClick={begin}><RotateCcw size={20} {...iconProps} /> Try again</BigButton>
                        <BigButton variant="outline" onClick={() => go('home')}>Back to tables</BigButton>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-lg flex-col">
            <TopBar
                title="Speed challenge"
                onBack={() => setPhase('done')}
                right={
                    <span className="rounded-2xl bg-leaf-wash px-3.5 py-1.5 text-[18px] font-semibold text-leaf" aria-label={`${score} right`}>
                        {score} right
                    </span>
                }
            />
            <div className="mb-4 flex items-center gap-3">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-card ring-1 ring-rule" role="progressbar" aria-label={`${left} seconds left`} aria-valuenow={left} aria-valuemin={0} aria-valuemax={SPEED_SECONDS}>
                    <div className={`h-full rounded-full transition-[width] duration-200 ${left <= 10 ? 'bg-coral' : 'bg-cobalt'}`} style={{ width: `${(left / SPEED_SECONDS) * 100}%` }} />
                </div>
                <span className={`w-10 text-right text-[17px] font-semibold ${left <= 10 ? 'text-coral' : 'text-pencil'}`}>{left}s</span>
            </div>
            <QuestionPage a={q.a} b={q.b} typed={typed} state={null}>
                <p className={`mt-5 h-8 text-[22px] font-semibold ${flash?.ok ? 'text-leaf' : 'text-coral'}`}>
                    {flash ? (flash.ok ? 'Correct' : `${flash.a} × ${flash.b} = ${flash.a * flash.b}`) : ''}
                </p>
            </QuestionPage>
            <div className="pb-safe mt-5">
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
