export type CameraStatus = 'active' | 'disabled';
export type AlertSeverity = 'low' | 'medium' | 'high';
export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';


export interface Camera {
    id: string;
    name: string;
    location: string;
    status: CameraStatus;
}

export interface Alert {
    id: string;
    cameraId: string;
    severity: AlertSeverity;
    confidence: number;
    timeISO: string;
    type: string;
    read: boolean;
}

export interface SystemNote {
    id: string;
    message: string;
    timeISO: string;
    level: NotificationLevel;
}

export interface HistoryCase {
    id: string;
    title: string;
    caseNumber: string;
    severity: AlertSeverity;
    location: string;
    confidence: number;
    type: string;
    createdISO: string;
}


// Initial State
export const initialState = {
    user: {
        id: '1',
        name: 'Zárate Jose',
        avatarUrl: '',
        role: 'admin'
    },
    ui: {
        sidebarOpen: false,
        dateRange: {
            from: 'Nov 16, 2020',
            to: 'Dec 16, 2020'
        },
        search: '',
        currentRoute: '/'
    },
    cameras: [
        { id: '1', name: 'Av. Abancay', location: 'Centro', status: 'active' as CameraStatus },
        { id: '2', name: 'Jr. Los Cines', location: 'Norte', status: 'disabled' as CameraStatus },
        { id: '3', name: 'Av. Primavera', location: 'Sur', status: 'disabled' as CameraStatus },
        { id: '4', name: 'Av. Enciclada', location: 'Este', status: 'disabled' as CameraStatus },
        { id: '5', name: 'Plaza de Armas', location: 'Centro', status: 'disabled' as CameraStatus },
        { id: '6', name: 'Av. Los Laureles', location: 'Oeste', status: 'disabled' as CameraStatus }
    ],
    alerts: [
        { id: '1', cameraId: '1', severity: 'high' as AlertSeverity, confidence: 95, timeISO: '2020-12-16T13:50:00', type: 'Golpes', read: false },
        { id: '2', cameraId: '2', severity: 'medium' as AlertSeverity, confidence: 78, timeISO: '2020-12-16T14:20:00', type: 'Patadas', read: false },
        { id: '3', cameraId: '3', severity: 'low' as AlertSeverity, confidence: 62, timeISO: '2020-12-16T15:10:00', type: 'Golpes', read: false },
        { id: '4', cameraId: '5', severity: 'high' as AlertSeverity, confidence: 89, timeISO: '2020-12-16T16:05:00', type: 'Patadas', read: true }
    ],
    notifications: [
        { id: '1', message: '[LOG] Sistema reiniciado correctamente', timeISO: '2020-12-16T12:04:00', level: 'success' as NotificationLevel },
        { id: '2', message: '[LOG] Cámara Av. Abancay reconectada', timeISO: '2020-12-16T11:30:00', level: 'info' as NotificationLevel },
        { id: '3', message: '[LOG] Clip de video exportado', timeISO: '2020-12-16T10:15:00', level: 'success' as NotificationLevel },
        { id: '4', message: '[LOG] Actualización disponible', timeISO: '2020-12-16T09:00:00', level: 'warning' as NotificationLevel }
    ],
    history: [
        { id: '1', title: 'Sujeto destruyó cámara', caseNumber: 'GPO001265', severity: 'high' as AlertSeverity, location: 'Av. Abancay', confidence: 95, type: 'Patadas', createdISO: '2020-09-12T00:00:00' },
        { id: '2', title: 'Intento de robo detectado', caseNumber: 'GPO001266', severity: 'low' as AlertSeverity, location: 'Jr. Los Cines', confidence: 68, type: 'Golpes', createdISO: '2020-09-13T00:00:00' },
        { id: '3', title: 'Vandalismo en propiedad', caseNumber: 'GPO001267', severity: 'high' as AlertSeverity, location: 'Plaza de Armas', confidence: 92, type: 'Patadas', createdISO: '2020-09-14T00:00:00' }
    ]
};