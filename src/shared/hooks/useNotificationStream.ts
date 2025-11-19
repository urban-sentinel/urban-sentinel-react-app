import { useEffect, useState } from "react";
import type { NotificationData } from "../../contexts/clips/types/NotificationTypes";

const WS_BASE =
    import.meta.env.VITE_API_WS_BASE || "ws://127.0.0.1:8000";

export const useNotificationStream = (destinatario: string) => {
    const [latest, setLatest] = useState<NotificationData | null>(null);
    const [all, setAll] = useState<NotificationData[]>([]);

    useEffect(() => {
        if (!destinatario) return;

        // Si tu API_BASE es http://..., cámbiala a ws://...
        const url = new URL(`${WS_BASE}/ws/notifications`);
        url.searchParams.set("destinatario", destinatario);

        const ws = new WebSocket(url.toString());

        ws.onmessage = (ev) => {
            try {
                const data = JSON.parse(ev.data) as NotificationData;
                setLatest(data);
                setAll((prev) => [data, ...prev]);
            } catch (e) {
                console.error("Error parsing notification WS", e);
            }
        };

        ws.onclose = () => {
            // opcional: reconectar
            // setTimeout(() => { ...create new WebSocket... }, 2000);
        };

        return () => ws.close();
    }, [destinatario]);

    return { latest, notifications: all };
};