import DashboardController from '@/actions/App/Http/Controllers/DashboardController';
import UserController from '@/actions/App/Http/Controllers/UserController';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavGroup } from '@/types';
import { Link } from '@inertiajs/react';
import { LayoutGrid } from 'lucide-react';
import AppLogo from './app-logo';

const navGroups: NavGroup[] = [
    {
        title: 'Dashboard',
        menu: [
            {
                title: 'Dashboard',
                href: DashboardController.index(),
                icon: LayoutGrid,
            },
            {
                title: 'User Management',
                href: UserController.index(),
                icon: LayoutGrid,
            },
        ],
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible='icon' variant='inset'>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size='lg' asChild>
                            <Link href={DashboardController.index()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
