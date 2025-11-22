import { useRef } from "react";
import alertSoundFile from "../../assets/message-alert.mp3";

export function useAlertSound() {
    const audioRef = useRef<HTMLAudioElement | null>(
        typeof Audio !== "undefined" ? new Audio(alertSoundFile) : null
    );

    const playAlert = () => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = 0; // reiniciar
        audioRef.current.play().catch((err) => {
            console.warn("No se pudo reproducir el sonido", err);
        });
    };

    return { playAlert };
}
