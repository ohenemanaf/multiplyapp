// Short sounds made with Web Audio (no audio files, so they work offline and weigh nothing).
let ctx = null;

function tone(freq, start, duration, type = 'sine', volume = 0.15) {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.05);
}

export const sounds = {
    correct: () => {
        tone(660, 0, 0.12);
        tone(880, 0.09, 0.18);
    },
    // Gentle, not a buzzer: kids should not feel punished for a wrong answer.
    wrong: () => tone(300, 0, 0.25, 'triangle', 0.1),
    finish: (stars) => [523, 659, 784, 1047].slice(0, 1 + stars).forEach((f, i) => tone(f, i * 0.12, 0.25)),
    tap: () => tone(1200, 0, 0.03, 'sine', 0.04),
};

export function play(name, enabled, ...args) {
    if (!enabled) return;
    try {
        sounds[name](...args);
    } catch {
        /* audio not available */
    }
}
