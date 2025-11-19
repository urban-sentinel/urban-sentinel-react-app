import { HttpClient } from "../../../app/services/httpClient";
import type { LoginUserRequest, RegisterUserRequest, LoginResponse, UserData } from "../types/AuthTypes";

export class AuthService {
    private readonly basePath = "/api/auth";
    private readonly http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    private path(sub: string) {
        return `${this.basePath}${sub}`;
    }

    getAllUsers(): Promise<UserData[] | null> {
        return this.http.get<UserData[]>(this.path("/users"), {}, false);
    }

    getUserInfoByEmail(email: string): Promise<RegisterUserRequest | null> {
        return this.http
            .get<RegisterUserRequest[]>(this.path("/users"), { email }, false)
            .then((users) => {
                if (!users || users.length === 0) {
                    return null;
                }
                return users[0]; // el primero de la lista
            });
    }

    getUserInfoById(id: number) {
        return this.http.get<RegisterUserRequest>(this.path("/users"), { id }, false);
    }

    postForgotPassword(email: string) {
        return this.http.post<{ }, { email: string }>(
            this.path("/forgot-password"),  
            { email },
            false
        );
    }

    deleteUser(id: number) {
        return this.http.delete<{ id: number }>(
            this.path("/users"),
            { id },
            false
        );
    }

    register(payload: RegisterUserRequest) {
        return this.http.post<LoginResponse, RegisterUserRequest>(
            this.path("/register"),
            payload,
            false
        );
    }

    login(payload: LoginUserRequest) {
        return this.http.post<LoginResponse, LoginUserRequest>(
            this.path("/login"),
            payload,
            false
        );
    }

    refresh(refreshToken: string) {
        return this.http.post<LoginResponse, { refresh_token: string }>(
            this.path("/refresh"),
            { refresh_token: refreshToken },
            false
        );
    }
}
