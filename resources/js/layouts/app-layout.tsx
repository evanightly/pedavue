import InertiaMessenger from '@/components/inertia-messenger';
import { useAutoBreadcrumbs } from '@/hooks/use-auto-breadcrumbs';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const inferredBreadcrumbs = useAutoBreadcrumbs();

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs ?? inferredBreadcrumbs} {...props}>
            <InertiaMessenger />
            {children}
        </AppLayoutTemplate>
    );
};
