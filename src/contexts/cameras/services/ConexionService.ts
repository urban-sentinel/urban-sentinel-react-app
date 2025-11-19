import { HttpClient } from "../../../app/services/httpClient";
import type { ConexionData, CreateCameraPayload } from "../types/ConexionTypes";

export class ConexionService {
    private readonly basePath = "/api/conexiones";
    private readonly http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    private path(sub: string) {
        return `${this.basePath}${sub}`;
    }

    getAllConexions(): Promise<ConexionData[] | null> {
        return this.http.get<ConexionData[]>(this.path(""), {}, true);
    }

    createConexion(data: CreateCameraPayload): Promise<ConexionData | null> {
        return this.http.post<ConexionData>(this.path(""), data, true);
    }

    updateEstado(idConexion: number, activo: boolean): Promise<ConexionData | null> {
        const url = this.path(`/${idConexion}/estado?activo=${activo}`);
        return this.http.patch<ConexionData>(url, {}, true);
    }

    updateHabilitado(idConexion: number, activo: boolean): Promise<ConexionData | null> {
        const url = this.path(`/${idConexion}/habilitada?habilitada=${activo}`);
        return this.http.patch<ConexionData>(url, {}, true);
    }
}