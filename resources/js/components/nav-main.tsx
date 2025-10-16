import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { type NavGroup, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

function getHrefString(href: NonNullable<NavItem['href']>): string {
    return typeof href === 'string' ? href : href.url;
}

function isActiveRoute(currentUrl: string, itemHref: NonNullable<NavItem['href']>, strategy: NavItem['matchStrategy'] = 'prefix'): boolean {
    const href = getHrefString(itemHref);

    // Skip placeholder hrefs
    if (href === '#' || href === '') {
        return false;
    }

    // Extract pathname from current URL (ignore query params and hash)
    const currentPath = currentUrl.split('?')[0].split('#')[0];
    const targetPath = href.split('?')[0].split('#')[0];

    // Remove trailing slashes for comparison
    const normalizedCurrentPath = currentPath.replace(/\/$/, '') || '/';
    const normalizedTargetPath = targetPath.replace(/\/$/, '') || '/';

    // For root path, require exact match to avoid matching everything
    if (normalizedTargetPath === '/') {
        return normalizedCurrentPath === '/';
    }

    if (strategy === 'exact') {
        return normalizedCurrentPath === normalizedTargetPath;
    }

    // For non-root paths, check if current path starts with target path
    // This allows /notes?sort=-created_at to match /notes
    return normalizedCurrentPath === normalizedTargetPath || normalizedCurrentPath.startsWith(normalizedTargetPath + '/');
}

function NavMenuItem({ item, currentUrl }: { item: NavItem; currentUrl: string }) {
    const hasSubMenu = (item.children && item.children.length > 0) || (item.subMenu && item.subMenu.length > 0);
    const subMenuItems = item.children || item.subMenu || [];

    if (hasSubMenu) {
        // For parent items with sub-menu, check if any child is active
        const hasActiveChild = subMenuItems.some((child) => child.href && isActiveRoute(currentUrl, child.href, child.matchStrategy));

        // Parent should show active state only if no child is active but the parent route is accessed directly
        // Parent should show active state only if no child is active but the parent route is accessed directly
        const isParentActive = item.href && !hasActiveChild && isActiveRoute(currentUrl, item.href, item.matchStrategy);
        const shouldShowAsActive = Boolean(hasActiveChild || isParentActive);

        return (
            <Collapsible asChild defaultOpen={shouldShowAsActive} className='group/collapsible'>
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            variant='windui'
                            tooltip={{ children: item.title }}
                            isActive={shouldShowAsActive}
                            className={!item.href || item.href === '#' ? 'cursor-default' : ''}
                        >
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            {item.badge && (
                                <span className='mr-2 ml-auto rounded bg-sidebar-accent px-1.5 py-0.5 text-xs text-sidebar-accent-foreground'>
                                    {item.badge}
                                </span>
                            )}
                            <ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {subMenuItems.map((subItem) => (
                                <NavSubMenuItem key={subItem.title} item={subItem} currentUrl={currentUrl} />
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
        );
    }

    // Leaf items (no sub-menu)
    if (!item.href) {
        // Items without href are just labels - shouldn't happen in leaf items but handle gracefully
        return (
            <SidebarMenuItem>
                <SidebarMenuButton variant='windui' disabled>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && (
                        <span className='ml-auto rounded bg-sidebar-accent px-1.5 py-0.5 text-xs text-sidebar-accent-foreground'>{item.badge}</span>
                    )}
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    }

    const isActive = isActiveRoute(currentUrl, item.href, item.matchStrategy);

    return (
        <SidebarMenuItem>
            <SidebarMenuButton variant='windui' asChild isActive={isActive} tooltip={{ children: item.title }}>
                <Link href={item.href} prefetch>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && (
                        <span className='ml-auto rounded bg-sidebar-accent px-1.5 py-0.5 text-xs text-sidebar-accent-foreground'>{item.badge}</span>
                    )}
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

function NavSubMenuItem({ item, currentUrl }: { item: NavItem; currentUrl: string }) {
    if (!item.href) {
        return (
            <SidebarMenuSubItem>
                <SidebarMenuSubButton variant='windui'>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && (
                        <span className='ml-auto rounded bg-sidebar-accent px-1.5 py-0.5 text-xs text-sidebar-accent-foreground'>{item.badge}</span>
                    )}
                </SidebarMenuSubButton>
            </SidebarMenuSubItem>
        );
    }

    const isActive = isActiveRoute(currentUrl, item.href, item.matchStrategy);

    return (
        <SidebarMenuSubItem>
            <SidebarMenuSubButton variant='windui' asChild isActive={isActive} title={item.title}>
                <Link href={item.href} prefetch>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && (
                        <span className='ml-auto rounded bg-sidebar-accent px-1.5 py-0.5 text-xs text-sidebar-accent-foreground'>{item.badge}</span>
                    )}
                </Link>
            </SidebarMenuSubButton>
        </SidebarMenuSubItem>
    );
}

// Support both grouped and individual menu structures
export function NavMain({ groups = [] }: { items?: NavItem[]; groups?: NavGroup[] }) {
    const page = usePage();
    const currentUrl = page.url;

    return (
        <>
            {/* Render grouped menus */}
            {groups.map((group) => (
                <SidebarGroup key={group.title} className='px-2 py-0'>
                    <SidebarGroupLabel variant='windui'>{group.title}</SidebarGroupLabel>
                    <SidebarMenu>
                        {group.menu.map((item) => (
                            <NavMenuItem key={item.title} item={item} currentUrl={currentUrl} />
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
