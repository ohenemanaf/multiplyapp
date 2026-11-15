import { useEffect } from 'react';
import { ChevronRight, Lock, Shuffle, Timer, Volume2, VolumeX } from 'lucide-react';
import { TABLES, isUnlocked, trickyFacts } from '../lib/game';
import { currentPlayer, setSound, signOut, totalStars, useStore } from '../lib/players';
import { Avatar, Card, IconButton, Stars, TONES, iconProps, toneFor } from '../components/kit';
import { go } from '../lib/route';

function ModeRow({ icon: Icon, tone, title, detail, onClick }) {
    const t = TONES[tone];
    return (
        <button onClick={onClick} className="key flex w-full items-center gap-4 rounded-[20px] border border-rule bg-card p-4 text-left">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${t.wash} ${t.ink}`}>
                <Icon size={24} {...iconProps} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-semibold">{title}</span>
                <span className="block text-[14px] text-pencil">{detail}</span>
            </span>
            <ChevronRight size={20} {...iconProps} className="text-faint" />
        </button>
    );
}

export default function Home() {
    const store = useStore();
    const player = currentPlayer(store);
    useEffect(() => {
        if (!player) go('players');
    }, [player]);
    if (!player) return null;

    const stars = totalStars(player);
    const tricky = trickyFacts(player.stats).length;
    const nextLocked = TABLES.find((t) => !isUnlocked(t, player.stars));

    return (
        <>
            <header className="mb-5 flex items-center gap-3">
                <Avatar id={player.avatar} size={48} />
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-[21px] font-semibold leading-tight tracking-tight">{player.name}</h1>
                </div>
                <IconButton label={store.sound ? 'Turn sound off' : 'Turn sound on'} onClick={() => setSound(!store.sound)} className="border border-rule">
                    {store.sound ? <Volume2 size={20} {...iconProps} /> : <VolumeX size={20} {...iconProps} className="text-faint" />}
                </IconButton>
                <button
                    onClick={() => {
                        signOut();
                        go('players');
                    }}
                    className="key h-11 rounded-2xl border border-rule bg-card px-3.5 text-[14px] font-medium"
                >
                    Switch
                </button>
            </header>

            <Card className="mb-6 p-4">
                <div className="flex items-baseline justify-between">
                    <p className="text-[15px] font-medium">Star collection</p>
                    <p className="text-[15px] text-pencil">
                        <span className="text-[22px] font-semibold text-ink">{stars}</span> of 36
                    </p>
                </div>
                <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-paper" role="progressbar" aria-valuenow={stars} aria-valuemin={0} aria-valuemax={36} aria-label="Stars collected">
                    <div className="h-full rounded-full bg-sun transition-[width] duration-500" style={{ width: `${(stars / 36) * 100}%` }} />
                </div>
                {nextLocked && (
                    <p className="mt-2.5 text-[13px] text-pencil">Earn a star on the {nextLocked - 1} times table to open {nextLocked}.</p>
                )}
            </Card>

            <h2 className="mb-3 text-[17px] font-semibold">Times tables</h2>
            <div className="mb-7 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {TABLES.map((t) => {
                    const open = isUnlocked(t, player.stars);
                    const tone = toneFor(t);
                    const got = player.stars[t] || 0;
                    return (
                        <button
                            key={t}
                            disabled={!open}
                            onClick={() => go(`play/table/${t}`)}
                            aria-label={open ? `${t} times table, ${got} stars` : `${t} times table, locked`}
                            className={`relative flex flex-col items-center rounded-[var(--radius-tile)] pb-3 pt-4 ${
                                open ? 'key border border-rule bg-card' : 'border border-dashed border-rule bg-paper/70'
                            }`}
                        >
                            <span
                                className={`grid h-12 w-12 place-items-center rounded-2xl text-[26px] font-semibold ${open ? `${tone.wash} ${tone.ink}` : 'text-faint'}`}
                            >
                                {t}
                            </span>
                            <span className="mt-2.5 flex h-[18px] items-center">
                                {open ? <Stars count={got} size={16} /> : <Lock size={16} {...iconProps} className="text-faint" />}
                            </span>
                        </button>
                    );
                })}
            </div>

            <h2 className="mb-3 text-[17px] font-semibold">More ways to play</h2>
            <div className="grid gap-3 md:grid-cols-2">
                <ModeRow
                    icon={Shuffle}
                    tone="plum"
                    title="Mixed practice"
                    detail={tricky ? `Extra turns on your ${tricky} tricky ${tricky === 1 ? 'fact' : 'facts'}` : 'Questions from all your open tables'}
                    onClick={() => go('play/mixed')}
                />
                <ModeRow
                    icon={Timer}
                    tone="coral"
                    title="Speed challenge"
                    detail={player.speedBest ? `60 seconds. Your best is ${player.speedBest}` : 'How many can you get in 60 seconds?'}
                    onClick={() => go('speed')}
                />
            </div>
        </>
    );
}
