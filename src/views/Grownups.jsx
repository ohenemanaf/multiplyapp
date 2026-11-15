import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { TABLES, accuracy, trickyFacts, parseFact } from '../lib/game';
import { minutesPractised, removePlayer, resetProgress, totalStars, useStore } from '../lib/players';
import { Stars, TopBar } from '../components/kit';
import { go } from '../lib/route';

const pct = (v) => (v === null ? '–' : `${Math.round(v * 100)}%`);

function PlayerReport({ player }) {
    const [open, setOpen] = useState(false);
    const tricky = trickyFacts(player.stats);
    const last = player.sessions[0];
    return (
        <section className="mb-3 overflow-hidden rounded-3xl bg-white shadow-sm">
            <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={open}>
                <span className="text-[36px] leading-none">{player.avatar}</span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-[18px] font-extrabold">{player.name}</span>
                    <span className="block text-[14px] font-semibold text-muted">
                        ⭐ {totalStars(player)}/36 · {pct(accuracy(player.stats))} right · {minutesPractised(player)} min practised
                    </span>
                </span>
                <ChevronDown size={20} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="border-t border-line px-4 pb-4 pt-3">
                    <p className="mb-2 text-[14px] font-extrabold text-muted">Tables</p>
                    <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {TABLES.map((t) => (
                            <div key={t} className="rounded-2xl bg-sky px-2 py-2 text-center">
                                <p className="text-[16px] font-extrabold">× {t}</p>
                                <Stars count={player.stars[t] || 0} size={13} />
                                <p className="text-[12px] font-bold text-muted">{pct(accuracy(player.stats, t))}</p>
                            </div>
                        ))}
                    </div>
                    <p className="mb-2 text-[14px] font-extrabold text-muted">Needs practice</p>
                    {tricky.length ? (
                        <div className="mb-4 flex flex-wrap gap-2">
                            {tricky.map((f) => {
                                const [a, b] = parseFact(f.key);
                                return (
                                    <span key={f.key} className="rounded-xl bg-oops-soft px-2.5 py-1 text-[15px] font-bold text-oops">
                                        {a} × {b} = {a * b} <span className="text-[12px] font-semibold opacity-80">({f.correct}/{f.seen})</span>
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="mb-4 text-[14px] font-semibold text-muted">Nothing yet. Missed facts show up here.</p>
                    )}
                    <p className="mb-4 text-[14px] font-semibold text-muted">
                        Speed best: {player.speedBest} · Rounds played: {player.sessions.length}
                        {last && ` · Last played ${new Date(last.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                    </p>
                    <div className="flex gap-2">
                        <button
                            className="h-10 rounded-xl bg-sky px-3 text-[14px] font-bold"
                            onClick={() => window.confirm(`Reset all of ${player.name}'s stars and progress?`) && resetProgress(player.id)}
                        >
                            Reset progress
                        </button>
                        <button
                            className="h-10 rounded-xl bg-oops-soft px-3 text-[14px] font-bold text-oops"
                            onClick={() => window.confirm(`Remove ${player.name}? This deletes their progress.`) && removePlayer(player.id)}
                        >
                            Remove player
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

export default function Grownups() {
    const { players } = useStore();
    return (
        <>
            <TopBar title="For grown-ups" onBack={() => go('players')} />
            <p className="mb-4 px-1 text-[15px] font-semibold text-muted">
                Progress for each child on this device. "Needs practice" lists the facts they miss most; Mixed practice gives those extra turns automatically.
            </p>
            {players.length ? players.map((p) => <PlayerReport key={p.id} player={p} />) : (
                <p className="rounded-3xl bg-white p-6 text-center text-[15px] font-semibold text-muted">No players yet.</p>
            )}
            <p className="mt-4 px-1 text-[13px] font-semibold text-muted">Progress is saved on this device only. No accounts, no data leaves the device.</p>
        </>
    );
}
