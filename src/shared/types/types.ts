import * as React from "react";

export type NavItem = {
    label: string;
    path: string;
    icon?: React.ReactNode;
    badgeContent?: number;
};