import { useEffect } from 'react';
import { Lock, Shuffle, Timer, Volume2, VolumeX } from 'lucide-react';
import { TABLES, isUnlocked, trickyFacts } from '../lib/game';
import { currentPlayer, setSound, signOut, totalStars, useStore } from '../lib/players';
import { Stars, TopBar } from '../components/kit';
import { go } from '../lib/route';

export default function Home() {
    const store = useStore();
    const player = currentPlayer(store);
    useEffect(() => {
        if (!player) go('players');
    }, [player]);
    if (!player) return null;
    const tricky = trickyFacts(player.stats).length;

    return (
        <>
            <TopBar
                title={
                    <span className="flex items-center gap-2">
                        <span className="text-[30px] leading-none">{player.avatar}</span> Hi, {player.name}!
                    </span>
                }
                right={
                    <div className="flex gap-2">
                        <button
                            aria-label={store.sound ? 'Sound off' : 'Sound on'}
                            onClick={() => setSound(!store.sound)}
                            className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-muted shadow-sm"
                        >
                            {store.sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </button>
                        <button
                            onClick={() => {
                                signOut();
                                go('players');
                            }}
                            className="h-11 rounded-2xl bg-white px-3 text-[14px] font-bold text-muted shadow-sm"
                        >
                            Switch
                        </button>
                    </div>
                }
            />

            <div className="mb-4 flex items-center justify-between rounded-3xl bg-white px-5 py-3 shadow-sm">
                <span className="text-[16px] font-bold text-muted">Your stars</span>
                <span className="text-[22px] font-extrabold">⭐ {totalStars(player)} <span className="text-[15px] text-muted">/ 36</span></span>
            </div>

            <h2 className="mb-2 px-1 text-[16px] font-extrabold text-muted">Times tables</h2>
            <div className="mb-5 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {TABLES.map((t) => {
                    const open = isUnlocked(t, player.stars);
                    return (
                        <button
                            key={t}
                            disabled={!open}
                            onClick={() => go(`play/table/${t}`)}
                            aria-label={open ? `${t} times table, ${player.stars[t] || 0} stars` : `${t} times table, locked`}
                            className={`flex flex-col items-center rounded-3xl py-3 transition-transform ${
                                open ? 'bg-white shadow-[0_4px_0_#c9d6ea] active:translate-y-1 active:shadow-none' : 'bg-line/40 text-muted'
                            }`}
                        >
                            <span className="text-[13px] font-bold text-muted">×</span>
                            <span className="text-[32px] font-extrabold leading-none">{t}</span>
                            <span className="mt-1.5 h-[18px]">{open ? <Stars count={player.stars[t] || 0} size={16} /> : <Lock size={16} />}</span>
                        </button>
                    );
                })}
            </div>
            <p className="-mt-3 mb-5 px-1 text-[13px] font-semibold text-muted">Get 1 star to open the next table.</p>

            <div className="grid gap-2.5 sm:grid-cols-2">
                <button onClick={() => go('play/mixed')} className="flex items-center gap-3 rounded-3xl bg-white p-4 text-left shadow-[0_4px_0_#c9d6ea] active:translate-y-1 active:shadow-none">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Shuffle size={24} /></span>
                    <span>
                        <span className="block text-[18px] font-extrabold">Mixed practice</span>
                        <span className="block text-[14px] font-semibold text-muted">{tricky ? `Extra turns on ${tricky} tricky fact${tricky === 1 ? '' : 's'}` : 'All your open tables'}</span>
                    </span>
                </button>
                <button onClick={() => go('speed')} className="flex items-center gap-3 rounded-3xl bg-white p-4 text-left shadow-[0_4px_0_#c9d6ea] active:translate-y-1 active:shadow-none">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-oops-soft text-oops"><Timer size={24} /></span>
                    <span>
                        <span className="block text-[18px] font-extrabold">Speed challenge</span>
                        <span className="block text-[14px] font-semibold text-muted">60 seconds · best {player.speedBest}</span>
                    </span>
                </button>
            </div>
        </>
    );
}
