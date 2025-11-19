import { useCallback, useState } from "react";
import { HttpClient } from "../../app/services/httpClient"
import { MessageService } from "../services/MessageService";

const httpClient: HttpClient = new HttpClient();
const messageService = new MessageService(httpClient);

export const useMessages = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = useCallback(async (message: string, phone_number: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await messageService.sendMessage(message, phone_number);
            if (!response || !response.topic_message_id) {
                throw new Error("No se pudo enviar el mensaje");
            }
            return response;
        }
        catch (e: any) {
            setError(e.message || "Error desconocido");
        }
        finally {
            setLoading(false);
        }
    }, []);

    return { sendMessage, loading, error };;
}
