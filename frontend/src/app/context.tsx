import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { api, supabase, clearApiSession } from '../api/client';
import { clearQueries, invalidate } from '../api/query';
import { translate } from '../domain/i18n';
import type { User, Language } from '../domain/models';
type Context = {
    user: User | null;
    language: Language;
    t: (key: string) => string;
    money: (n: number) => string;
    setLanguage: (l: Language) => void;
    reloadUser: () => Promise<void>;
    loading: boolean;
    error: string;
    recovery: boolean;
    setRecovery: (v: boolean) => void;
    logout: () => Promise<void>;
    live: boolean;
};
const AppContext = createContext<Context>(null!);
export const useApp = () => useContext(AppContext);
export function AppProvider({ children }: {
    children: ReactNode;
}) {
    const epoch = useRef(0), [user, setUser] = useState<User | null>(null), [lang, setLang] = useState<Language>((localStorage.getItem('st-language') as Language) || 'ru'), [loading, setLoading] = useState(true), [error, setError] = useState(''), [recovery, setRecovery] = useState(location.hash.includes('type=recovery')), [live, setLive] = useState(false);
    const language = ['ru', 'sk', 'uk', 'en'].includes(lang) ? lang : 'ru';
    async function reloadUser() { const stamp = epoch.current; setError(''); try {
        const { data: { session } } = await supabase.auth.getSession();
        if (stamp !== epoch.current)
            return;
        if (session) {
            const data = await api<{
                user: User;
            }>('me');
            if (stamp !== epoch.current)
                return;
            setUser(data.user);
            setLang(data.user.language);
        }
        else
            setUser(null);
    }
    catch (e) {
        if (stamp === epoch.current)
            setError(e instanceof Error ? e.message : String(e));
    }
    finally {
        if (stamp === epoch.current)
            setLoading(false);
    } }
    useEffect(() => { void reloadUser(); const { data: { subscription } } = supabase.auth.onAuthStateChange(event => { if (event === 'PASSWORD_RECOVERY')
        setRecovery(true); if (event === 'SIGNED_OUT') {
        epoch.current++;
        setUser(null);
        clearApiSession();
        clearQueries();
    } if (event === 'SIGNED_IN')
        setTimeout(() => void reloadUser(), 0); }); return () => subscription.unsubscribe(); }, []);
    useEffect(() => { if (!user)
        return; let timer: ReturnType<typeof setTimeout>; const refresh = () => { clearTimeout(timer); timer = setTimeout(invalidate, 250); }; const channel = supabase.channel(`v6-jobs-${user.id}`).on('system', {}, p => { if (p.extension === 'postgres_changes') {
        setLive(p.status === 'ok');
        if (p.status === 'ok')
            refresh();
    } }).on('postgres_changes', { event: '*', schema: 'public', table: 'st_job_signals' }, refresh).subscribe(status => { if (status !== 'SUBSCRIBED')
        setLive(false); }); const visible = () => { if (document.visibilityState === 'visible')
        refresh(); }; document.addEventListener('visibilitychange', visible); const poll = setInterval(visible, 60000); return () => { clearTimeout(timer); clearInterval(poll); document.removeEventListener('visibilitychange', visible); void supabase.removeChannel(channel); }; }, [user?.id]);
    useEffect(() => { document.documentElement.lang = language; }, [language]);
    return <AppContext.Provider value={{ user, language, t: key => translate(language, key), money: n => new Intl.NumberFormat(language, { style: 'currency', currency: 'EUR' }).format(n), loading, error, recovery, setRecovery, live, reloadUser, setLanguage: l => { setLang(l); localStorage.setItem('st-language', l); if (user)
            void api('account/language', { method: 'PATCH', body: { language: l } }).catch(e => setError(e.message)); }, logout: async () => { const { error } = await supabase.auth.signOut(); if (error)
            throw error; } }}>{children}</AppContext.Provider>;
}
