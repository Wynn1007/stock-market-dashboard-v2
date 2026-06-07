import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';

export default function AuthForm() {
    const { setToken, setActiveTab } = useStore(state => ({
        setToken: state.setToken,
        setActiveTab: state.setActiveTab
    }));
    const { t } = useTranslation();
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const url = isRegister ? '/api/auth/register' : '/api/auth/login';
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (data.success) {
                if (isRegister) {
                    setSuccess(t.auth.registerSuccess);
                    setIsRegister(false); // Switch to login view after successful registration
                } else {
                    setSuccess(t.auth.loginSuccess);
                    setToken(data.token, data.username);
                    setTimeout(() => setActiveTab("trading"), 1000); // Redirect to trading after login
                }
            } else {
                setError(data.error || 'An unknown error occurred.');
            }
        } catch (err) {
            setError('Failed to connect to the server.');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <h2 className="text-2xl font-bold text-center mb-6">{isRegister ? t.auth.register : t.auth.login}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">{t.auth.username}</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md dark:bg-slate-800 dark:border-slate-700"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t.auth.password}</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md dark:bg-slate-800 dark:border-slate-700"
                        required
                    />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && <p className="text-green-500 text-sm">{success}</p>}
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-600">
                    {isRegister ? t.auth.register : t.auth.login}
                </button>
            </form>
            <p className="text-center text-sm mt-4">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
                <button onClick={() => setIsRegister(!isRegister)} className="text-blue-600 dark:text-cyan-400 hover:underline ml-1">
                    {isRegister ? t.auth.login : t.auth.register}
                </button>
            </p>
        </div>
    );
}
