import { useEffect, useRef, useState } from "react";
import type { NotificationData } from "../../contexts/clips/types/NotificationTypes";

const WS_BASE =
    import.meta.env.VITE_API_WS_BASE || "ws://127.0.0.1:8000";

type WSStatus = "idle" | "connecting" | "open" | "error" | "closed";

export const useNotificationStream = (destinatario: string) => {
    const [latest, setLatest] = useState<NotificationData | null>(null);
    const [all, setAll] = useState<NotificationData[]>([]);
    const [status, setStatus] = useState<WSStatus>("idle");
    const [lastError, setLastError] = useState<Event | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!destinatario) {
            setStatus("idle");
            return;
        }

        let manualClose = false;
        setStatus("connecting");
        setLastError(null);

        const url = new URL(`${WS_BASE}/ws/notifications`);
        url.searchParams.set("destinatario", destinatario);

        const ws = new WebSocket(url.toString());
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("[WS-NOTIF] conectado:", url.toString());
            setStatus("open");
        };

        ws.onerror = (ev) => {
            console.error("[WS-NOTIF] error", ev);
            setLastError(ev);
            setStatus("error");
        };

        ws.onmessage = (ev) => {
            try {
                const data = JSON.parse(ev.data) as NotificationData;
                setLatest(data);
                setAll((prev) => [data, ...prev]);
            } catch (e) {
                console.error("Error parsing notification WS", e);
            }
        };

        ws.onclose = (ev) => {
            console.log("[WS-NOTIF] cerrado", ev.code, ev.reason);
            setStatus(manualClose ? "closed" : "error");

            // reconectar si se cerró solo
            if (!manualClose) {
                setTimeout(() => {
                    // disparar el efecto otra vez cambiando una “key”
                    // lo más simple: cambiar destinatario en el componente padre
                    // o usar un estado extra de reintentos
                }, 2000);
            }
        };

        // Cleanup: cerrar el socket de ESTE efecto
        return () => {
            manualClose = true;
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
            if (wsRef.current === ws) {
                wsRef.current = null;
            }
        };
    }, [destinatario]);

    return {
        latest,
        notifications: all,
        status,      // "connecting" | "open" | "error" | ...
        lastError,
    };
};
