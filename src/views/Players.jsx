import { useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { AVATARS, addPlayer, selectPlayer, totalStars, useStore } from '../lib/players';
import { ANIMALS, Avatar, BigButton, Card, HoldButton, iconProps } from '../components/kit';
import { go } from '../lib/route';

function NewPlayer({ onDone, onCancel }) {
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState(AVATARS[0]);
    return (
        <Card className="rise p-5">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!name.trim()) return;
                    addPlayer(name, avatar);
                    onDone();
                }}
            >
                <div className="mb-5 flex items-center gap-4">
                    <Avatar id={avatar} size={64} />
                    <div className="min-w-0 flex-1">
                        <label className="mb-1 block text-[14px] font-medium text-pencil" htmlFor="name">Your name</label>
                        <input
                            id="name"
                            autoFocus
                            maxLength={20}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-12 w-full rounded-xl border-2 border-rule bg-paper px-3 text-[20px] font-medium outline-none focus:border-cobalt"
                        />
                    </div>
                </div>
                <p className="mb-2 text-[14px] font-medium text-pencil">Choose your animal</p>
                <div className="mb-6 grid grid-cols-6 gap-2">
                    {AVATARS.map((a) => (
                        <button
                            type="button"
                            key={a}
                            onClick={() => setAvatar(a)}
                            aria-label={ANIMALS[a].label}
                            aria-pressed={a === avatar}
                            className={`grid aspect-square place-items-center rounded-full transition-transform ${a === avatar ? 'scale-110 ring-[3px] ring-cobalt ring-offset-2' : 'opacity-80 hover:opacity-100'}`}
                        >
                            <Avatar id={a} size={44} />
                        </button>
                    ))}
                </div>
                <div className="flex gap-2.5">
                    {onCancel && <BigButton type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</BigButton>}
                    <BigButton type="submit" className="flex-1" disabled={!name.trim()}>Start playing</BigButton>
                </div>
            </form>
        </Card>
    );
}

export default function Players() {
    const { players } = useStore();
    const [adding, setAdding] = useState(players.length === 0);

    return (
        <>
            <header className="mb-6 flex items-start justify-between gap-3 pt-1">
                <div>
                    <p className="flex items-center gap-2 text-[15px] font-semibold text-cobalt">
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-cobalt text-[17px] font-bold leading-none text-white">×</span>
                        Multiply
                    </p>
                    <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight">
                        {players.length && !adding ? "Who's playing?" : 'Hello! What’s your name?'}
                    </h1>
                </div>
                <HoldButton
                    onHold={() => go('grownups')}
                    className="key flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-rule bg-card px-3 text-[13px] font-medium text-pencil"
                >
                    <ShieldCheck size={16} {...iconProps} /> Grown-ups
                </HoldButton>
            </header>

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
                            className="key flex flex-col items-center rounded-[24px] border border-rule bg-card px-3 pb-4 pt-5"
                        >
                            <Avatar id={p.avatar} size={72} />
                            <span className="mt-3 max-w-full truncate text-[18px] font-semibold">{p.name}</span>
                            <span className="mt-0.5 text-[14px] text-pencil">{totalStars(p)} stars</span>
                        </button>
                    ))}
                    <button
                        onClick={() => setAdding(true)}
                        className="flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-rule bg-card/60 px-3 py-5 text-pencil hover:border-cobalt hover:text-cobalt"
                    >
                        <Plus size={32} {...iconProps} />
                        <span className="mt-2 text-[16px] font-medium">New player</span>
                    </button>
                </div>
            )}
            {!adding && <p className="mt-6 text-center text-[13px] text-faint">Grown-ups: press and hold the button at the top to see progress.</p>}
        </>
    );
}
