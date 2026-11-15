import Players from './views/Players';
import Home from './views/Home';
import Play from './views/Play';
import Speed from './views/Speed';
import Grownups from './views/Grownups';
import { useRoute } from './lib/route';

export default function App() {
    const [screen, ...rest] = useRoute();
    return (
        <main className="mx-auto w-full max-w-lg px-4 pb-6 md:max-w-3xl md:px-8 pt-[max(env(safe-area-inset-top),16px)]">
            {screen === 'home' && <Home />}
            {screen === 'play' && <Play key={rest.join('/')} mode={rest[0] === 'mixed' ? 'mixed' : 'table'} table={rest[1]} />}
            {screen === 'speed' && <Speed />}
            {screen === 'grownups' && <Grownups />}
            {!['home', 'play', 'speed', 'grownups'].includes(screen) && <Players />}
        </main>
    );
}
