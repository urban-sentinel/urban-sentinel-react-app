import { useCallback, useState } from "react";
import { OficinaService } from "../services/OficinaService";
import { HttpClient } from "../../../app/services/httpClient";

const httpClient: HttpClient = new HttpClient();
const oficinaService = new OficinaService(httpClient);

export const useOficina = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getAllOffices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await oficinaService.getAllConexions();
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

    return { getAllOffices, loading, error };;
}
