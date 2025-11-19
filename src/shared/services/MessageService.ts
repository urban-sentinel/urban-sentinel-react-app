import type { HttpClient } from "../../app/services/httpClient";

export class MessageService {
    private readonly basePath = "/api/messages";
    private readonly http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    private path(sub: string) {
        return `${this.basePath}${sub}`;
    }

    sendMessage(message: string, phone_number: string) {
        return this.http.post<{ topic_message_id: string, sms_message_id: string }, { message: string; phone_number: string }>(
            this.path("/sns/alert"),
            { message, phone_number },
            false
        );
    }
}