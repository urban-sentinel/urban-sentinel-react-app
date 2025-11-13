import * as React from "react";
import { AppBar, Avatar, Badge, Box, IconButton, InputBase, Toolbar, Typography } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SearchIcon from "@mui/icons-material/Search";

export const TopBar: React.FC<{ title?: string }> = ({ title = "Dashboard" }) => (
    <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {title}
            </Typography>
            <Box
                sx={{
                    flex: 1,
                    maxWidth: 520,
                    ml: { xs: 0, md: 2 },
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: "background.default",
                    border: 1,
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                }}
            >
                <SearchIcon fontSize="small" />
                <InputBase placeholder="Buscar" sx={{ flex: 1 }} inputProps={{ "aria-label": "buscar" }} />
            </Box>
            <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton size="large">
                    <Badge color="error" variant="dot">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
                <Avatar sx={{ width: 32, height: 32 }}>U</Avatar>
            </Box>
        </Toolbar>
    </AppBar>
);
