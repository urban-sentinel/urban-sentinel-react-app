import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Grid,
    Chip,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Alert,
    CircularProgress,
} from "@mui/material";
import type { EventData } from "../../clips/types/EventTypes";
import { useEvent } from "../../clips/infra/useEvents";

type DailyRow = {
    date: string;                    // "YYYY-MM-DD"
    total: number;                   // total de eventos ese día
    byType: Record<string, number>;  // { golpe: 3, patada: 2, ... }
    avgConfidence: number;           // 0–1
};

export const ReportsPage: React.FC = () => {
    const { getAllEvents, loading, error } = useEvent();

    const [events, setEvents] = useState<EventData[]>([]);
    const [dateFrom, setDateFrom] = useState(""); // filtros “en edición”
    const [dateTo, setDateTo] = useState("");
    const [appliedFrom, setAppliedFrom] = useState<string | null>(null);
    const [appliedTo, setAppliedTo] = useState<string | null>(null);

    // 1) Cargar eventos una vez
    useEffect(() => {
        (async () => {
            const data = await getAllEvents();
            if (Array.isArray(data)) {
                setEvents(data);
                // rango por defecto = [minDate, maxDate]
                const dates = data
                    .map((e) => e.timestamp_evento.slice(0, 10))
                    .sort();
                if (dates.length) {
                    setDateFrom(dates[0]);
                    setDateTo(dates[dates.length - 1]);
                    setAppliedFrom(dates[0]);
                    setAppliedTo(dates[dates.length - 1]);
                }
            }
        })();
    }, [getAllEvents]);

    // 2) Aplicar rango cuando se pulsa el botón
    const handleApplyFilters = () => {
        setAppliedFrom(dateFrom || null);
        setAppliedTo(dateTo || null);
    };

    // 3) Filtrado por fecha
    const filteredEvents = useMemo(() => {
        if (!appliedFrom && !appliedTo) return events;

        return events.filter((e) => {
            const d = new Date(e.timestamp_evento);
            if (appliedFrom) {
                const from = new Date(`${appliedFrom}T00:00:00`);
                if (d < from) return false;
            }
            if (appliedTo) {
                const to = new Date(`${appliedTo}T23:59:59.999`);
                if (d > to) return false;
            }
            return true;
        });
    }, [events, appliedFrom, appliedTo]);

    // 4) Agrupación por día
    const dailyRows: DailyRow[] = useMemo(() => {
        const map = new Map<
            string,
            { date: string; total: number; byType: Record<string, number>; sumConf: number; countConf: number }
        >();

        for (const e of filteredEvents) {
            const date = e.timestamp_evento.slice(0, 10); // YYYY-MM-DD
            const conf = parseFloat(e.confianza ?? "0") || 0;
            const typeKey = (e.tipo_evento || "desconocido").toLowerCase();

            if (!map.has(date)) {
                map.set(date, {
                    date,
                    total: 0,
                    byType: {},
                    sumConf: 0,
                    countConf: 0,
                });
            }
            const row = map.get(date)!;
            row.total += 1;
            row.byType[typeKey] = (row.byType[typeKey] || 0) + 1;
            row.sumConf += conf;
            row.countConf += 1;
        }

        return Array.from(map.values())
            .map((r) => ({
                date: r.date,
                total: r.total,
                byType: r.byType,
                avgConfidence: r.countConf ? r.sumConf / r.countConf : 0,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [filteredEvents]);

    // 5) Métricas globales
    const totalEvents = filteredEvents.length;
    const totalDays = dailyRows.length;
    const avgPerDay = totalDays ? totalEvents / totalDays : 0;

    const eventsByType = useMemo(() => {
        const byType: Record<string, number> = {};
        for (const e of filteredEvents) {
            const k = (e.tipo_evento || "desconocido").toLowerCase();
            byType[k] = (byType[k] || 0) + 1;
        }
        return byType;
    }, [filteredEvents]);

    const overallAvgConfidence = useMemo(() => {
        let sum = 0;
        let count = 0;
        for (const e of filteredEvents) {
            const c = parseFloat(e.confianza ?? "0");
            if (!Number.isNaN(c)) {
                sum += c;
                count += 1;
            }
        }
        return count ? sum / count : 0;
    }, [filteredEvents]);

    // 6) “Gráfico” sencillo de barras horizontales
    const maxDaily = dailyRows.reduce((m, r) => Math.max(m, r.total), 1);

    // 7) Exportar reporte a CSV
    const handleExport = () => {
        if (!dailyRows.length) return;

        const header = [
            "fecha",
            "total_eventos",
            "promedio_confianza",
            "detalle_por_tipo", // texto: "golpe:3; patada:2; ..."
        ];

        const lines = [header.join(",")];

        for (const row of dailyRows) {
            const detail = Object.entries(row.byType)
                .map(([tipo, count]) => `${tipo}:${count}`)
                .join(";");
            lines.push(
                [
                    row.date,
                    row.total,
                    row.avgConfidence.toFixed(3),
                    `"${detail}"`,
                ].join(",")
            );
        }

        const csv = lines.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reporte_eventos_${appliedFrom || "inicio"}_${appliedTo || "fin"}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f5f6f8", minHeight: "100vh" }}>
            {/* Título + filtros (HU 1 y HU 2) */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    justifyContent: "space-between",
                    alignItems: { xs: "flex-start", md: "center" },
                    gap: 2,
                    mb: 3,
                }}
            >
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
                        Reportes de casos
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                        Análisis de eventos detectados en un rango de fechas.
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <TextField
                        label="Desde"
                        type="date"
                        size="small"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="Hasta"
                        type="date"
                        size="small"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleApplyFilters}
                        disabled={loading}
                    >
                        Aplicar filtros
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={handleExport}
                        disabled={!dailyRows.length}
                    >
                        Exportar reporte
                    </Button>
                </Box>
            </Box>

            {/* Estados de carga / error */}
            {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    No se pudieron cargar los eventos: {error}
                </Alert>
            )}

            {!loading && !error && !filteredEvents.length && (
                <Alert severity="info">
                    No hay eventos en el rango seleccionado.
                </Alert>
            )}

            {/* Métricas (HU 3) */}
            {!!filteredEvents.length && (
                <>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid sx={{ xs:12, md:4 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                                        Total de eventos
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                        {totalEvents}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                                        En {totalDays} días ({avgPerDay.toFixed(1)} por día)
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid sx={{ xs:12, md:4 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                                        Distribución por tipo
                                    </Typography>
                                    <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                                        {Object.entries(eventsByType).map(([tipo, count]) => (
                                            <Chip
                                                key={tipo}
                                                label={`${tipo}: ${count}`}
                                                size="small"
                                            />
                                        ))}
                                        {!Object.keys(eventsByType).length && (
                                            <Typography
                                                variant="body2"
                                                sx={{ color: "#94a3b8", fontStyle: "italic" }}
                                            >
                                                Sin datos
                                            </Typography>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid sx={{ xs:12, md:4 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                                        Confianza promedio
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                        {(overallAvgConfidence * 100).toFixed(1)}%
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                                        Basado en los eventos del rango seleccionado.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* “Gráfico” de barras horizontales (HU 1 + HU 3) */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 600, mb: 2, color: "#1e293b" }}
                            >
                                Eventos por día
                            </Typography>

                            {dailyRows.map((row) => (
                                <Box
                                    key={row.date}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        mb: 1,
                                        gap: 1,
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{ width: 90, color: "#64748b" }}
                                    >
                                        {row.date}
                                    </Typography>
                                    <Box
                                        sx={{
                                            flex: 1,
                                            height: 10,
                                            bgcolor: "#e2e8f0",
                                            borderRadius: 9999,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: `${(row.total / maxDaily) * 100}%`,
                                                height: "100%",
                                                bgcolor: "primary.main",
                                            }}
                                        />
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        sx={{ width: 40, textAlign: "right" }}
                                    >
                                        {row.total}
                                    </Typography>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Tabla de detalle (HU 1 + HU 3) */}
                    <Card>
                        <CardContent>
                            <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 600, mb: 2, color: "#1e293b" }}
                            >
                                Resumen por día
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Fecha</TableCell>
                                        <TableCell align="right">Total eventos</TableCell>
                                        <TableCell align="right">Promedio confianza</TableCell>
                                        <TableCell>Detalle por tipo</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {dailyRows.map((row) => (
                                        <TableRow key={row.date}>
                                            <TableCell>{row.date}</TableCell>
                                            <TableCell align="right">{row.total}</TableCell>
                                            <TableCell align="right">
                                                {(row.avgConfidence * 100).toFixed(1)}%
                                            </TableCell>
                                            <TableCell>
                                                {Object.entries(row.byType)
                                                    .map(([tipo, count]) => `${tipo}: ${count}`)
                                                    .join(" · ")}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}
        </Box>
    );
};
