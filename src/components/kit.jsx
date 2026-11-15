import { useEffect, useRef } from 'react';
import {
    ArrowLeft, Bird, Bug, Cat, Check, Delete, Dog, Fish, Origami, Panda, Rabbit, Shrimp, Snail, Squirrel, Star, Turtle,
} from 'lucide-react';

const cx = (...c) => c.filter(Boolean).join(' ');
const STROKE = 2.25; // one stroke weight for every icon, so they read as one sharp set

// ---------- colour families ----------
// Six "coloured pencils". Each pairs a strong ink with a wash; text on washes uses the ink.
export const TONES = {
    cobalt: { ink: 'text-cobalt', wash: 'bg-cobalt-wash', solid: 'bg-cobalt', edge: 'var(--color-cobalt-deep)' },
    leaf: { ink: 'text-leaf', wash: 'bg-leaf-wash', solid: 'bg-leaf', edge: 'var(--color-leaf-deep)' },
    coral: { ink: 'text-coral', wash: 'bg-coral-wash', solid: 'bg-coral', edge: '#c2412a' },
    sun: { ink: 'text-[#9a6d00]', wash: 'bg-sun-wash', solid: 'bg-sun', edge: '#c99200' },
    plum: { ink: 'text-plum', wash: 'bg-plum-wash', solid: 'bg-plum', edge: '#5f3699' },
    teal: { ink: 'text-teal', wash: 'bg-teal-wash', solid: 'bg-teal', edge: '#0b6f7c' },
};
const TONE_ORDER = ['cobalt', 'leaf', 'coral', 'plum', 'teal', 'sun'];
export const toneFor = (n) => TONES[TONE_ORDER[(n - 1) % TONE_ORDER.length]];

// ---------- avatars ----------

export const ANIMALS = {
    cat: { icon: Cat, tone: 'coral', label: 'Cat' },
    dog: { icon: Dog, tone: 'sun', label: 'Dog' },
    bird: { icon: Bird, tone: 'cobalt', label: 'Bird' },
    fish: { icon: Fish, tone: 'teal', label: 'Fish' },
    rabbit: { icon: Rabbit, tone: 'plum', label: 'Rabbit' },
    squirrel: { icon: Squirrel, tone: 'coral', label: 'Squirrel' },
    turtle: { icon: Turtle, tone: 'leaf', label: 'Turtle' },
    snail: { icon: Snail, tone: 'sun', label: 'Snail' },
    bug: { icon: Bug, tone: 'leaf', label: 'Ladybird' },
    panda: { icon: Panda, tone: 'cobalt', label: 'Panda' },
    shrimp: { icon: Shrimp, tone: 'teal', label: 'Shrimp' },
    crane: { icon: Origami, tone: 'plum', label: 'Paper crane' },
};
export const ANIMAL_IDS = Object.keys(ANIMALS);

export function Avatar({ id, size = 48, className }) {
    const animal = ANIMALS[id] || ANIMALS.cat; // profiles from the emoji version fall back to the cat
    const tone = TONES[animal.tone];
    const Icon = animal.icon;
    return (
        <span
            className={cx('grid shrink-0 place-items-center rounded-full', tone.wash, tone.ink, className)}
            style={{ width: size, height: size }}
            aria-hidden
        >
            <Icon size={Math.round(size * 0.52)} strokeWidth={STROKE} />
        </span>
    );
}

/** A round icon badge used for results and headings. */
export function Medal({ icon: Icon, tone = 'cobalt', size = 88, className }) {
    const t = TONES[tone];
    return (
        <span className={cx('grid place-items-center rounded-full ring-8 ring-white', t.solid, className)} style={{ width: size, height: size }} aria-hidden>
            <Icon size={Math.round(size * 0.46)} strokeWidth={STROKE} className="text-white" />
        </span>
    );
}

export function Stars({ count, size = 18, max = 3, className }) {
    return (
        <span className={cx('inline-flex gap-0.5', className)} role="img" aria-label={`${count} of ${max} stars`}>
            {Array.from({ length: max }, (_, i) => (
                <Star key={i} size={size} strokeWidth={STROKE} className={i < count ? 'fill-sun text-sun' : 'fill-rule text-rule'} />
            ))}
        </span>
    );
}

