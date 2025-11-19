import { HttpClient } from "../../../app/services/httpClient";
import type { EventData } from "../types/EventTypes";

export class EventService {
    private readonly basePath = "/api/eventos";
    private readonly http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    private path(sub: string) {
        return `${this.basePath}${sub}`;
    }

    getAllEvents(): Promise<EventData[] | null> {
        return this.http.get<EventData[]>(this.path(""), {}, true);
    }
}