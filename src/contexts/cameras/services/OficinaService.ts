import { HttpClient } from "../../../app/services/httpClient";
import type { CreateOficinaRequest, OficinaData } from "../types/OficinaTypes";

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

    createOficina(data: CreateOficinaRequest): Promise<OficinaData | null> {
        return this.http.post<OficinaData>(this.path(""), data, true);
    }
}