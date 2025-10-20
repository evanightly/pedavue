import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    menu: NavItem[];
}

export interface NavItem {
    title: string;
    href?: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    matchStrategy?: 'exact' | 'prefix';
    children?: NavItem[];
    subMenu?: NavItem[]; // Alternative name for children to match your preferred structure
    badge?: string | number;
    permissions?: App.Support.Enums.PermissionEnum[] | App.Support.Enums.RoleEnum[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    avatar_url?: string;
    role?: App.Support.Enums.RoleEnum | null;
    permissions?: App.Support.Enums.PermissionEnum[] | null;
    roles?: App.Data.Role.RoleData[] | null;
    [key: string]: unknown; // This allows for additional properties...
}

// Interfaces for service hooks and data selector
export interface FilterOptions {
    page?: number;
    page_size?: number;
    search?: string;
    sort?: string;
    [key: string]: any;
}

export interface Resource {
    id: number;
    name?: string;
    [key: string]: any;
}
