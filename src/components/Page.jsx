import { Check } from 'lucide-react';

/**
 * The exercise-book page a question is written on: squared paper with the red margin line.
 * state: null (answering) | 'right' | 'wrong'
 */
export function QuestionPage({ a, b, typed, state, note, children }) {
    return (
        <div
            className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-[24px] border border-rule bg-card py-8"
            style={{
                backgroundImage:
                    'linear-gradient(90deg, transparent 38px, var(--color-coral) 38px, var(--color-coral) 40px, transparent 40px),' +
                    'linear-gradient(var(--color-grid) 1px, transparent 1px), linear-gradient(90deg, var(--color-grid) 1px, transparent 1px)',
                backgroundSize: '100% 100%, 24px 24px, 24px 24px',
                backgroundPosition: '0 0, -1px -1px, -1px -1px',
            }}
            aria-live="polite"
        >
            {note && <p className="absolute left-12 top-4 text-[14px] font-medium text-cobalt">{note}</p>}

            <p className="text-[56px] font-semibold leading-none tracking-tight">
                {a} × {b} =
            </p>

            <div className="relative mt-5 flex h-[76px] min-w-[150px] items-end justify-center border-b-[3px] border-ink/80 px-3 pb-1">
                <span
                    className={`text-[56px] font-semibold leading-none ${
                        state === 'wrong' ? 'strike text-coral/80' : state === 'right' ? 'text-leaf' : typed ? 'text-cobalt' : 'text-faint'
                    }`}
                >
                    {typed || '?'}
                </span>
                {state === 'right' && (
                    <span className="stamp absolute -right-14 -top-3 grid h-14 w-14 place-items-center rounded-full border-[3px] border-leaf bg-leaf-wash text-leaf" aria-hidden>
                        <Check size={32} strokeWidth={3.25} />
                    </span>
                )}
            </div>

            {children}
        </div>
    );
}

/** The teacher's correction, written in coral under a wrong answer. */
export function Correction({ a, b, label = 'Correct answer' }) {
    return (
        <div className="rise mt-6 text-center">
            <p className="text-[14px] font-medium text-pencil">{label}</p>
            <p className="mt-1 text-[38px] font-semibold leading-tight text-coral">
                {a} × {b} = {a * b}
            </p>
        </div>
    );
}
