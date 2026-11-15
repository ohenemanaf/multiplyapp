import { useState } from 'react';
import { Plus, Settings } from 'lucide-react';
import { AVATARS, addPlayer, selectPlayer, totalStars, useStore } from '../lib/players';
import { BigButton, HoldButton, TopBar } from '../components/kit';
import { go } from '../lib/route';

function NewPlayer({ onDone, onCancel }) {
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState(AVATARS[0]);
    return (
        <form
            className="rounded-3xl bg-white p-5 shadow-sm"
            onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;
                addPlayer(name, avatar);
                onDone();
            }}
        >
            <label className="mb-1 block text-[15px] font-bold text-muted" htmlFor="name">Your name</label>
            <input
                id="name"
                autoFocus
                maxLength={20}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mb-4 h-14 w-full rounded-2xl border-2 border-line px-4 text-[22px] font-bold outline-none focus:border-brand"
            />
            <p className="mb-2 text-[15px] font-bold text-muted">Pick your animal</p>
            <div className="mb-5 grid grid-cols-6 gap-2">
                {AVATARS.map((a) => (
                    <button
                        type="button"
                        key={a}
                        onClick={() => setAvatar(a)}
                        aria-label={`Animal ${a}`}
                        aria-pressed={a === avatar}
                        className={`grid aspect-square place-items-center rounded-2xl text-[28px] ${a === avatar ? 'bg-brand-soft ring-3 ring-brand' : 'bg-sky'}`}
                    >
                        {a}
                    </button>
                ))}
            </div>
            <div className="flex gap-2">
                {onCancel && <BigButton type="button" tone="white" className="flex-1" onClick={onCancel}>Cancel</BigButton>}
                <BigButton type="submit" className="flex-1" disabled={!name.trim()}>Let's go!</BigButton>
            </div>
        </form>
    );
}

export default function Players() {
    const { players } = useStore();
    const [adding, setAdding] = useState(players.length === 0);

    return (
        <>
            <TopBar
                title={players.length ? "Who's playing?" : 'Hello! 👋'}
                right={
                    <HoldButton onHold={() => go('grownups')} className="flex h-11 items-center gap-1.5 rounded-2xl bg-white px-3 text-[13px] font-bold text-muted shadow-sm">
                        <Settings size={16} /> Grown-ups (hold)
                    </HoldButton>
                }
            />
            {adding ? (
                <NewPlayer onDone={() => go('home')} onCancel={players.length ? () => setAdding(false) : null} />
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {players.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => {
                                selectPlayer(p.id);
                                go('home');
                            }}
                            className="flex flex-col items-center rounded-3xl bg-white p-4 shadow-[0_4px_0_#c9d6ea] transition-transform active:translate-y-1 active:shadow-none"
                        >
                            <span className="text-[52px] leading-none">{p.avatar}</span>
                            <span className="mt-2 max-w-full truncate text-[18px] font-extrabold">{p.name}</span>
                            <span className="text-[14px] font-bold text-muted">⭐ {totalStars(p)}</span>
                        </button>
                    ))}
                    <button onClick={() => setAdding(true)} className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-line p-4 text-muted">
                        <Plus size={36} />
                        <span className="mt-1 text-[16px] font-bold">New player</span>
                    </button>
                </div>
            )}
        </>
    );
}
