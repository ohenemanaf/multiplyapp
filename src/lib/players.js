// Players and their progress, saved on this device. Reads/writes are wrapped because
// storage can be unavailable (private mode); the game still works, it just won't remember.
import { useSyncExternalStore } from 'react';

const KEY = 'multiply:v2';
// Animal ids; the icons and colours live in components/kit.jsx (ANIMALS).
export const AVATARS = ['cat', 'dog', 'bird', 'fish', 'rabbit', 'squirrel', 'turtle', 'snail', 'bug', 'panda', 'shrimp', 'crane'];
const MAX_SESSIONS = 100;

const empty = { players: [], currentId: null, sound: true };
let state = load();
const listeners = new Set();

function load() {
    try {
        return { ...empty, ...JSON.parse(localStorage.getItem(KEY)) };
    } catch {
        return empty;
    }
}

function save(next) {
    state = next;
    try {
        localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
        /* keep playing without saving */
    }
    listeners.forEach((fn) => fn());
}

export function useStore() {
    return useSyncExternalStore(
        (fn) => {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
        () => state
    );
}

export const currentPlayer = (s = state) => s.players.find((p) => p.id === s.currentId) || null;

export function addPlayer(name, avatar) {
    const player = {
        id: `p${Date.now().toString(36)}`,
        name: name.trim(),
        avatar,
        createdAt: new Date().toISOString(),
        stars: {},
        stats: {},
        speedBest: 0,
        sessions: [],
    };
    save({ ...state, players: [...state.players, player], currentId: player.id });
    return player;
}

export const selectPlayer = (id) => save({ ...state, currentId: id });
export const signOut = () => save({ ...state, currentId: null });
export const setSound = (on) => save({ ...state, sound: on });

export function updatePlayer(id, fn) {
    save({ ...state, players: state.players.map((p) => (p.id === id ? fn(p) : p)) });
}

export function removePlayer(id) {
    save({ ...state, players: state.players.filter((p) => p.id !== id), currentId: state.currentId === id ? null : state.currentId });
}

export function resetProgress(id) {
    updatePlayer(id, (p) => ({ ...p, stars: {}, stats: {}, speedBest: 0, sessions: [] }));
}

/** Saves a finished round: best stars per table are kept, never lowered. */
export function finishSession(id, session) {
    updatePlayer(id, (p) => {
        const stars = { ...p.stars };
        if (session.mode === 'table') stars[session.table] = Math.max(stars[session.table] || 0, session.stars);
        const speedBest = session.mode === 'speed' ? Math.max(p.speedBest, session.correct) : p.speedBest;
        return { ...p, stars, speedBest, sessions: [{ ...session, at: new Date().toISOString() }, ...p.sessions].slice(0, MAX_SESSIONS) };
    });
}

export function recordStats(id, stats) {
    updatePlayer(id, (p) => ({ ...p, stats }));
}

export const totalStars = (p) => Object.values(p.stars).reduce((a, b) => a + b, 0);
export const minutesPractised = (p) => Math.round(p.sessions.reduce((s, x) => s + (x.seconds || 0), 0) / 60);
