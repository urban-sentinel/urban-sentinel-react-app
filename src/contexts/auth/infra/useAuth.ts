import { useCallback, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

type LoginResponse = {
    access_token: string;
    token_type: "bearer" | string;
    expires_in?: number; // segundos
};

const TOKEN_KEY = "access_token";
const EXPIRES_KEY = "access_token_expires_at"; // epoch ms

function saveToken(token: string, expiresIn?: number) {
    localStorage.setItem(TOKEN_KEY, token);
    if (expiresIn && Number.isFinite(expiresIn)) {
        const expiresAt = Date.now() + expiresIn * 1000;
        localStorage.setItem(EXPIRES_KEY, String(expiresAt));
    } else {
        localStorage.removeItem(EXPIRES_KEY);
    }
}

export function getToken(): string | null {
    const t = localStorage.getItem(TOKEN_KEY);
    const exp = localStorage.getItem(EXPIRES_KEY);
    if (t && exp && Date.now() > Number(exp)) {
        // expiró
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EXPIRES_KEY);
        return null;
    }
    return t;
}

export function authHeaders(): HeadersInit {
    const t = getToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
}

export function useAuth() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const token = useMemo(() => getToken(), []);

    const isAuthenticated = !!token;

    const login = useCallback(async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json", accept: "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data: LoginResponse = await res.json();
            if (!data?.access_token) throw new Error("Respuesta inválida");

            saveToken(data.access_token, data.expires_in);
            return data.access_token;
        } catch (e: any) {
            setError(e?.message ?? "Error de login");
            throw e;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EXPIRES_KEY);
    }, []);

    return { loading, error, isAuthenticated, token: getToken(), login, logout };
}
