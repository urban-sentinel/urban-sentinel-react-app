import { useCallback, useState } from "react";
import { HttpClient } from "../../../app/services/httpClient";
import { NotificationService } from "../services/NotificationService";

const httpClient: HttpClient = new HttpClient();
const notificationService = new NotificationService(httpClient);

export const useNotification = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getAllNotifications = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await notificationService.getAllNotifications();
            if (!response) {
                throw new Error("No se pudieron obtener las conexiones");
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

    return { getAllNotifications, loading, error };;
}
