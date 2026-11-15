import { useState } from 'react';
import { ChevronDown, Clock, Star, Target, Timer } from 'lucide-react';
import { TABLES, accuracy, parseFact, trickyFacts } from '../lib/game';
import { minutesPractised, removePlayer, resetProgress, totalStars, useStore } from '../lib/players';
import { Avatar, Card, Stars, TopBar, iconProps } from '../components/kit';
import { go } from '../lib/route';

const pct = (v) => (v === null ? '–' : `${Math.round(v * 100)}%`);

function Figure({ icon: Icon, label, value }) {
    return (
        <div className="rounded-2xl bg-paper px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-pencil">
                <Icon size={14} {...iconProps} /> {label}
            </p>
            <p className="mt-0.5 text-[20px] font-semibold">{value}</p>
        </div>
    );
}

function PlayerReport({ player }) {
    const [open, setOpen] = useState(false);
    const tricky = trickyFacts(player.stats);
    const last = player.sessions[0];
    return (
        <Card className="mb-3 overflow-hidden">
            <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={open}>
                <Avatar id={player.avatar} size={48} />
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-[18px] font-semibold">{player.name}</span>
                    <span className="block text-[14px] text-pencil">
                        {last ? `Last played ${new Date(last.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}` : 'Not played yet'}
                    </span>
                </span>
                <ChevronDown size={20} {...iconProps} className={`text-faint transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="border-t border-rule px-4 pb-4 pt-4">
                    <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <Figure icon={Star} label="Stars" value={`${totalStars(player)} / 36`} />
                        <Figure icon={Target} label="Accuracy" value={pct(accuracy(player.stats))} />
                        <Figure icon={Clock} label="Practised" value={`${minutesPractised(player)} min`} />
                        <Figure icon={Timer} label="Speed best" value={player.speedBest} />
                    </div>

                    <h3 className="mb-2 text-[15px] font-semibold">Each table</h3>
                    <div className="mb-5 grid grid-cols-4 gap-2 sm:grid-cols-6">
                        {TABLES.map((t) => (
                            <div key={t} className="rounded-2xl border border-rule px-1 py-2 text-center">
                                <p className="text-[17px] font-semibold">{t}</p>
                                <Stars count={player.stars[t] || 0} size={11} />
                                <p className="text-[12px] text-pencil">{pct(accuracy(player.stats, t))}</p>
                            </div>
                        ))}
                    </div>

                    <h3 className="mb-2 text-[15px] font-semibold">Facts to practise together</h3>
                    {tricky.length ? (
                        <ul className="mb-5 grid gap-1.5 sm:grid-cols-2">
                            {tricky.map((f) => {
                                const [a, b] = parseFact(f.key);
                                return (
                                    <li key={f.key} className="flex items-baseline justify-between rounded-xl bg-coral-wash px-3 py-2">
                                        <span className="text-[17px] font-semibold text-coral">{a} × {b} = {a * b}</span>
                                        <span className="text-[13px] text-pencil">right {f.correct} of {f.seen}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="mb-5 text-[14px] text-pencil">Nothing yet. Facts your child misses will appear here.</p>
                    )}

                    <div className="flex gap-2">
                        <button
                            className="h-10 rounded-xl border border-rule px-3 text-[14px] font-medium"
                            onClick={() => window.confirm(`Reset all of ${player.name}'s stars and progress?`) && resetProgress(player.id)}
                        >
                            Reset progress
                        </button>
                        <button
                            className="h-10 rounded-xl bg-coral-wash px-3 text-[14px] font-medium text-coral"
                            onClick={() => window.confirm(`Remove ${player.name}? This deletes their progress.`) && removePlayer(player.id)}
                        >
                            Remove player
                        </button>
                    </div>
                </div>
            )}
        </Card>
    );
}

export default function Grownups() {
    const { players } = useStore();
    return (
        <>
            <TopBar title="For grown-ups" onBack={() => go('players')} />
            <p className="mb-5 max-w-prose text-[15px] leading-relaxed text-pencil">
                Each child’s progress on this device. Mixed practice already gives extra turns on the facts listed under each child.
            </p>
            {players.length ? players.map((p) => <PlayerReport key={p.id} player={p} />) : (
                <Card className="p-6 text-center text-[15px] text-pencil">No players yet.</Card>
            )}
            <p className="mt-5 text-[13px] text-faint">Progress stays on this device. There are no accounts and nothing is sent anywhere.</p>
        </>
    );
}