// ---------- layout ----------

export function IconButton({ label, children, className, ...props }) {
    return (
        <button aria-label={label} title={label} className={cx('key grid h-11 w-11 place-items-center rounded-2xl bg-card text-ink', className)} {...props}>
            {children}
        </button>
    );
}

export function TopBar({ onBack, title, right }) {
    return (
        <header className="mb-5 flex h-12 items-center gap-3">
            {onBack && (
                <IconButton label="Back" onClick={onBack}>
                    <ArrowLeft size={22} strokeWidth={STROKE} />
                </IconButton>
            )}
            <h1 className="min-w-0 flex-1 truncate text-[19px] font-semibold tracking-tight">{title}</h1>
            {right}
        </header>
    );
}

export function Card({ className, children, ...props }) {
    return (
        <div className={cx('rounded-[24px] border border-rule bg-card', className)} {...props}>
            {children}
        </div>
    );
}

export function BigButton({ tone = 'cobalt', variant = 'solid', className, children, ...props }) {
    const t = TONES[tone];
    const solid = variant === 'solid';
    return (
        <button
            className={cx(
                'key flex h-14 items-center justify-center gap-2 rounded-2xl px-5 text-[17px] font-semibold disabled:opacity-40',
                solid ? cx(t.solid, 'text-white') : 'border border-rule bg-card text-ink',
                className
            )}
            style={{ '--edge': solid ? t.edge : 'var(--color-rule)' }}
            {...props}
        >
            {children}
        </button>
    );
}

export const iconProps = { strokeWidth: STROKE };

// ---------- number pad ----------

/**
 * On-screen number pad that also listens to the keyboard. The keyboard listener is attached
 * once and reads the latest handlers through a ref.
 */
export function NumPad({ onDigit, onDelete, onSubmit, disabled, canSubmit }) {
    const handlers = useRef({ onDigit, onDelete, onSubmit, disabled, canSubmit });
    handlers.current = { onDigit, onDelete, onSubmit, disabled, canSubmit };

    useEffect(() => {
        const onKey = (e) => {
            const h = handlers.current;
            if (h.disabled) return;
            if (/^\d$/.test(e.key)) h.onDigit(e.key);
            else if (e.key === 'Backspace') h.onDelete();
            else if (e.key === 'Enter' && h.canSubmit) {
                e.preventDefault();
                h.onSubmit();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // One shape for every key; colour classes are added per key (never two bg-* on one element).
    const shape = 'key grid h-[60px] place-items-center rounded-2xl text-[26px] font-medium disabled:opacity-40';
    const plain = cx(shape, 'border border-rule bg-card text-ink');
    return (
        <div className="grid grid-cols-3 gap-2.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button key={d} className={plain} disabled={disabled} onClick={() => onDigit(d)}>{d}</button>
            ))}
            <button className={cx(shape, 'border border-rule bg-paper text-pencil')} disabled={disabled} onClick={onDelete} aria-label="Delete">
                <Delete size={24} strokeWidth={STROKE} />
            </button>
            <button className={plain} disabled={disabled} onClick={() => onDigit('0')}>0</button>
            <button
                className={cx(shape, 'bg-leaf text-white')}
                style={{ '--edge': 'var(--color-leaf-deep)' }}
                disabled={disabled || !canSubmit}
                onClick={onSubmit}
                aria-label="Check answer"
            >
                <Check size={30} strokeWidth={3} />
            </button>
        </div>
    );
}

/** Opens only after pressing and holding, so children don't wander into the grown-up area. */
export function HoldButton({ onHold, children, className, ms = 1500 }) {
    const timer = useRef(null);
    const start = () => {
        timer.current = setTimeout(onHold, ms);
    };
    const stop = () => clearTimeout(timer.current);
    return (
        <button
            className={className}
            onPointerDown={start}
            onPointerUp={stop}
            onPointerLeave={stop}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={(e) => e.key === 'Enter' && onHold()}
        >
            {children}
        </button>
    );
}
