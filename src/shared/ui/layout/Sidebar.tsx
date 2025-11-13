import * as React from "react";
import {
    Box, Divider, Drawer, List, ListItemButton,
    ListItemIcon, ListItemText, Toolbar, Typography,
} from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import type { NavItem } from "../../types/types";

export const DEFAULT_DRAWER_WIDTH = 260;

export type SidebarProps = {
    items: NavItem[];
    drawerWidth?: number;
    logo?: React.ReactNode;
};

const LinkItem: React.FC<{ item: NavItem; selected: boolean }> = ({ item, selected }) => (
    <ListItemButton selected={selected}>
        {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
        <ListItemText primary={item.label} />
    </ListItemButton>
);

export const Sidebar: React.FC<SidebarProps> = ({ items, drawerWidth = DEFAULT_DRAWER_WIDTH, logo }) => {
    const location = useLocation();

    const content = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Toolbar sx={{ px: 2 }}>
                {logo ?? (
                    <Typography variant="h6" fontWeight={700}>
                        SecureCam
                    </Typography>
                )}
            </Toolbar>
            <Divider />
            <Box sx={{ flex: 1, overflowY: "auto" }}>
                <List sx={{ py: 0 }}>
                    {items.map((item) => {
                        const selected =
                            location.pathname === item.path || location.pathname.startsWith(item.path + "/");
                        return (
                            <NavLink key={item.path} to={item.path} style={{ textDecoration: "none", color: "inherit" }}>
                                <LinkItem item={item} selected={selected} />
                            </NavLink>
                        );
                    })}
                </List>
            </Box>
            <Divider />
            <Box sx={{ p: 2, color: "text.secondary", fontSize: 12 }}>
                © {new Date().getFullYear()} – Tu empresa
            </Box>
        </Box>
    );

    return (
        <Box component="nav" sx={{ width: drawerWidth, flexShrink: 0 }} aria-label="navigation">
            <Drawer
                variant="permanent"
                open
                sx={{
                    "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
                }}
            >
                {content}
            </Drawer>
        </Box>
    );
};
