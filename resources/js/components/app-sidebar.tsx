import CourseController from '@/actions/App/Http/Controllers/CourseController';
import DashboardController from '@/actions/App/Http/Controllers/DashboardController';
import EnrollmentRequestController from '@/actions/App/Http/Controllers/EnrollmentRequestController';
import PermissionController from '@/actions/App/Http/Controllers/PermissionController';
import RoleController from '@/actions/App/Http/Controllers/RoleController';
import UserController from '@/actions/App/Http/Controllers/UserController';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavGroup } from '@/types';
import { PermissionEnum, RoleEnum } from '@/types/enums.generated';
import { Link } from '@inertiajs/react';
import { BookA, BookDashed, Compass, Key, LayoutGrid, Lock, User } from 'lucide-react';
import AppLogo from './app-logo';
import QuizController from '@/actions/App/Http/Controllers/QuizController';
import ModuleContentController from '@/actions/App/Http/Controllers/ModuleContentController';

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
                permissions: [PermissionEnum.ReadUser],
            },
            {
                title: 'Permission Management',
                href: PermissionController.index(),
                icon: Key,
                permissions: [PermissionEnum.ReadPermission],
            },
            {
                title: 'Role Management',
                href: RoleController.index(),
                icon: Lock,
                permissions: [PermissionEnum.ReadRole],
            },
        ],
    },
    {
        title: 'Academics',
        menu: [
            {
                title: 'Eksplor Kursus',
                href: CourseController.explore(),
                icon: Compass,
                permissions: [RoleEnum.Student],
            },
            {
                title: 'Courses',
                href: CourseController.index(),
                icon: BookA,
                permissions: [PermissionEnum.ReadCourse],
            },
            {
                title: 'Enrollment Request',
                href: EnrollmentRequestController.index(),
                icon: BookDashed,
                permissions: [PermissionEnum.ReadEnrollment],
            },
            {
                title: 'Quizzes',
                href: QuizController.index(),
                icon: BookA,
            },
            {
                title: 'Videos',
                href: ModuleContentController.videos(),
                icon: BookA,
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
