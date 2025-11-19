import { useCallback, useState } from "react";

export type CameraAction =
    | "start"
    | "stop"
    | "enable_inference"
    | "disable_inference";

export interface CameraControlResponse {
    status: string;
    camera_id: string;
    action_processed: CameraAction | string;
}

export function useCameraControl(baseUrl = "http://localhost:8010") {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const sendCommand = useCallback(
        async (cameraId: string, action: CameraAction) => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`${baseUrl}/control/camera`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        camera_id: cameraId,
                        action,
                    }),
                });

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Error ${res.status}: ${text}`);
                }

                const data = (await res.json()) as CameraControlResponse;
                return data;
            } catch (err: any) {
                setError(err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [baseUrl]
    );

    const startCamera = useCallback(
        (cameraId: string) => sendCommand(cameraId, "start"),
        [sendCommand]
    );

    const stopCamera = useCallback(
        (cameraId: string) => sendCommand(cameraId, "stop"),
        [sendCommand]
    );

    const enableInference = useCallback(
        (cameraId: string) => sendCommand(cameraId, "enable_inference"),
        [sendCommand]
    );

    const disableInference = useCallback(
        (cameraId: string) => sendCommand(cameraId, "disable_inference"),
        [sendCommand]
    );

    return {
        loading,
        error,
        sendCommand,
        startCamera,
        stopCamera,
        enableInference,
        disableInference,
    };
}
