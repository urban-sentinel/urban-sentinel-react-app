import { useCallback, useState } from "react";
import { EventService } from "../services/EventService";
import { HttpClient } from "../../../app/services/httpClient";

const httpClient: HttpClient = new HttpClient();
const eventService = new EventService(httpClient);

export const useEvent = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getAllEvents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await eventService.getAllEvents();
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

    return { getAllEvents, loading, error };;
}
