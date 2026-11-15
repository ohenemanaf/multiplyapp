import { useEffect, useRef } from 'react';
import { ArrowLeft, Check, Delete, Star } from 'lucide-react';

const cx = (...c) => c.filter(Boolean).join(' ');

export function Stars({ count, size = 18, max = 3, className }) {
    return (
        <span className={cx('inline-flex gap-0.5', className)} aria-label={`${count} of ${max} stars`}>
            {Array.from({ length: max }, (_, i) => (
                <Star key={i} size={size} className={i < count ? 'fill-star text-star' : 'fill-line text-line'} />
            ))}
        </span>
    );
}

export function TopBar({ onBack, title, right }) {
    return (
        <header className="mb-4 flex h-12 items-center gap-2">
            {onBack && (
                <button onClick={onBack} aria-label="Back" className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-ink shadow-sm active:scale-95">
                    <ArrowLeft size={22} />
                </button>
            )}
            <h1 className="min-w-0 flex-1 truncate text-[20px] font-extrabold">{title}</h1>
            {right}
        </header>
    );
}

export function BigButton({ tone = 'brand', className, children, ...props }) {
    const tones = {
        brand: 'bg-brand text-white shadow-[0_4px_0_#2b44a8]',
        white: 'bg-white text-ink shadow-[0_4px_0_#c9d6ea]',
        good: 'bg-good text-white shadow-[0_4px_0_#167a41]',
    };
    return (
        <button
            className={cx('flex h-14 items-center justify-center gap-2 rounded-2xl px-5 text-[18px] font-extrabold transition-transform active:translate-y-1 active:shadow-none disabled:opacity-40', tones[tone], className)}
            {...props}
        >
            {children}
        </button>
    );
}

/**
 * On-screen number pad (phones and tablets) that also listens to the keyboard (computers).
 * The keyboard listener is attached once; it reads the latest handlers through a ref.
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

    // Base shape only; each key adds its own colours (mixing two bg-* classes makes one silently win).
    const shape = 'grid h-16 place-items-center rounded-2xl text-[28px] font-extrabold transition-transform active:translate-y-1 active:shadow-none disabled:opacity-40';
    const key = cx(shape, 'bg-white shadow-[0_4px_0_#c9d6ea]');
    return (
        <div className="grid grid-cols-3 gap-2.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button key={d} className={key} disabled={disabled} onClick={() => onDigit(d)}>{d}</button>
            ))}
            <button className={key} disabled={disabled} onClick={onDelete} aria-label="Delete"><Delete size={26} /></button>
            <button className={key} disabled={disabled} onClick={() => onDigit('0')}>0</button>
            <button
                className={cx(shape, 'bg-good text-white shadow-[0_4px_0_#167a41]')}
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
