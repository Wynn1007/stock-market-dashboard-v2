// src/hooks/useAuth.ts
import React, { useState, useEffect } from "react";

export function useAuth(lang: "zh" | "en") {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Initial load from localStorage or guest handshake
  useEffect(() => {
    const savedToken = localStorage.getItem("wynn_token");
    const savedUsername = localStorage.getItem("wynn_username");

    if (savedToken && savedUsername) {
      setToken(savedToken);
      setUsername(savedUsername);
    } else {
      autoGuestHandshake();
    }
  }, []);

  const autoGuestHandshake = async () => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "admin123" }),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setUsername(data.username);
        localStorage.setItem("wynn_token", data.token);
        localStorage.setItem("wynn_username", data.username);
      }
    } catch (err) {
      console.warn("Auto-handshake failure:", err);
      setAuthError("Failed to connect to authentication service.");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent, loginUser: string, loginPass: string) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser.trim(), password: loginPass }),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setUsername(data.username);
        localStorage.setItem("wynn_token", data.token);
        localStorage.setItem("wynn_username", data.username);
        setAuthSuccess(lang === "zh" ? "驗證成功！正在綁定 WS 量化頻道。" : "Authorized! WebSocket connected.");
        setTimeout(() => setAuthSuccess(null), 3000);
        return true;
      } else {
        setAuthError(data.message);
        return false;
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to reach server.");
      return false;
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent, regUser: string, regPass: string) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: regUser.trim(), password: regPass }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthSuccess(lang === "zh" ? "註冊成功！請直接填入上方進行登入。" : "Account registered! Access credentials above to sign in.");
        setTimeout(() => setAuthSuccess(null), 4000);
        return true;
      } else {
        setAuthError(data.message);
        return false;
      }
    } catch (err: any) {
      setAuthError(err.message || "Credential configuration failure.");
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("wynn_token");
    localStorage.removeItem("wynn_username");
    setToken(null);
    setUsername(null);
    // Trigger guest handshake to prevent being logged out completely
    autoGuestHandshake();
  };

  return {
    token,
    username,
    authError,
    authSuccess,
    handleLoginSubmit,
    handleRegisterSubmit,
    handleLogout,
    setAuthError
  };
}
