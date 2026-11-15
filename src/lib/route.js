import { useEffect, useState } from 'react';

// Hash routes keep the phone's Back button working: #/home, #/play/table/7, #/speed …
const read = () => (window.location.hash.replace(/^#\/?/, '') || 'players').split('/');

export function useRoute() {
    const [route, setRoute] = useState(read);
    useEffect(() => {
        const on = () => {
            setRoute(read());
            window.scrollTo(0, 0); // inside a block: scrollTo returns a Promise in newer Chrome
        };
        window.addEventListener('hashchange', on);
        return () => window.removeEventListener('hashchange', on);
    }, []);
    return route;
}

export const go = (path) => {
    window.location.hash = `/${path}`;
};

/** Replace the current screen (no extra Back step), e.g. results -> play again. */
export const replace = (path) => {
    window.location.replace(`#/${path}`);
};
