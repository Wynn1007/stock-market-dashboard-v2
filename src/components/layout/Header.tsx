import React, { useState } from "react";
import { Globe, Settings, Moon, Sun, UserCheck } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import AuthForm from "../AuthForm";

interface HeaderProps {
  theme: "midnight" | "milk";
  setTheme: (theme: "midnight" | "milk") => void;
  lang: "zh" | "en";
  setLang: (lang: "zh" | "en") => void;
  currency: "TWD" | "USD";
  setCurrency: (currency: "TWD" | "USD") => void;
  activeTab: string;
  setActiveTab: (tab: "trading" | "ledger" | "settings") => void;
  username: string | null;
  handleLogout: () => void;
}

export default function Header({
  theme,
  setTheme,
  lang,
  setLang,
  currency,
  setCurrency,
  activeTab,
  setActiveTab,
  username,
  handleLogout,
}: HeaderProps) {
  const { t } = useTranslation(lang);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isMidnight = theme === "midnight";
  const navBgClass = isMidnight ? "bg-[#1e293b]/80 border-slate-800" : "bg-white/90 border-slate-200 shadow-sm";
  const btnNavClass = (active: boolean) =>
    active
      ? isMidnight
        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/50"
        : "bg-blue-600/10 text-blue-600 border-blue-600/30"
      : isMidnight
      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100";

  const btnSecondaryClass = isMidnight
    ? "bg-slate-800 text-slate-300 hover:bg-slate-750 border-slate-700"
    : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-sm";

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-md border-b px-4 py-2.5 flex items-center justify-between ${navBgClass}`}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveTab("trading")}>
          <div className={`p-2 rounded-xl transition-transform group-hover:scale-110 ${isMidnight ? "bg-cyan-500/20" : "bg-blue-600/10"}`}>
            <Globe className={`w-5 h-5 ${isMidnight ? "text-cyan-400" : "text-blue-600"}`} />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-tighter uppercase italic">Wynn Finance</span>
            <span className={`text-[8px] font-bold tracking-[0.2em] ${isMidnight ? "text-cyan-500" : "text-blue-600"}`}>QUANT TERMINAL 2.0</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1">
          <button onClick={() => setActiveTab("trading")} className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${btnNavClass(activeTab === "trading")}`}>
            {t.navTrading}
          </button>
          <button onClick={() => setActiveTab("ledger")} className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${btnNavClass(activeTab === "ledger")}`}>
            {t.navLedger}
          </button>
          <button onClick={() => setActiveTab("settings")} className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${btnNavClass(activeTab === "settings")}`}>
            {t.navSettings}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrency(currency === "TWD" ? "USD" : "TWD")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${btnSecondaryClass}`}
        >
          <Globe className="w-3.5 h-3.5" />
          {currency}
        </button>

        <button
          onClick={() => setLang(lang === "zh" ? "en" : "zh")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${btnSecondaryClass}`}
        >
          {t.langToggle}
        </button>

        <button
          onClick={() => setTheme(theme === "midnight" ? "milk" : "midnight")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${btnSecondaryClass}`}
        >
          {theme === "midnight" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {theme === "midnight" ? t.themeToggleMilk : t.themeToggleMidnight}
        </button>

        {username ? (
          <div className="relative group">
            <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${btnSecondaryClass}`}>
              <UserCheck className="w-4 h-4 text-emerald-500" />
              {username}
            </button>
            <div className="absolute top-full right-0 mt-2 p-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={handleLogout} className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded">Logout</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAuthModal(true)} className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${isMidnight ? "bg-cyan-500 text-slate-900" : "bg-blue-600 text-white"}`}>
            Login
          </button>
        )}
      </div>
      {showAuthModal && <AuthForm lang={lang} onClose={() => setShowAuthModal(false)} />}
    </nav>
  );
}
