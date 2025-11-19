import { useCallback, useState } from "react";
import { ClipService } from "../services/ClipService";
import { HttpClient } from "../../../app/services/httpClient";

const httpClient: HttpClient = new HttpClient();
const clipService = new ClipService(httpClient);

export const useClips = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getAllClips = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await clipService.getAllClips();
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

    return { getAllClips, loading, error };;
}
