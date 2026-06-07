// src/components/AuthForm.tsx
import React, { useState } from "react";
import { Shield, X } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { useAuth } from "../hooks/useAuth";

interface AuthFormProps {
  lang: "zh" | "en";
  onClose: () => void;
}

export default function AuthForm({ lang, onClose }: AuthFormProps) {
  const { t } = useTranslation(lang);
  const { 
    authError, 
    authSuccess, 
    handleLoginSubmit, 
    handleRegisterSubmit,
  } = useAuth(lang);

  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [regUser, setRegUser] = useState("");
  const [regPass, setRegPass] = useState("");
  
  const isMidnight = true; // Assuming modal is always on a dark overlay
  const inputClass = isMidnight 
    ? "bg-slate-950 border-slate-850 text-slate-100 placeholder-slate-700 focus:border-cyan-500" 
    : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20";


  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleLoginSubmit(e, loginUser, loginPass);
    if (success) {
      setLoginUser("");
      setLoginPass("");
      setTimeout(() => onClose(), 1500); // Close modal on success
    }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleRegisterSubmit(e, regUser, regPass);
    if (success) {
      setRegUser("");
      setRegPass("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className={`p-5 rounded-2xl border bg-[#131a26] border-slate-800 shadow-lg max-w-sm w-full space-y-4 transform transition-all duration-300 scale-100`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500 dark:text-cyan-400" />
            {t.authCard}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800">
            <X className="w-4 h-4 text-slate-500"/>
          </button>
        </div>

        {authError && <div className="p-3 bg-rose-500/10 text-rose-500 text-xs font-semibold rounded-lg border border-rose-500/20">{authError}</div>}
        {authSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-500 text-xs font-semibold rounded-lg border border-emerald-500/20">{authSuccess}</div>}
        
        <form onSubmit={onLogin} className="space-y-3">
          <p className="text-xs text-slate-400">{t.authSubtitle}</p>
          <div>
            <label className="text-[10px] font-bold text-slate-400">{t.usernameLabel}</label>
            <input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)} className={`w-full text-sm px-3 py-2 rounded-lg mt-1 ${inputClass}`} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400">{t.passwordLabel}</label>
            <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} className={`w-full text-sm px-3 py-2 rounded-lg mt-1 ${inputClass}`} />
          </div>
          <button type="submit" className={`w-full py-2 rounded-lg font-bold text-sm bg-cyan-500 text-slate-900`}>{t.loginBtn}</button>
        </form>

        <hr className="border-slate-800" />

        <form onSubmit={onRegister} className="space-y-3">
           <div>
            <label className="text-[10px] font-bold text-slate-400">{t.usernameLabel}</label>
            <input type="text" value={regUser} onChange={e => setRegUser(e.target.value)} className={`w-full text-sm px-3 py-2 rounded-lg mt-1 ${inputClass}`} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400">{t.passwordLabel}</label>
            <input type="password" value={regPass} onChange={e => setRegPass(e.target.value)} className={`w-full text-sm px-3 py-2 rounded-lg mt-1 ${inputClass}`} />
          </div>
          <button type="submit" className={`w-full py-2 rounded-lg font-bold text-sm bg-slate-800 text-white`}>{t.registerBtn}</button>
        </form>
      </div>
    </div>
  );
}
