import React from 'react';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Sparkles, Sun, Moon, User } from 'lucide-react';

const Header = () => {
    const { 
        username, 
        setToken,
        theme, 
        setTheme,
        lang,
        setLang,
        activeTab,
        setActiveTab
    } = useStore(state => ({
        username: state.username,
        setToken: state.setToken,
        theme: state.theme,
        setTheme: state.setTheme,
        lang: state.lang,
        setLang: state.setLang,
        activeTab: state.activeTab,
        setActiveTab: state.setActiveTab
    }));
    const { t } = useTranslation();

    const handleLogout = () => {
        setToken(null, null);
    };

    const navItems = [
        { id: 'trading', label: t.header.trading },
        { id: 'ledger', label: t.header.ledger },
        { id: 'settings', label: t.header.settings },
    ];

    return (
        <header className={`flex items-center justify-between p-4 border-b transition-colors ${theme === 'midnight' ? 'bg-[#131a26] border-slate-800' : 'bg-white border-slate-200/60'}`}>
            <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-cyan-400" />
                <h1 className="text-lg font-bold">MarketDash</h1>
            </div>

            <nav className="hidden md:flex items-center gap-2">
                {navItems.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id as "trading" | "ledger" | "settings")}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${activeTab === item.id ? (theme === 'midnight' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-white') : (theme === 'midnight' ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}`}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="flex items-center gap-4">
                <button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} className="text-sm font-semibold">
                    {lang.toUpperCase()}
                </button>
                <button onClick={() => setTheme(theme === 'midnight' ? 'milk' : 'midnight')}>
                    {theme === 'midnight' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                {username ? (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold hidden sm:inline">{username}</span>
                        <button onClick={handleLogout} className="text-xs text-slate-400 hover:underline">{t.header.logout}</button>
                    </div>
                ) : (
                    <button onClick={() => setActiveTab('settings')} className="flex items-center gap-2 text-sm font-semibold">
                       <User className="w-4 h-4"/> <span className="hidden sm:inline">{t.auth.login}</span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
