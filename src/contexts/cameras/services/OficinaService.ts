import { HttpClient } from "../../../app/services/httpClient";
import type { OficinaData } from "../types/ConexionTypes";

export class OficinaService {
    private readonly basePath = "/api/oficinas";
    private readonly http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    private path(sub: string) {
        return `${this.basePath}${sub}`;
    }

    getAllConexions(): Promise<OficinaData[] | null> {
        return this.http.get<OficinaData[]>(this.path(""), {}, true);
    }
}