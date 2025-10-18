import CourseController from '@/actions/App/Http/Controllers/CourseController';
import DashboardController from '@/actions/App/Http/Controllers/DashboardController';
import PermissionController from '@/actions/App/Http/Controllers/PermissionController';
import RoleController from '@/actions/App/Http/Controllers/RoleController';
import UserController from '@/actions/App/Http/Controllers/UserController';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavGroup } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookA, Key, LayoutGrid, Lock, User } from 'lucide-react';
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
                icon: User,
            },
            {
                title: 'Permission Management',
                href: PermissionController.index(),
                icon: Key,
            },
            {
                title: 'Role Management',
                href: RoleController.index(),
                icon: Lock,
            },
        ],
    },
    {
        title: 'Academics',
        menu: [
            {
                title: 'Courses',
                href: CourseController.index(),
                icon: BookA,
            },
        ],
    },
];

export function AppSidebar() {
    const page = usePage();

    console.log(page);

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
