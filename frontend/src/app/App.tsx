import { Component, useState, useEffect, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider, useApp } from './context';
import { navigationFor } from '../domain/rules.mjs';
import { Auth, LanguagePicker } from '../features/Auth';
import { CleanerDay } from '../features/CleanerDay';
import { Jobs } from '../features/Jobs';
import { Properties } from '../features/Properties';
import { People } from '../features/People';
import { Finance } from '../features/Finance';
import { Recurring } from '../features/Recurring';
import { Issues } from '../features/Issues';
import { Account, Settings, Notifications } from '../features/Account';
import { Icon, Action } from '../ui/components';
import '../ui/styles.css';
class Boundary extends Component<{
    children: ReactNode;
    message: string;
}, {
    failed: boolean;
}> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() { return this.state.failed ? <p className="error">{this.props.message}</p> : this.props.children; }
}
const labels: Record<string, string> = { jobs: 'Jobs', properties: 'Properties', people: 'Team & clients', finance: 'Finance', recurring: 'Recurring cleaning', issues: 'Issues', settings: 'Settings', notifications: 'Notifications', marketplace: 'Available jobs', account: 'Profile' };
function Workspace() { const { user, t, loading, error, live, recovery, logout } = useApp(), [route, setRoute] = useState(location.hash.slice(1) || 'jobs'), [online, setOnline] = useState(navigator.onLine); useEffect(() => { const change = () => setRoute(location.hash.slice(1) || 'jobs'), connection = () => setOnline(navigator.onLine); window.addEventListener('hashchange', change); window.addEventListener('online', connection); window.addEventListener('offline', connection); return () => { window.removeEventListener('hashchange', change); window.removeEventListener('online', connection); window.removeEventListener('offline', connection); }; }, []); if (loading)
    return <main className="boot"><span className="brand-mark">s</span><p>{t('Loading…')}</p></main>; if (!user || recovery)
    return <><Auth />{error && <p className="auth-error error" role="alert">{error}</p>}</>; const nav = navigationFor(user.role), page = nav.includes(route) ? route : 'jobs', screens: Record<string, ReactNode> = { jobs: user.role === 'CLEANER' ? <CleanerDay /> : <Jobs />, marketplace: <Jobs marketplace/>, properties: <Properties />, people: <People />, finance: <Finance />, recurring: <Recurring />, issues: <Issues />, account: <Account />, settings: <Settings />, notifications: <Notifications /> }; return <div className="workspace"><aside className="sidebar"><a className="brand" href="#jobs"><span className="brand-mark">s</span>shine time<sup>®</sup></a><span className="nav-label">{t('Workspace')}</span><nav aria-label={t('Workspace')}>{nav.map((key: string) => <a key={key} href={`#${key}`} className={page === key ? 'selected' : ''} aria-current={page === key ? 'page' : undefined}><Icon name={key}/><span>{t(labels[key])}</span></a>)}</nav><div className="sidebar-bottom"><div className="workspace-location"><span className={`connection-dot ${live ? 'live' : ''}`}/>{t(live ? 'Live updates' : 'Connecting…')}</div><div className="user-card"><div className="avatar">{user.full_name.slice(0, 1)}</div><div><strong>{user.full_name}</strong><small>{t(user.role)}</small></div></div><Action label="Sign out" onClick={logout}/></div></aside><div className="main-column"><header className="topbar"><span>SHINE TIME <span className="muted">/ {t(labels[page])}</span></span><LanguagePicker /></header>{!online && <div className="offline" role="status">{t('Offline. Changes have not been sent.')}</div>}{error && <p className="error" role="alert">{error}</p>}<main className="page"><Boundary key={page} message={t('Could not open this screen. Refresh the page.')}>{screens[page]}</Boundary></main></div></div>; }
createRoot(document.getElementById('app')!).render(<AppProvider><Workspace /></AppProvider>);
