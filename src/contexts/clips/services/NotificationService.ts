import { HttpClient } from "../../../app/services/httpClient";
import type { NotificationData } from "../types/NotificationTypes";

export class NotificationService {
    private readonly basePath = "/api/notificaciones";
    private readonly http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    private path(sub: string) {
        return `${this.basePath}${sub}`;
    }

    getAllNotifications(): Promise<NotificationData[] | null> {
        return this.http.get<NotificationData[]>(this.path(""), {}, true);
    }
}