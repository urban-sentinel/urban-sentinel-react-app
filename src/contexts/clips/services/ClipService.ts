import { HttpClient } from "../../../app/services/httpClient";
import type { EventData } from "../types/EventTypes";

export class ClipService {
    private readonly basePath = "/api/clips";
    private readonly http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    private path(sub: string) {
        return `${this.basePath}${sub}`;
    }

    getAllClips(): Promise<EventData[] | null> {
        return this.http.get<EventData[]>(this.path(""), {}, true);
    }
}