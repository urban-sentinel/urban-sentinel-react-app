import { useCallback, useMemo, useState } from "react";
import { HttpClient } from "../../../app/services/httpClient";
import { AuthService } from "../services/AuthService";
import { TOKEN_KEY, EXPIRES_KEY, type LoginUserRequest, type RegisterUserRequest } from "../types/AuthTypes";

const httpClient = new HttpClient();
const authService = new AuthService(httpClient);

function saveToken(token: string, expiresIn?: number) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem("token", token);

    if (expiresIn && Number.isFinite(expiresIn)) {
        const expiresAt = Date.now() + expiresIn * 1000;
        localStorage.setItem(EXPIRES_KEY, String(expiresAt));
    } else {
        localStorage.removeItem(EXPIRES_KEY);
    }
}

function saveUserInfo(user: RegisterUserRequest) {
    localStorage.setItem("user_email", user.email);
    localStorage.setItem("user_rol", user.rol);
}

export function getToken(): string | null {
    const t = localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem("token");
    const exp = localStorage.getItem(EXPIRES_KEY);

    if (t && exp && Date.now() > Number(exp)) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("token");
        localStorage.removeItem(EXPIRES_KEY);
        return null;
    }

    return t;
}

export function isAdmin(): boolean {
    const rol = localStorage.getItem("user_rol");
    if (rol) {
        return rol === 'ADMIN';
    }
    return false;
}   

export function authHeaders(): HeadersInit {
    const t = getToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
}

export function useAuth() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<RegisterUserRequest | null>(null);
    const token = useMemo(() => getToken(), []);

    const isAuthenticated = !!token;

    const register = useCallback(async (request: RegisterUserRequest) => {
        setLoading(true);
        setError(null);
        setUser(null);
        try {
            const data = await authService.register(request);

            if (!data || !data.access_token) {
                throw new Error("Respuesta inválida");
            }

            // Get User Info
            const userInfo = await authService.getUserInfoByEmail(request.email);
            if (!userInfo) {
                throw new Error("No se pudo obtener la información del usuario");
            }

            setUser(userInfo);
            saveUserInfo(userInfo);

            saveToken(data.access_token, data.expires_in);
            return data;
        } catch (e: any) {
            setError(e?.message ?? "Error de registro");
        }
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {

            const data = await authService.login({ email, password } as LoginUserRequest);

            if (!data || !data.access_token) {
                throw new Error("Respuesta inválida");
            }

            // Get User Info
            const userInfo = await authService.getUserInfoByEmail(email);
            if (!userInfo) {
                throw new Error("No se pudo obtener la información del usuario");
            }

            setUser(userInfo);
            saveUserInfo(userInfo)

            saveToken(data.access_token, data.expires_in);
            return true;
        } catch (e: any) {
            setError(e?.message ?? "Error de login");
            throw e;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("token");
        localStorage.removeItem(EXPIRES_KEY);
        localStorage.removeItem("user_rol");
        localStorage.removeItem("user_email");
    }, []);

    return { loading, error, isAuthenticated, token: getToken(), isAdmin: isAdmin(), login, logout, register, user };
}
