// httpClient.ts
export type QueryParams = Record<string, string | number | boolean>;
export type HeadersMap = Record<string, string>;
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class HttpClient {
    private baseURL: string;
    private defaultHeaders: HeadersMap;

    constructor(baseURL: string = import.meta.env.VITE_API_URL || "http://localhost:8000") {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            "Content-Type": "application/json",
        };
    }

    private buildUrl(path: string, params: QueryParams = {}): URL {
        const url = new URL(path, this.baseURL);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
        });
        return url;
    }

    protected getAuthToken(): string | null {
        return localStorage.getItem("token");
    }

    protected getHeaders(customHeaders: HeadersMap = {}, withAuth = true): HeadersMap {
        const token = this.getAuthToken();
        return {
            ...this.defaultHeaders,
            ...(withAuth && token && { Authorization: `Bearer ${token}` }),
            ...customHeaders,
        };
    }

    private async handleResponse<T>(response: Response): Promise<T | null> {
        if (!response.ok) {
            const error = (await response
                .json()
                .catch(() => ({ detail: "Error desconocido" }))) as { detail?: string };

            throw new Error(error.detail || `Error ${response.status}`);
        }

        if (response.status === 204) return null;

        return response.json() as Promise<T>;
    }

    async request<T = unknown, B = unknown>(options: {
        method: HttpMethod;
        path: string;
        body?: B;
        params?: QueryParams;
        headers?: HeadersMap;
        withAuth?: boolean;
    }): Promise<T | null> {
        const {
            method,
            path,
            body,
            params = {},
            headers = {},
            withAuth = true,
        } = options;

        const url = this.buildUrl(path, params);

        const response = await fetch(url.toString(), {
            method,
            headers: this.getHeaders(headers, withAuth),
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        return this.handleResponse<T>(response);
    }

    // helpers si quieres azúcar sintáctico
    get<T = unknown>(path: string, params?: QueryParams, withAuth = true) {
        return this.request<T>({ method: "GET", path, params, withAuth });
    }

    post<T = unknown, B = unknown>(path: string, body?: B, withAuth = true) {
        return this.request<T, B>({ method: "POST", path, body, withAuth });
    }

    put<T = unknown, B = unknown>(path: string, body?: B, withAuth = true) {
        return this.request<T, B>({ method: "PUT", path, body, withAuth });
    }

    patch<T = unknown, B = unknown>(path: string, body?: B, withAuth = true) {
        return this.request<T, B>({ method: "PATCH", path, body, withAuth });
    }

    delete<T = unknown>( path: string, params?: QueryParams, withAuth = true) {
        return this.request<T>({ method: "DELETE", path, params, withAuth });
    }
}
